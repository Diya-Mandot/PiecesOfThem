"""Extraction orchestration for chunk-level LLM datapoint capture."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from openai import OpenAI
from pydantic import ValidationError

from .config import PipelineConfig
from .db import connect
from .models import ExtractionResponse

PROMPT_VERSION = "2026-04-17-v1"
EXTRACTOR_NAME = "openai-responses"
PROMPT_PATH = Path(__file__).resolve().parent / "prompts" / "extraction_prompt.md"
EMPTY_RESULT_ISSUE_TYPE = "empty_result"


def _load_prompt_template() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _build_prompt(chunk_text: str) -> str:
    template = _load_prompt_template()
    return f"{template}\n\nChunk:\n{chunk_text}"


def _load_response_payload(output_text: str) -> dict[str, Any]:
    return json.loads(output_text)


def _store_datapoint(
    cursor: Any,
    *,
    extraction_run_id: int,
    source_document_id: int,
    chunk_id: int,
    datapoint: Any,
) -> None:
    cursor.execute(
        """
        INSERT INTO ingestion.extracted_datapoints (
          extraction_run_id, source_document_id, chunk_id, datapoint_type,
          schema_version, subject_label, disease_subtype, trial_program,
          value_json, confidence, evidence_quote, char_start, char_end
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            extraction_run_id,
            source_document_id,
            chunk_id,
            datapoint.datapoint_type,
            PROMPT_VERSION,
            datapoint.subject_label,
            datapoint.disease_subtype,
            datapoint.trial_program,
            datapoint.value.model_dump(mode="json"),
            datapoint.confidence,
            datapoint.evidence_quote,
            None,
            None,
        ),
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


def _rollback_before_failure_logging(connection: Any) -> None:
    try:
        connection.rollback()
    except Exception:
        # If rollback itself fails, we still try the failure-path writes below.
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


def _eligible_chunks(cursor: Any) -> list[tuple[int, int, str]]:
    cursor.execute(
        """
        SELECT dc.id, dc.source_document_id, dc.chunk_text
        FROM ingestion.document_chunks dc
        WHERE NOT EXISTS (
          SELECT 1
          FROM ingestion.extracted_datapoints ed
          WHERE ed.chunk_id = dc.id
        )
          AND NOT EXISTS (
            SELECT 1
            FROM ingestion.extraction_issues ei
            WHERE ei.chunk_id = dc.id
              AND ei.issue_type = %s
          )
        ORDER BY dc.id
        """,
        (EMPTY_RESULT_ISSUE_TYPE,),
    )
    return cursor.fetchall()


def run_extraction(config: PipelineConfig) -> int:
    """Run model extraction for chunks that do not yet have datapoints."""

    client = OpenAI(api_key=config.openai_api_key)
    inserted = 0

    with connect(config) as connection:
        with connection.cursor() as cursor:
            rows = _eligible_chunks(cursor)

            for chunk_id, source_document_id, chunk_text in rows:
                extraction_run_id = _mark_run_started(
                    cursor,
                    source_document_id=source_document_id,
                    model_name=config.openai_model,
                )
                connection.commit()
                raw_output: str | None = None

                try:
                    response = client.responses.create(
                        model=config.openai_model,
                        input=_build_prompt(chunk_text),
                    )
                    raw_output = response.output_text
                    if not raw_output:
                        raise ValueError("OpenAI response did not include output_text")

                    payload = _load_response_payload(raw_output)
                    result = ExtractionResponse.model_validate(payload)

                    for datapoint in result.datapoints:
                        _store_datapoint(
                            cursor,
                            extraction_run_id=extraction_run_id,
                            source_document_id=source_document_id,
                            chunk_id=chunk_id,
                            datapoint=datapoint,
                        )
                        inserted += 1

                    if not result.datapoints:
                        _record_empty_result(
                            cursor,
                            extraction_run_id=extraction_run_id,
                            source_document_id=source_document_id,
                            chunk_id=chunk_id,
                            raw_output=raw_output,
                        )

                    _mark_run_completed(cursor, extraction_run_id=extraction_run_id)
                    connection.commit()
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
