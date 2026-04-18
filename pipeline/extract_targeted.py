"""Extract only from chunks belonging to specific seed IDs."""
import sys
import time
sys.path.insert(0, '.')

from pipeline.config import load_config
from pipeline.db import connect
from pipeline.evidence import store_evidence_fragment
from pipeline.extract import (
    CONTEXT_EXHAUSTED_ISSUE_TYPE,
    EMPTY_RESULT_ISSUE_TYPE,
    NO_NOVEL_DATAPOINTS_ISSUE_TYPE,
    SKIPPED_DOCUMENT_ISSUE_TYPE,
    LoadedChunk,
    _build_prompt,
    _build_raw_ref,
    _document_looks_like_listing,
    _expand_loaded_chunks,
    _extract_output_text_from_response,
    _fragment_signature,
    _handle_chunk_failure,
    _hydrate_fragment,
    _load_document_chunks,
    _load_existing_fragment_signatures,
    _load_existing_fragments_for_anchor,
    _load_source_context,
    _mark_run_completed,
    _mark_run_started,
    _record_issue,
    _validate_supporting_chunk_ids,
)
from pipeline.models import EvidenceFragmentExtractionResponse
from openai import OpenAI, RateLimitError as OpenAIRateLimitError
import json
from pydantic import ValidationError

SEED_IDS = (
    'PSS-001', 'PSS-002', 'PSS-003', 'PSS-004', 'PSS-005',
    'PSS-006', 'PSS-007', 'PSS-008', 'PSS-009', 'PSS-010',
    'PSS-011', 'PSS-012', 'PSS-013',
    'TPS-001', 'TPS-002', 'TPS-003', 'TPS-004', 'TPS-005', 'TPS-006',
)

RATE_LIMIT_SLEEP = 22       # seconds between chunks (free tier = ~3 RPM)
RATE_LIMIT_RETRY_SLEEP = 65  # seconds to wait after a 429 before retrying same chunk


def get_target_chunks(cursor):
    cursor.execute("""
        SELECT dc.id, dc.source_document_id, dc.chunk_index, dc.chunk_text
        FROM ingestion.document_chunks dc
        JOIN ingestion.source_documents sd ON sd.id = dc.source_document_id
        JOIN ingestion.seed_sources ss ON ss.id = sd.seed_source_id
        WHERE ss.seed_id = ANY(%s)
        AND NOT EXISTS (
            SELECT 1 FROM ingestion.evidence_fragment_chunks efc WHERE efc.chunk_id = dc.id
        )
        AND NOT EXISTS (
            SELECT 1 FROM ingestion.extraction_issues ei
            WHERE ei.chunk_id = dc.id
            AND ei.issue_type IN ('skipped_document', 'empty_result', 'no_novel_datapoints', 'context_exhausted')
        )
        AND NOT EXISTS (
            SELECT 1 FROM ingestion.extraction_issues ei
            WHERE ei.source_document_id = dc.source_document_id
            AND ei.issue_type = 'skipped_document'
        )
        ORDER BY dc.id
    """, (list(SEED_IDS),))
    return cursor.fetchall()


