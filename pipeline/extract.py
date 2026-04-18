"""Extraction orchestration for frontend-native evidence fragments and claims."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from openai import OpenAI
from pydantic import ValidationError

from .config import PipelineConfig
from .db import connect
from .evidence import infer_treatment_status, store_claim, store_evidence_fragment
from .models import (
    ClaimSynthesisResponse,
    EvidenceFragment,
    EvidenceFragmentCandidate,
    EvidenceFragmentExtractionResponse,
)

PROMPT_VERSION = "2026-04-17-v3"
EXTRACTOR_NAME = "openai-responses"
FRAGMENT_PROMPT_PATH = Path(__file__).resolve().parent / "prompts" / "extraction_prompt.md"
CLAIM_PROMPT_PATH = Path(__file__).resolve().parent / "prompts" / "claim_synthesis_prompt.md"
EMPTY_RESULT_ISSUE_TYPE = "empty_result"
NO_NOVEL_DATAPOINTS_ISSUE_TYPE = "no_novel_datapoints"
CONTEXT_EXHAUSTED_ISSUE_TYPE = "context_exhausted"
SKIPPED_DOCUMENT_ISSUE_TYPE = "skipped_document"
TERMINAL_ISSUE_TYPES = (
    EMPTY_RESULT_ISSUE_TYPE,
    NO_NOVEL_DATAPOINTS_ISSUE_TYPE,
    CONTEXT_EXHAUSTED_ISSUE_TYPE,
    SKIPPED_DOCUMENT_ISSUE_TYPE,
)

VOCABULARY_MARKERS = (
    "alphabet",
    "fully verbal",
    "i love you",
    "language",
    "recite",
    "said",
    "say",
    "sing",
    "song",
    "speak",
    "speech",
    "verbal",
    "vocabulary",
    "word",
    "words",
)
RECOGNITION_MARKERS = (
    "dog's name",
    "familiar",
    "knew",
    "name",
    "named",
    "recogn",
    "remember",
    "voice",
)
DECLINE_MARKERS = (
    "decline",
    "declining",
    "lost",
    "loss",
    "no longer",
    "unable",
    "worse",
    "worsened",
)
LISTING_MARKERS = (
    "columns",
    "discussion columns",
    "explore more",
    "newsletter",
    "recent posts",
    "search for:",
    "toggle navigation",
)


@dataclass(frozen=True, slots=True)
class LoadedChunk:
    chunk_id: int
    chunk_index: int
    chunk_text: str


def _load_prompt_template(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _build_prompt(
    *,
    anchor_chunk_id: int,
    loaded_chunks: list[LoadedChunk],
    source_context: dict[str, Any],
    existing_fragments: list[dict[str, Any]],
) -> str:
    template = _load_prompt_template(FRAGMENT_PROMPT_PATH)
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
            "id": item.get("external_id"),
            "title": item["title"],
            "excerpt": item["excerpt"],
            "signal_domain": item["signal_domain"],
            "confidence": item.get("confidence"),
        }
        for item in existing_fragments
    ]
    prompt = (
        f"{template}\n\n"
        f"Anchor chunk id: {anchor_chunk_id}\n\n"
        "Source context:\n"
        f"{json.dumps(source_context, indent=2, sort_keys=True)}\n\n"
        "Existing evidence fragments for this anchor chunk:\n"
        f"{json.dumps(existing_payload, indent=2, sort_keys=True)}\n\n"
        "Loaded chunks:\n"
        f"{json.dumps(loaded_payload, indent=2, sort_keys=True)}"
    )
    return prompt


def _build_claim_synthesis_prompt(
    *,
    case_record: dict[str, Any],
    fragments: list[dict[str, Any]],
) -> str:
    template = _load_prompt_template(CLAIM_PROMPT_PATH)
    return (
        f"{template}\n\n"
        "Case record:\n"
        f"{json.dumps(case_record, indent=2, sort_keys=True)}\n\n"
        "Fragments:\n"
        f"{json.dumps(fragments, indent=2, sort_keys=True)}"
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
    extraction_run_id: int | None,
    source_document_id: int,
    chunk_id: int | None,
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
          FROM ingestion.evidence_fragment_chunks efc
          WHERE efc.chunk_id = dc.id
        )
          AND NOT EXISTS (
            SELECT 1
            FROM ingestion.extraction_issues ei
            WHERE ei.chunk_id = dc.id
              AND ei.issue_type IN (%s, %s, %s)
          )
          AND NOT EXISTS (
            SELECT 1
            FROM ingestion.extraction_issues ei
            WHERE ei.source_document_id = dc.source_document_id
              AND ei.issue_type = %s
          )
        ORDER BY dc.id
        """,
        (*TERMINAL_ISSUE_TYPES[:3], SKIPPED_DOCUMENT_ISSUE_TYPE),
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


