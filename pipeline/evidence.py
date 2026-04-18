"""Canonical evidence-fragment and claim storage helpers."""

from __future__ import annotations

import hashlib
from typing import Any

from psycopg.types.json import Jsonb

from .models import EvidenceFragment, SynthesizedClaim


def infer_treatment_status(seed_source: dict[str, Any]) -> str:
    """Infer source-level treatment status from seed provenance only."""

    if (
        seed_source.get("confirmed_participation")
        or seed_source.get("trial_program")
        or seed_source.get("intervention_class")
    ):
        return "treated"
    return "unknown"


def _build_fragment_external_id(
    *,
    case_id: str,
    source_document_id: int,
    fragment: EvidenceFragment,
) -> str:
    basis = "|".join(
        [
            case_id,
            str(source_document_id),
            fragment.date,
            fragment.signal_domain,
            fragment.title,
            fragment.excerpt,
        ]
    )
    digest = hashlib.sha1(basis.encode("utf-8")).hexdigest()[:10].upper()
    return f"FRG-{digest}"


def _build_claim_external_id(*, case_id: str, claim: SynthesizedClaim) -> str:
    basis = "|".join([case_id, claim.domain, claim.trend, claim.statement])
    digest = hashlib.sha1(basis.encode("utf-8")).hexdigest()[:10].upper()
    return f"CLM-{digest}"


def store_evidence_fragment(
    cursor: Any,
    *,
    source_document_id: int,
    case_id: str,
    raw_ref: str,
    treatment_status: str,
    treatment_basis: str,
    trial_program: str | None,
    intervention_class: str | None,
    fragment: EvidenceFragment,
) -> int:
    cursor.execute(
        """
        INSERT INTO ingestion.evidence_fragments (
          external_id, case_id, source_document_id, fragment_date, source_type, modality,
          title, excerpt, tags_json, signal_domain, treatment_status, confidence,
          treatment_basis, raw_ref, trial_program, intervention_class
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            _build_fragment_external_id(
                case_id=case_id,
                source_document_id=source_document_id,
                fragment=fragment,
            ),
            case_id,
            source_document_id,
            fragment.date,
            fragment.source_type,
            fragment.modality,
            fragment.title,
            fragment.excerpt,
            Jsonb(list(fragment.tags)),
            fragment.signal_domain,
            treatment_status,
            fragment.confidence,
            treatment_basis,
            raw_ref,
            trial_program,
            intervention_class,
        ),
    )
    fragment_id = cursor.fetchone()[0]

    for chunk_order, chunk_id in enumerate(fragment.supporting_chunk_ids):
        cursor.execute(
            """
            INSERT INTO ingestion.evidence_fragment_chunks (
              evidence_fragment_id, source_document_id, chunk_id, chunk_order
            )
            VALUES (%s, %s, %s, %s)
            """,
            (fragment_id, source_document_id, chunk_id, chunk_order),
        )

    return fragment_id


def store_claim(
    cursor: Any,
    *,
    case_id: str,
    treatment_status: str,
    trial_program: str | None,
    claim: SynthesizedClaim,
) -> int:
    cursor.execute(
        """
        INSERT INTO ingestion.claims (
          external_id, case_id, statement, signal_domain, trend, confidence,
          treatment_status, trial_program
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            _build_claim_external_id(case_id=case_id, claim=claim),
            case_id,
            claim.statement,
            claim.domain,
            claim.trend,
            claim.confidence,
            treatment_status,
            trial_program,
        ),
    )
    claim_id = cursor.fetchone()[0]

    for fragment_order, fragment_id in enumerate(claim.fragment_ids):
        cursor.execute(
            """
            INSERT INTO ingestion.claim_fragments (
              claim_id, fragment_external_id, fragment_order
            )
            VALUES (%s, %s, %s)
            """,
            (claim_id, fragment_id, fragment_order),
        )

    return claim_id
