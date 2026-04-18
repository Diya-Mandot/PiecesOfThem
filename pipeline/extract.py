"""Extraction orchestration for chunk-level LLM datapoint capture."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from openai import OpenAI
from pydantic import ValidationError
from psycopg.types.json import Jsonb

from .config import PipelineConfig
from .db import connect
from .models import ExtractedDatapoint, ExtractionDecision

PROMPT_VERSION = "2026-04-17-v2"
EXTRACTOR_NAME = "openai-responses"
PROMPT_PATH = Path(__file__).resolve().parent / "prompts" / "extraction_prompt.md"
EMPTY_RESULT_ISSUE_TYPE = "empty_result"
NO_NOVEL_DATAPOINTS_ISSUE_TYPE = "no_novel_datapoints"
CONTEXT_EXHAUSTED_ISSUE_TYPE = "context_exhausted"
TERMINAL_ISSUE_TYPES = (
    EMPTY_RESULT_ISSUE_TYPE,
    NO_NOVEL_DATAPOINTS_ISSUE_TYPE,
    CONTEXT_EXHAUSTED_ISSUE_TYPE,
)


@dataclass(frozen=True, slots=True)
class LoadedChunk:
    chunk_id: int
    chunk_index: int
    chunk_text: str


def _load_prompt_template() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _build_prompt(
    *,
    anchor_chunk_id: int,
    loaded_chunks: list[LoadedChunk],
    existing_datapoints: list[dict[str, Any]],
) -> str:
    template = _load_prompt_template()
    loaded_payload = [
        {
            "chunk_id": chunk.chunk_id,
            "chunk_index": chunk.chunk_index,
            "chunk_text": chunk.chunk_text,
        }
        for chunk in loaded_chunks
    ]
    existing_payload = [
        {
            "datapoint_type": item["datapoint_type"],
            "subject_label": item.get("subject_label"),
            "disease_subtype": item.get("disease_subtype"),
            "trial_program": item.get("trial_program"),
            "confidence": item.get("confidence"),
            "evidence_quote": item["evidence_quote"],
            "value": item.get("value"),
        }
        for item in existing_datapoints
    ]
    return (
        f"{template}\n\n"
        f"Anchor chunk id: {anchor_chunk_id}\n\n"
        "Existing datapoints for this anchor chunk:\n"
        f"{json.dumps(existing_payload, indent=2, sort_keys=True)}\n\n"
        "Loaded chunks:\n"
        f"{json.dumps(loaded_payload, indent=2, sort_keys=True)}"
    )


def _load_response_payload(output_text: str) -> dict[str, Any]:
    return json.loads(output_text)


def _extract_output_text_from_response(client: OpenAI, *, model: str, prompt: str) -> str:
    """Return text output from the available OpenAI API surface."""

    if hasattr(client, "responses"):
        response = client.responses.create(model=model, input=prompt)
        output_text = getattr(response, "output_text", None)
        if output_text:
            return output_text
        raise ValueError("OpenAI response did not include output_text")

    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
    )
    if not response.choices:
        raise ValueError("OpenAI chat completion did not include any choices")

    message_content = response.choices[0].message.content
    if isinstance(message_content, str) and message_content:
        return message_content

    if isinstance(message_content, list):
        parts: list[str] = []
        for item in message_content:
            text_value = getattr(item, "text", None)
            if text_value:
                parts.append(text_value)
        if parts:
            return "\n".join(parts)

    raise ValueError("OpenAI chat completion did not include text content")


def _compute_dedupe_key(datapoint: ExtractedDatapoint) -> str:
    payload = {
        "datapoint_type": datapoint.datapoint_type,
        "subject_label": datapoint.subject_label,
        "disease_subtype": datapoint.disease_subtype,
        "trial_program": datapoint.trial_program,
        "value": datapoint.value.model_dump(mode="json"),
    }
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _store_datapoint(
    cursor: Any,
    *,
    extraction_run_id: int,
    source_document_id: int,
    datapoint: ExtractedDatapoint,
    dedupe_key: str | None = None,
    anchor_chunk_id: int | None = None,
) -> None:
    cursor.execute(
        """
        INSERT INTO ingestion.extracted_datapoints (
          extraction_run_id, source_document_id, datapoint_type, schema_version,
          dedupe_key, subject_label, disease_subtype, trial_program,
          value_json, confidence, evidence_quote, char_start, char_end
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            extraction_run_id,
            source_document_id,
            datapoint.datapoint_type,
            PROMPT_VERSION,
            dedupe_key or _compute_dedupe_key(datapoint),
            datapoint.subject_label,
            datapoint.disease_subtype,
            datapoint.trial_program,
            Jsonb(datapoint.value.model_dump(mode="json")),
            datapoint.confidence,
            datapoint.evidence_quote,
            None,
            None,
        ),
    )
    datapoint_id = cursor.fetchone()[0]
    supporting_chunk_ids = list(datapoint.supporting_chunk_ids)
    if anchor_chunk_id is not None and anchor_chunk_id not in supporting_chunk_ids:
        supporting_chunk_ids.insert(0, anchor_chunk_id)

    for chunk_order, chunk_id in enumerate(dict.fromkeys(supporting_chunk_ids)):
        cursor.execute(
            """
            INSERT INTO ingestion.extracted_datapoint_chunks (
              extracted_datapoint_id, source_document_id, chunk_id, evidence_role, chunk_order
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (datapoint_id, source_document_id, chunk_id, "supporting", chunk_order),
        )


def _mark_run_failed(
    cursor: Any,
    *,
    extraction_run_id: int,
    message: str,
) -> None:
    cursor.execute(
        """
        UPDATE ingestion.extraction_runs
        SET status = 'failed',
            completed_at = NOW(),
            error_message = %s
        WHERE id = %s
        """,
        (message, extraction_run_id),
    )


def _mark_run_completed(cursor: Any, *, extraction_run_id: int) -> None:
    cursor.execute(
        """
        UPDATE ingestion.extraction_runs
        SET status = 'completed',
            completed_at = NOW()
        WHERE id = %s
        """,
        (extraction_run_id,),
    )


def _mark_run_started(
    cursor: Any,
    *,
    source_document_id: int,
    model_name: str,
) -> int:
    cursor.execute(
        """
        INSERT INTO ingestion.extraction_runs (
          source_document_id, extractor_name, model_name, prompt_version, status
        )
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            source_document_id,
            EXTRACTOR_NAME,
            model_name,
            PROMPT_VERSION,
            "started",
        ),
    )
    return cursor.fetchone()[0]