def _map_frontend_source_type(seed_source_type: str | None, author_role: str | None) -> str:
    haystack = " ".join(filter(None, [seed_source_type, author_role])).lower()
    if "parent" in haystack or "caregiver" in haystack or "family" in haystack:
        return "Parent Journal"
    if "voice" in haystack or "audio" in haystack or "transcript" in haystack:
        return "Caregiver Transcript"
    if "clinic" in haystack or "hospital" in haystack or "summary" in haystack or "study" in haystack:
        return "Clinic Summary"
    if "journal" in haystack or "diary" in haystack:
        return "Parent Journal"
    if "forum" in haystack or "reddit" in haystack or "discord" in haystack:
        return "Forum Observation"
    return "Parent Journal"


def _map_modality(source_type: str) -> str:
    if source_type == "Caregiver Transcript":
        return "audio-transcript"
    if source_type == "Clinic Summary":
        return "summary"
    return "text"


def _load_source_context(cursor: Any, *, source_document_id: int) -> dict[str, Any]:
    cursor.execute(
        """
        SELECT ss.seed_id,
               ss.label,
               ss.subject_label,
               ss.disease_subtype,
               ss.trial_program,
               ss.intervention_class,
               ss.confirmed_participation,
               ss.named_publicly,
               ss.source_type,
               ss.author_role,
               ss.source_confidence,
               sd.source_url,
               sd.title
        FROM ingestion.source_documents sd
        INNER JOIN ingestion.seed_sources ss
          ON ss.id = sd.seed_source_id
        WHERE sd.id = %s
        """,
        (source_document_id,),
    )
    row = cursor.fetchone()
    if row is None:
        raise ValueError(f"Missing source context for source_document_id={source_document_id}")

    source_type = _map_frontend_source_type(row[8], row[9])
    context = {
        "case_id": row[0],
        "seed_id": row[0],
        "label": row[1],
        "subject_label": row[2],
        "disease_subtype": row[3],
        "trial_program": row[4],
        "intervention_class": row[5],
        "confirmed_participation": row[6],
        "named_publicly": row[7],
        "seed_source_type": row[8],
        "author_role": row[9],
        "source_confidence": row[10],
        "source_url": row[11],
        "document_title": row[12],
        "recommended_source_type": source_type,
        "recommended_modality": _map_modality(source_type),
    }
    context["treatment_status"] = infer_treatment_status(context)
    return context


def _load_existing_fragments_for_anchor(cursor: Any, *, anchor_chunk_id: int) -> list[dict[str, Any]]:
    cursor.execute(
        """
        SELECT ef.external_id,
               ef.title,
               ef.excerpt,
               ef.signal_domain,
               ef.confidence
        FROM ingestion.evidence_fragments ef
        INNER JOIN ingestion.evidence_fragment_chunks efc
          ON efc.evidence_fragment_id = ef.id
        WHERE efc.chunk_id = %s
        ORDER BY ef.id
        """,
        (anchor_chunk_id,),
    )
    rows = cursor.fetchall()
    return [
        {
            "external_id": row[0],
            "title": row[1],
            "excerpt": row[2],
            "signal_domain": row[3],
            "confidence": row[4],
        }
        for row in rows
    ]


