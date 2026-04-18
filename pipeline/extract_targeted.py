"""Extract only from chunks belonging to specific seed IDs."""
import sys
sys.path.insert(0, '.')

from pipeline.config import load_config
from pipeline.evidence import store_evidence_fragment
from pipeline.extract import (
    _build_raw_ref,
    _document_looks_like_listing,
    _fragment_signature,
    _hydrate_fragment,
    _load_document_chunks,
    _load_source_context,
    _mark_run_completed,
    _mark_run_started,
    _record_issue,
    _validate_supporting_chunk_ids,
    EMPTY_RESULT_ISSUE_TYPE,
    NO_NOVEL_DATAPOINTS_ISSUE_TYPE,
)
from pipeline.chunking import chunk_pending_documents
from pipeline.db import connect
import json
from openai import OpenAI
from pipeline.models import ExtractionDecision

SEED_IDS = ('PSS-012', 'PSS-013')

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
            AND ei.issue_type IN ('skipped_document', 'schema-error', 'no-datapoints')
        )
        ORDER BY dc.id
    """, (list(SEED_IDS),))
    return cursor.fetchall()

def get_system_prompt():
    from pipeline.extract import _SYSTEM_PROMPT
    return _SYSTEM_PROMPT

def main():
    config = load_config()
    client = OpenAI(api_key=config.openai_api_key)
    inserted = 0

    with connect(config) as connection:
        with connection.cursor() as cursor:
            rows = get_target_chunks(cursor)
            print(f"Found {len(rows)} target chunks to extract from {SEED_IDS}")

            existing_signatures = set()
            cursor.execute("SELECT raw_ref FROM ingestion.evidence_fragments")
            for (ref,) in cursor.fetchall():
                existing_signatures.add(ref)

            for chunk_id, source_document_id, chunk_index, chunk_text in rows:
                print(f"  Processing chunk {chunk_id} (doc {source_document_id}, idx {chunk_index})...")

                extraction_run_id = _mark_run_started(
                    cursor,
                    source_document_id=source_document_id,
                    model_name=config.openai_model,
                )
                connection.commit()

                try:
                    document_chunks = _load_document_chunks(cursor, source_document_id=source_document_id)
                    source_context = _load_source_context(cursor, source_document_id=source_document_id)

                    if _document_looks_like_listing(source_context.get("document_title"), document_chunks):
                        _record_issue(cursor, extraction_run_id=extraction_run_id,
                            source_document_id=source_document_id, chunk_id=chunk_id,
                            issue_type="skipped_document", message="Looks like a listing page", raw_output=None)
                        _mark_run_completed(cursor, extraction_run_id=extraction_run_id)
                        connection.commit()
                        continue

                    from pipeline.extract import _build_extraction_messages, _load_adjacent_chunks
                    loaded_chunks = _load_adjacent_chunks(cursor, chunk_id=chunk_id,
                        source_document_id=source_document_id, config=config)
                    messages = _build_extraction_messages(
                        anchor_chunk=chunk_text,
                        loaded_chunks=loaded_chunks,
                        source_context=source_context,
                    )

                    response = client.chat.completions.create(
                        model=config.openai_model,
                        messages=messages,
                        temperature=0.2,
                        response_format={"type": "json_object"},
                    )
                    raw_output = response.choices[0].message.content or ""
                    decision = ExtractionDecision.model_validate_json(raw_output)

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
                            issue_type=EMPTY_RESULT_ISSUE_TYPE, message="Zero fragments returned", raw_output=raw_output)
                    elif novel == 0:
                        _record_issue(cursor, extraction_run_id=extraction_run_id,
                            source_document_id=source_document_id, chunk_id=chunk_id,
                            issue_type=NO_NOVEL_DATAPOINTS_ISSUE_TYPE, message="No novel fragments", raw_output=raw_output)

                    _mark_run_completed(cursor, extraction_run_id=extraction_run_id)
                    connection.commit()

                except Exception as exc:
                    print(f"    ERROR: {exc}")
                    connection.rollback()

    print(f"\nDone. Inserted {inserted} evidence fragments from {SEED_IDS}")

if __name__ == "__main__":
    main()