def _record_issue(
    cursor: Any,
    *,
    extraction_run_id: int,
    source_document_id: int,
    chunk_id: int,
    issue_type: str,
    message: str,
    raw_output: str | None,
) -> None:
    cursor.execute(
        """
        INSERT INTO ingestion.extraction_issues (
          extraction_run_id, source_document_id, chunk_id, issue_type, raw_output, message
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (extraction_run_id, source_document_id, chunk_id, issue_type, raw_output, message),
    )


def _record_empty_result(
    cursor: Any,
    *,
    extraction_run_id: int,
    source_document_id: int,
    chunk_id: int,
    raw_output: str,
) -> None:
    _record_issue(
        cursor,
        extraction_run_id=extraction_run_id,
        source_document_id=source_document_id,
        chunk_id=chunk_id,
        issue_type=EMPTY_RESULT_ISSUE_TYPE,
        message="Valid extraction returned zero datapoints",
        raw_output=raw_output,
    )


def _record_no_novel_datapoints(
    cursor: Any,
    *,
    extraction_run_id: int,
    source_document_id: int,
    chunk_id: int,
    raw_output: str,
) -> None:
    _record_issue(
        cursor,
        extraction_run_id=extraction_run_id,
        source_document_id=source_document_id,
        chunk_id=chunk_id,
        issue_type=NO_NOVEL_DATAPOINTS_ISSUE_TYPE,
        message="Extraction returned no novel datapoints for anchor chunk",
        raw_output=raw_output,
    )


def _record_context_exhausted(
    cursor: Any,
    *,
    extraction_run_id: int,
    source_document_id: int,
    chunk_id: int,
    raw_output: str,
) -> None:
    _record_issue(
        cursor,
        extraction_run_id=extraction_run_id,
        source_document_id=source_document_id,
        chunk_id=chunk_id,
        issue_type=CONTEXT_EXHAUSTED_ISSUE_TYPE,
        message="Extraction exhausted adjacent context without a final answer",
        raw_output=raw_output,
    )


def _rollback_before_failure_logging(connection: Any) -> None:
    try:
        connection.rollback()
    except Exception:
        pass


def _handle_chunk_failure(
    connection: Any,
    *,
    extraction_run_id: int,
    source_document_id: int,
    chunk_id: int,
    issue_type: str,
    message: str,
    raw_output: str | None,
) -> None:
    _rollback_before_failure_logging(connection)
    with connection.cursor() as cursor:
        _mark_run_failed(
            cursor,
            extraction_run_id=extraction_run_id,
            message=message,
        )
        _record_issue(
            cursor,
            extraction_run_id=extraction_run_id,
            source_document_id=source_document_id,
            chunk_id=chunk_id,
            issue_type=issue_type,
            message=message,
            raw_output=raw_output,
        )
    connection.commit()


def _eligible_chunks(cursor: Any) -> list[tuple[int, int, int, str]]:
    cursor.execute(
        """
        SELECT dc.id, dc.source_document_id, dc.chunk_index, dc.chunk_text
        FROM ingestion.document_chunks dc
        WHERE NOT EXISTS (
          SELECT 1
          FROM ingestion.extracted_datapoint_chunks edc
          WHERE edc.chunk_id = dc.id
        )
          AND NOT EXISTS (
            SELECT 1
            FROM ingestion.extraction_issues ei
            WHERE ei.chunk_id = dc.id
              AND ei.issue_type IN (%s, %s, %s)
          )
        ORDER BY dc.id
        """,
        TERMINAL_ISSUE_TYPES,
    )
    return cursor.fetchall()


def _load_document_chunks(cursor: Any, *, source_document_id: int) -> list[LoadedChunk]:
    cursor.execute(
        """
        SELECT id, chunk_index, chunk_text
        FROM ingestion.document_chunks
        WHERE source_document_id = %s
        ORDER BY chunk_index
        """,
        (source_document_id,),
    )
    return [LoadedChunk(chunk_id=row[0], chunk_index=row[1], chunk_text=row[2]) for row in cursor.fetchall()]


def _load_existing_datapoints_for_anchor(cursor: Any, *, anchor_chunk_id: int) -> list[dict[str, Any]]:
    cursor.execute(
        """
        SELECT ed.dedupe_key,
               ed.datapoint_type,
               ed.subject_label,
               ed.disease_subtype,
               ed.trial_program,
               ed.confidence,
               ed.evidence_quote,
               ed.value_json
        FROM ingestion.extracted_datapoints ed
        INNER JOIN ingestion.extracted_datapoint_chunks edc
          ON edc.extracted_datapoint_id = ed.id
        WHERE edc.chunk_id = %s
        ORDER BY ed.id
        """,
        (anchor_chunk_id,),
    )
    rows = cursor.fetchall()
    return [
        {
            "dedupe_key": row[0],
            "datapoint_type": row[1],
            "subject_label": row[2],
            "disease_subtype": row[3],
            "trial_program": row[4],
            "confidence": row[5],
            "evidence_quote": row[6],
            "value": row[7],
        }
        for row in rows
    ]


def _extract_decision(client: OpenAI, *, model: str, prompt: str) -> ExtractionDecision:
    raw_output = _extract_output_text_from_response(client, model=model, prompt=prompt)
    return ExtractionDecision.model_validate(_load_response_payload(raw_output))


def _expand_loaded_chunks(
    *,
    loaded_chunks: list[LoadedChunk],
    requested_directions: list[str],
    available_chunks: list[LoadedChunk],
) -> list[LoadedChunk]:
    if not loaded_chunks:
        return loaded_chunks

    ordered_loaded = sorted(loaded_chunks, key=lambda chunk: chunk.chunk_index)
    loaded_ids = {chunk.chunk_id for chunk in ordered_loaded}
    min_index = ordered_loaded[0].chunk_index
    max_index = ordered_loaded[-1].chunk_index
    index_map = {chunk.chunk_index: chunk for chunk in available_chunks}
    expanded = list(ordered_loaded)

    if "left" in requested_directions:
        candidate = index_map.get(min_index - 1)
        if candidate and candidate.chunk_id not in loaded_ids:
            expanded.append(candidate)
            loaded_ids.add(candidate.chunk_id)

    if "right" in requested_directions:
        candidate = index_map.get(max_index + 1)
        if candidate and candidate.chunk_id not in loaded_ids:
            expanded.append(candidate)

    return sorted(expanded, key=lambda chunk: chunk.chunk_index)


def _validate_supporting_chunk_ids(
    datapoint: ExtractedDatapoint,
    *,
    loaded_chunks: list[LoadedChunk],
) -> None:
    loaded_chunk_ids = {chunk.chunk_id for chunk in loaded_chunks}
    unsupported = [chunk_id for chunk_id in datapoint.supporting_chunk_ids if chunk_id not in loaded_chunk_ids]
    if unsupported:
        raise ValueError(f"Datapoint referenced unsupported chunk ids: {unsupported}")


def run_extraction(config: PipelineConfig) -> int:
    """Run model extraction for chunks that do not yet have datapoints."""

    client = OpenAI(api_key=config.openai_api_key)
    inserted = 0

    with connect(config) as connection:
        with connection.cursor() as cursor:
            rows = _eligible_chunks(cursor)

            for chunk_id, source_document_id, chunk_index, chunk_text in rows:
                extraction_run_id = _mark_run_started(
                    cursor,
                    source_document_id=source_document_id,
                    model_name=config.openai_model,
                )
                connection.commit()
                raw_output: str | None = None

                try:
                    document_chunks = _load_document_chunks(
                        cursor,
                        source_document_id=source_document_id,
                    )
                    loaded_chunks = [
                        LoadedChunk(
                            chunk_id=chunk_id,
                            chunk_index=chunk_index,
                            chunk_text=chunk_text,
                        )
                    ]
                    existing_datapoints = _load_existing_datapoints_for_anchor(
                        cursor,
                        anchor_chunk_id=chunk_id,
                    )
                    existing_dedupe_keys = {
                        item["dedupe_key"]
                        for item in existing_datapoints
                        if item.get("dedupe_key")
                    }
                    hops_used = 0

                    while True:
                        prompt = _build_prompt(
                            anchor_chunk_id=chunk_id,
                            loaded_chunks=loaded_chunks,
                            existing_datapoints=existing_datapoints,
                        )
                        raw_output = _extract_output_text_from_response(
                            client,
                            model=config.openai_model,
                            prompt=prompt,
                        )
                        decision = ExtractionDecision.model_validate(_load_response_payload(raw_output))

                        if decision.action == "request_more_context":
                            expanded_chunks = _expand_loaded_chunks(
                                loaded_chunks=loaded_chunks,
                                requested_directions=decision.requested_directions,
                                available_chunks=document_chunks,
                            )
                            if hops_used >= config.max_adjacent_hops or len(expanded_chunks) == len(loaded_chunks):
                                _record_context_exhausted(
                                    cursor,
                                    extraction_run_id=extraction_run_id,
                                    source_document_id=source_document_id,
                                    chunk_id=chunk_id,
                                    raw_output=raw_output,
                                )
                                _mark_run_completed(cursor, extraction_run_id=extraction_run_id)
                                connection.commit()
                                break

                            loaded_chunks = expanded_chunks
                            hops_used += 1
                            continue

                        novel_insertions = 0
                        for datapoint in decision.datapoints:
                            _validate_supporting_chunk_ids(
                                datapoint,
                                loaded_chunks=loaded_chunks,
                            )
                            dedupe_key = _compute_dedupe_key(datapoint)
                            if dedupe_key in existing_dedupe_keys:
                                continue

                            _store_datapoint(
                                cursor,
                                extraction_run_id=extraction_run_id,
                                source_document_id=source_document_id,
                                datapoint=datapoint,
                                dedupe_key=dedupe_key,
                                anchor_chunk_id=chunk_id,
                            )
                            existing_dedupe_keys.add(dedupe_key)
                            novel_insertions += 1
                            inserted += 1

                        if not decision.datapoints:
                            _record_empty_result(
                                cursor,
                                extraction_run_id=extraction_run_id,
                                source_document_id=source_document_id,
                                chunk_id=chunk_id,
                                raw_output=raw_output,
                            )
                        elif novel_insertions == 0:
                            _record_no_novel_datapoints(
                                cursor,
                                extraction_run_id=extraction_run_id,
                                source_document_id=source_document_id,
                                chunk_id=chunk_id,
                                raw_output=raw_output,
                            )

                        _mark_run_completed(cursor, extraction_run_id=extraction_run_id)
                        connection.commit()
                        break
                except (json.JSONDecodeError, ValidationError, ValueError) as exc:
                    _handle_chunk_failure(
                        connection,
                        extraction_run_id=extraction_run_id,
                        source_document_id=source_document_id,
                        chunk_id=chunk_id,
                        issue_type=type(exc).__name__,
                        message=str(exc),
                        raw_output=raw_output,
                    )
                except Exception as exc:
                    _handle_chunk_failure(
                        connection,
                        extraction_run_id=extraction_run_id,
                        source_document_id=source_document_id,
                        chunk_id=chunk_id,
                        issue_type=type(exc).__name__,
                        message=str(exc),
                        raw_output=raw_output,
                    )

    return inserted