def _load_existing_fragment_signatures(cursor: Any, *, source_document_id: int) -> set[tuple[str, str, str]]:
    cursor.execute(
        """
        SELECT title, excerpt, signal_domain
        FROM ingestion.evidence_fragments
        WHERE source_document_id = %s
        """,
        (source_document_id,),
    )
    return {
        (
            row[0].strip().lower(),
            row[1].strip().lower(),
            row[2].strip().lower(),
        )
        for row in cursor.fetchall()
    }


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


def _document_looks_like_listing(document_title: str | None, loaded_chunks: list[LoadedChunk]) -> bool:
    sample_parts = [document_title or ""]
    sample_parts.extend(chunk.chunk_text[:800] for chunk in loaded_chunks[:3])
    haystack = " ".join(sample_parts).lower()
    marker_count = sum(1 for marker in LISTING_MARKERS if marker in haystack)
    return marker_count >= 3


def _normalize_signal_domain(
    *,
    title: str,
    excerpt: str,
    signal_domain: str,
) -> str:
    haystack = f"{title} {excerpt}".lower()
    if any(marker in haystack for marker in RECOGNITION_MARKERS):
        return "recognition"
    if any(marker in haystack for marker in VOCABULARY_MARKERS):
        return "vocabulary"
    return signal_domain


def _title_looks_like_document_title(title: str, document_title: str | None) -> bool:
    if not document_title:
        return False
    normalized_title = " ".join(title.lower().split())
    normalized_document_title = " ".join(document_title.lower().split())
    return (
        normalized_title == normalized_document_title
        or normalized_title in normalized_document_title
        or normalized_document_title in normalized_title
    )


def _build_observation_title(*, signal_domain: str, excerpt: str) -> str:
    haystack = excerpt.lower()
    direction = "decline" if any(marker in haystack for marker in DECLINE_MARKERS) else "signal"
    match signal_domain:
        case "vocabulary":
            prefix = "Language decline" if direction == "decline" else "Language signal"
        case "recognition":
            prefix = "Recognition decline" if direction == "decline" else "Recognition signal"
        case "sleep":
            prefix = "Sleep decline" if direction == "decline" else "Sleep signal"
        case "behavior":
            prefix = "Behavior decline" if direction == "decline" else "Behavior signal"
        case _:
            prefix = "Motor decline" if direction == "decline" else "Motor signal"

    return f"{prefix} described by caregiver"


def _hydrate_fragment(
    fragment_payload: dict[str, Any] | EvidenceFragmentCandidate,
    *,
    source_context: dict[str, Any],
) -> EvidenceFragment:
    candidate = (
        fragment_payload
        if isinstance(fragment_payload, EvidenceFragmentCandidate)
        else EvidenceFragmentCandidate.model_validate(fragment_payload)
    )
    signal_domain = _normalize_signal_domain(
        title=candidate.title,
        excerpt=candidate.excerpt,
        signal_domain=candidate.signal_domain,
    )
    title = candidate.title
    if _title_looks_like_document_title(title, source_context.get("document_title")):
        title = _build_observation_title(signal_domain=signal_domain, excerpt=candidate.excerpt)

    return EvidenceFragment(
        date=candidate.date,
        source_type=source_context["recommended_source_type"],
        modality=source_context["recommended_modality"],
        title=title,
        excerpt=candidate.excerpt,
        tags=candidate.tags,
        signal_domain=signal_domain,
        confidence=candidate.confidence,
        supporting_chunk_ids=candidate.supporting_chunk_ids,
    )


def _validate_supporting_chunk_ids(
    fragment: EvidenceFragment,
    *,
    loaded_chunks: list[LoadedChunk],
) -> None:
    loaded_chunk_ids = {chunk.chunk_id for chunk in loaded_chunks}
    unsupported = [chunk_id for chunk_id in fragment.supporting_chunk_ids if chunk_id not in loaded_chunk_ids]
    if unsupported:
        raise ValueError(f"Fragment referenced unsupported chunk ids: {unsupported}")


def _fragment_signature(fragment: EvidenceFragment) -> tuple[str, str, str]:
    return (
        fragment.title.strip().lower(),
        fragment.excerpt.strip().lower(),
        fragment.signal_domain.strip().lower(),
    )