def main():
    config = load_config()
    client = OpenAI(api_key=config.openai_api_key, max_retries=0, timeout=120)
    inserted = 0

    with connect(config) as connection:
        with connection.cursor() as cursor:
            rows = get_target_chunks(cursor)
            print(f"Found {len(rows)} target chunks to extract from {SEED_IDS}")

            for chunk_id, source_document_id, chunk_index, chunk_text in rows:
                print(f"  Processing chunk {chunk_id} (doc {source_document_id}, idx {chunk_index})...")

                extraction_run_id = _mark_run_started(
                    cursor,
                    source_document_id=source_document_id,
                    model_name=config.openai_model,
                )
                connection.commit()
                raw_output = None

                try:
                    document_chunks = _load_document_chunks(cursor, source_document_id=source_document_id)
                    source_context = _load_source_context(cursor, source_document_id=source_document_id)

                    if _document_looks_like_listing(source_context.get("document_title"), document_chunks):
                        _record_issue(cursor, extraction_run_id=extraction_run_id,
                            source_document_id=source_document_id, chunk_id=chunk_id,
                            issue_type=SKIPPED_DOCUMENT_ISSUE_TYPE,
                            message="Skipped document because it appears to be a listing or hub page",
                            raw_output=None)
                        _mark_run_completed(cursor, extraction_run_id=extraction_run_id)
                        connection.commit()
                        continue

                    loaded_chunks = [LoadedChunk(chunk_id=chunk_id, chunk_index=chunk_index, chunk_text=chunk_text)]
                    existing_fragments = _load_existing_fragments_for_anchor(cursor, anchor_chunk_id=chunk_id)
                    existing_signatures = _load_existing_fragment_signatures(cursor, source_document_id=source_document_id)
                    hops_used = 0

                    while True:
                        prompt = _build_prompt(
                            anchor_chunk_id=chunk_id,
                            loaded_chunks=loaded_chunks,
                            source_context=source_context,
                            existing_fragments=existing_fragments,
                        )
                        for attempt in range(5):
                            try:
                                raw_output = _extract_output_text_from_response(client, model=config.openai_model, prompt=prompt)
                                break
                            except OpenAIRateLimitError:
                                if attempt < 4:
                                    print(f"    Rate limited — waiting {RATE_LIMIT_RETRY_SLEEP}s (attempt {attempt + 1}/5)...")
                                    time.sleep(RATE_LIMIT_RETRY_SLEEP)
                                else:
                                    raise
                        decision = EvidenceFragmentExtractionResponse.model_validate(json.loads(raw_output))

                        if decision.action == "request_more_context":
                            expanded_chunks = _expand_loaded_chunks(
                                loaded_chunks=loaded_chunks,
                                requested_directions=decision.requested_directions,
                                available_chunks=document_chunks,
                            )
                            if hops_used >= config.max_adjacent_hops or len(expanded_chunks) == len(loaded_chunks):
                                _record_issue(cursor, extraction_run_id=extraction_run_id,
                                    source_document_id=source_document_id, chunk_id=chunk_id,
                                    issue_type=CONTEXT_EXHAUSTED_ISSUE_TYPE,
                                    message="Extraction exhausted adjacent context without a final answer",
                                    raw_output=raw_output)
                                _mark_run_completed(cursor, extraction_run_id=extraction_run_id)
                                connection.commit()
                                break
                            loaded_chunks = expanded_chunks
                            hops_used += 1
                            continue

                        novel = 0
                        for candidate in decision.fragments:
                            fragment = _hydrate_fragment(candidate, source_context=source_context)
                            _validate_supporting_chunk_ids(fragment, loaded_chunks=loaded_chunks)
                            sig = _fragment_signature(fragment)
                            if sig in existing_signatures:
                                continue
                            store_evidence_fragment(cursor, source_document_id=source_document_id,
                                case_id=source_context["case_id"],
                                raw_ref=_build_raw_ref(source_context, chunk_id),
                                treatment_status=source_context["treatment_status"],
                                treatment_basis="seed_provenance",
                                trial_program=source_context.get("trial_program"),
                                intervention_class=source_context.get("intervention_class"),
                                fragment=fragment,
                            )
                            existing_signatures.add(sig)
                            novel += 1
                            inserted += 1
                            print(f"    + Fragment: {fragment.title[:60]}")

                        if not decision.fragments:
                            _record_issue(cursor, extraction_run_id=extraction_run_id,
                                source_document_id=source_document_id, chunk_id=chunk_id,
                                issue_type=EMPTY_RESULT_ISSUE_TYPE,
                                message="Valid extraction returned zero evidence fragments",
                                raw_output=raw_output)
                        elif novel == 0:
                            _record_issue(cursor, extraction_run_id=extraction_run_id,
                                source_document_id=source_document_id, chunk_id=chunk_id,
                                issue_type=NO_NOVEL_DATAPOINTS_ISSUE_TYPE,
                                message="Extraction returned no novel evidence fragments for anchor chunk",
                                raw_output=raw_output)

                        _mark_run_completed(cursor, extraction_run_id=extraction_run_id)
                        connection.commit()
                        break

                except (json.JSONDecodeError, ValidationError, ValueError) as exc:
                    print(f"    SCHEMA ERROR [{type(exc).__name__}]: {exc}")
                    _handle_chunk_failure(connection, extraction_run_id=extraction_run_id,
                        source_document_id=source_document_id, chunk_id=chunk_id,
                        issue_type=type(exc).__name__, message=str(exc), raw_output=raw_output)
                except Exception as exc:
                    print(f"    ERROR [{type(exc).__name__}]: {str(exc)[:120]}")
                    _handle_chunk_failure(connection, extraction_run_id=extraction_run_id,
                        source_document_id=source_document_id, chunk_id=chunk_id,
                        issue_type=type(exc).__name__, message=str(exc), raw_output=raw_output)

                time.sleep(RATE_LIMIT_SLEEP)

    print(f"\nDone. Inserted {inserted} evidence fragments from {SEED_IDS}")


if __name__ == "__main__":
    main()
