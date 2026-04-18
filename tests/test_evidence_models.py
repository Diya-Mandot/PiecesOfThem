from __future__ import annotations

from pipeline.evidence import (
    infer_treatment_status,
    store_claim,
    store_evidence_fragment,
)
from pipeline.models import (
    ClaimSynthesisResponse,
    EvidenceFragment,
    EvidenceFragmentExtractionResponse,
)


class RecordingCursor:
    def __init__(self) -> None:
        self.calls: list[tuple[str, tuple[object, ...]]] = []
        self._next_id = 1

    def execute(self, query: str, params: tuple[object, ...]) -> None:
        self.calls.append((query, params))

    def fetchone(self) -> tuple[int]:
        value = self._next_id
        self._next_id += 1
        return (value,)


def test_evidence_fragment_response_accepts_fragment_payload():
    payload = {
        "action": "submit_fragments",
        "fragments": [
            {
                "date": "2026-02-11",
                "title": "Recognition check during visit",
                "excerpt": "Turned toward aunt's voice immediately.",
                "tags": ["recognition", "voice"],
                "signal_domain": "recognition",
                "confidence": "high",
                "supporting_chunk_ids": [41],
            }
        ],
    }
    result = EvidenceFragmentExtractionResponse.model_validate(payload)
    assert result.fragments[0].signal_domain == "recognition"


def test_claim_synthesis_response_accepts_claim_payload():
    payload = {
        "claims": [
            {
                "statement": "Recognition of primary caregivers remains intact.",
                "domain": "recognition",
                "trend": "stable",
                "confidence": "high",
                "fragment_ids": ["FRG-1", "FRG-2"],
            }
        ]
    }
    result = ClaimSynthesisResponse.model_validate(payload)
    assert result.claims[0].trend == "stable"


def test_treatment_status_maps_trial_participant_seed_to_treated():
    seed_row = {
        "confirmed_participation": True,
        "trial_program": "UX111",
        "intervention_class": "gene-therapy",
    }
    assert infer_treatment_status(seed_row) == "treated"


def test_treatment_status_does_not_map_public_source_to_untreated():
    seed_row = {
        "confirmed_participation": False,
        "trial_program": None,
        "intervention_class": None,
    }
    assert infer_treatment_status(seed_row) == "unknown"


def test_store_fragment_links_chunks_and_treatment_status():
    cursor = RecordingCursor()
    fragment = EvidenceFragment(
        date="2026-02-11",
        source_type="Parent Journal",
        modality="text",
        title="Recognition check during visit",
        excerpt="Turned toward aunt's voice immediately.",
        tags=["recognition", "voice"],
        signal_domain="recognition",
        confidence="high",
        supporting_chunk_ids=[10, 11],
    )

    fragment_id = store_evidence_fragment(
        cursor,
        source_document_id=2,
        case_id="case-a",
        raw_ref="seed:PSS-001",
        treatment_status="treated",
        treatment_basis="seed_provenance",
        trial_program="UX111",
        intervention_class="gene-therapy",
        fragment=fragment,
    )

    assert fragment_id == 1
    assert len(cursor.calls) == 3
    assert "INSERT INTO ingestion.evidence_fragments" in cursor.calls[0][0]
    assert cursor.calls[0][1][10] == "treated"
    assert "INSERT INTO ingestion.evidence_fragment_chunks" in cursor.calls[1][0]
    assert "INSERT INTO ingestion.evidence_fragment_chunks" in cursor.calls[2][0]


def test_store_claim_links_fragment_ids():
    cursor = RecordingCursor()
    claim = ClaimSynthesisResponse.model_validate(
        {
            "claims": [
                {
                    "statement": "Recognition of primary caregivers remains intact.",
                    "domain": "recognition",
                    "trend": "stable",
                    "confidence": "high",
                    "fragment_ids": ["FRG-1", "FRG-2"],
                }
            ]
        }
    ).claims[0]

    claim_id = store_claim(
        cursor,
        case_id="case-a",
        treatment_status="treated",
        trial_program="UX111",
        claim=claim,
    )

    assert claim_id == 1
    assert len(cursor.calls) == 3
    assert "INSERT INTO ingestion.claims" in cursor.calls[0][0]
    assert "INSERT INTO ingestion.claim_fragments" in cursor.calls[1][0]
    assert "INSERT INTO ingestion.claim_fragments" in cursor.calls[2][0]