def _build_raw_ref(source_context: dict[str, Any], anchor_chunk_id: int) -> str:
    source_url = source_context.get("source_url") or source_context.get("seed_id")
    return f"{source_url}#chunk-{anchor_chunk_id}"


def run_extraction(config: PipelineConfig) -> int:
    """Run model extraction for chunks that do not yet have evidence fragments."""

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
                    source_context = _load_source_context(
                        cursor,
                        source_document_id=source_document_id,
                    )
                    if _document_looks_like_listing(
                        source_context.get("document_title"),
                        document_chunks,
                    ):
                        _record_issue(
                            cursor,
                            extraction_run_id=extraction_run_id,
                            source_document_id=source_document_id,
                            chunk_id=chunk_id,
                            issue_type=SKIPPED_DOCUMENT_ISSUE_TYPE,
                            message="Skipped document because it appears to be a listing or hub page",
                            raw_output=None,
                        )
                        _mark_run_completed(cursor, extraction_run_id=extraction_run_id)
                        connection.commit()
                        continue
                    loaded_chunks = [
                        LoadedChunk(
                            chunk_id=chunk_id,
                            chunk_index=chunk_index,
                            chunk_text=chunk_text,
                        )
                    ]
                    existing_fragments = _load_existing_fragments_for_anchor(
                        cursor,
                        anchor_chunk_id=chunk_id,
                    )
                    existing_signatures = _load_existing_fragment_signatures(
                        cursor,
                        source_document_id=source_document_id,
                    )
                    hops_used = 0

                    while True:
                        prompt = _build_prompt(
                            anchor_chunk_id=chunk_id,
                            loaded_chunks=loaded_chunks,
                            source_context=source_context,
                            existing_fragments=existing_fragments,
                        )
                        raw_output = _extract_output_text_from_response(
                            client,
                            model=config.openai_model,
                            prompt=prompt,
                        )
                        decision = EvidenceFragmentExtractionResponse.model_validate(
                            _load_response_payload(raw_output)
                        )

                        if decision.action == "request_more_context":
                            expanded_chunks = _expand_loaded_chunks(
                                loaded_chunks=loaded_chunks,
                                requested_directions=decision.requested_directions,
                                available_chunks=document_chunks,
                            )
                            if hops_used >= config.max_adjacent_hops or len(expanded_chunks) == len(loaded_chunks):
                                _record_issue(
                                    cursor,
                                    extraction_run_id=extraction_run_id,
                                    source_document_id=source_document_id,
                                    chunk_id=chunk_id,
                                    issue_type=CONTEXT_EXHAUSTED_ISSUE_TYPE,
                                    message="Extraction exhausted adjacent context without a final answer",
                                    raw_output=raw_output,
                                )
                                _mark_run_completed(cursor, extraction_run_id=extraction_run_id)
                                connection.commit()
                                break

                            loaded_chunks = expanded_chunks
                            hops_used += 1
                            continue

                        novel_insertions = 0
                        for candidate in decision.fragments:
                            fragment = _hydrate_fragment(
                                candidate,
                                source_context=source_context,
                            )
                            _validate_supporting_chunk_ids(
                                fragment,
                                loaded_chunks=loaded_chunks,
                            )
                            signature = _fragment_signature(fragment)
                            if signature in existing_signatures:
                                continue

                            store_evidence_fragment(
                                cursor,
                                source_document_id=source_document_id,
                                case_id=source_context["case_id"],
                                raw_ref=_build_raw_ref(source_context, chunk_id),
                                treatment_status=source_context["treatment_status"],
                                treatment_basis="seed_provenance",
                                trial_program=source_context.get("trial_program"),
                                intervention_class=source_context.get("intervention_class"),
                                fragment=fragment,
                            )
                            existing_signatures.add(signature)
                            novel_insertions += 1
                            inserted += 1

                        if not decision.fragments:
                            _record_issue(
                                cursor,
                                extraction_run_id=extraction_run_id,
                                source_document_id=source_document_id,
                                chunk_id=chunk_id,
                                issue_type=EMPTY_RESULT_ISSUE_TYPE,
                                message="Valid extraction returned zero evidence fragments",
                                raw_output=raw_output,
                            )
                        elif novel_insertions == 0:
                            _record_issue(
                                cursor,
                                extraction_run_id=extraction_run_id,
                                source_document_id=source_document_id,
                                chunk_id=chunk_id,
                                issue_type=NO_NOVEL_DATAPOINTS_ISSUE_TYPE,
                                message="Extraction returned no novel evidence fragments for anchor chunk",
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


def _load_cases_for_claim_synthesis(cursor: Any) -> list[dict[str, Any]]:
    cursor.execute(
        """
        SELECT ef.case_id,
               MIN(ss.label),
               MIN(ss.disease_subtype),
               MIN(COALESCE(ef.trial_program, ss.trial_program)),
               MIN(ef.treatment_status)
        FROM ingestion.evidence_fragments ef
        INNER JOIN ingestion.source_documents sd
          ON sd.id = ef.source_document_id
        INNER JOIN ingestion.seed_sources ss
          ON ss.id = sd.seed_source_id
        WHERE NOT EXISTS (
          SELECT 1
          FROM ingestion.claims c
          WHERE c.case_id = ef.case_id
        )
        GROUP BY ef.case_id
        ORDER BY ef.case_id
        """
    )
    return [
        {
            "case_id": row[0],
            "label": row[1],
            "disease_subtype": row[2],
            "trial_program": row[3],
            "treatment_status": row[4],
        }
        for row in cursor.fetchall()
    ]


def _load_fragments_for_case(cursor: Any, *, case_id: str) -> list[dict[str, Any]]:
    cursor.execute(
        """
        SELECT external_id,
               source_document_id,
               fragment_date,
               source_type,
               title,
               excerpt,
               signal_domain,
               confidence
        FROM ingestion.evidence_fragments
        WHERE case_id = %s
        ORDER BY fragment_date, external_id
        """,
        (case_id,),
    )
    return [
        {
            "id": row[0],
            "source_document_id": row[1],
            "date": row[2],
            "source_type": row[3],
            "title": row[4],
            "excerpt": row[5],
            "signal_domain": row[6],
            "confidence": row[7],
        }
        for row in cursor.fetchall()
    ]


def synthesize_claims(config: PipelineConfig) -> int:
    """Synthesize reviewer-facing claims from stored evidence fragments."""

    client = OpenAI(api_key=config.openai_api_key)
    inserted = 0

    with connect(config) as connection:
        with connection.cursor() as cursor:
            cases = _load_cases_for_claim_synthesis(cursor)

            for case_record in cases:
                fragments = _load_fragments_for_case(cursor, case_id=case_record["case_id"])
                if not fragments:
                    continue

                prompt = _build_claim_synthesis_prompt(
                    case_record=case_record,
                    fragments=fragments,
                )
                raw_output: str | None = None

                try:
                    raw_output = _extract_output_text_from_response(
                        client,
                        model=config.openai_model,
                        prompt=prompt,
                    )
                    response = ClaimSynthesisResponse.model_validate(
                        _load_response_payload(raw_output)
                    )

                    existing_signatures: set[tuple[str, str, str]] = set()
                    for claim in response.claims:
                        signature = (
                            claim.statement.strip().lower(),
                            claim.domain,
                            claim.trend,
                        )
                        if signature in existing_signatures:
                            continue

                        store_claim(
                            cursor,
                            case_id=case_record["case_id"],
                            treatment_status=case_record["treatment_status"],
                            trial_program=case_record.get("trial_program"),
                            claim=claim,
                        )
                        existing_signatures.add(signature)
                        inserted += 1

                    connection.commit()
                except (json.JSONDecodeError, ValidationError, ValueError) as exc:
                    _rollback_before_failure_logging(connection)
                    first_source_document_id = fragments[0]["source_document_id"]
                    _record_issue(
                        cursor,
                        extraction_run_id=None,
                        source_document_id=first_source_document_id,
                        chunk_id=None,
                        issue_type=type(exc).__name__,
                        message=f"Claim synthesis failed for case {case_record['case_id']}: {exc}",
                        raw_output=raw_output,
                    )
                    connection.commit()

    return inserted
