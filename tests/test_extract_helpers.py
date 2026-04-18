from __future__ import annotations

from pipeline.extract import (
    LoadedChunk,
    _build_prompt,
    _compute_dedupe_key,
    _expand_loaded_chunks,
    _store_datapoint,
)
from pipeline.models import ExtractionDecision


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


def test_build_prompt_includes_existing_datapoints_and_loaded_chunks():
    prompt = _build_prompt(
        anchor_chunk_id=10,
        loaded_chunks=[
            LoadedChunk(chunk_id=10, chunk_index=3, chunk_text="Anchor text."),
            LoadedChunk(chunk_id=11, chunk_index=4, chunk_text="Right neighbor."),
        ],
        existing_datapoints=[
            {
                "datapoint_type": "outcome_claim",
                "evidence_quote": "existing evidence",
            }
        ],
    )

    assert "Existing datapoints for this anchor chunk" in prompt
    assert "Loaded chunks" in prompt
    assert "Anchor chunk id: 10" in prompt
    assert "Anchor text." in prompt
    assert "Right neighbor." in prompt


def test_compute_dedupe_key_is_stable_for_semantically_identical_payloads():
    first = ExtractionDecision.model_validate(
        {
            "action": "submit_datapoints",
            "datapoints": [
                {
                    "datapoint_type": "trial_participation",
                    "subject_label": "Eliza O'Neill",
                    "disease_subtype": "MPS IIIA",
                    "trial_program": "UX111-ABO-102",
                    "confidence": "high",
                    "evidence_quote": "Eliza was treated.",
                    "supporting_chunk_ids": [10],
                    "value": {
                        "kind": "trial_participation",
                        "participation_status": "confirmed",
                        "named_publicly": True,
                    },
                }
            ],
        }
    ).datapoints[0]
    second = ExtractionDecision.model_validate(
        {
            "action": "submit_datapoints",
            "datapoints": [
                {
                    "datapoint_type": "trial_participation",
                    "subject_label": "Eliza O'Neill",
                    "disease_subtype": "MPS IIIA",
                    "trial_program": "UX111-ABO-102",
                    "confidence": "low",
                    "evidence_quote": "A different quote.",
                    "supporting_chunk_ids": [11, 12],
                    "value": {
                        "kind": "trial_participation",
                        "participation_status": "confirmed",
                        "named_publicly": True,
                    },
                }
            ],
        }
    ).datapoints[0]

    assert _compute_dedupe_key(first) == _compute_dedupe_key(second)


def test_expand_loaded_chunks_adds_next_right_neighbor():
    loaded = [LoadedChunk(chunk_id=10, chunk_index=3, chunk_text="Anchor text.")]
    available = [
        LoadedChunk(chunk_id=9, chunk_index=2, chunk_text="Left neighbor."),
        LoadedChunk(chunk_id=11, chunk_index=4, chunk_text="Right neighbor."),
        LoadedChunk(chunk_id=12, chunk_index=5, chunk_text="Far right."),
    ]

    expanded = _expand_loaded_chunks(
        loaded_chunks=loaded,
        requested_directions=["right"],
        available_chunks=available,
    )

    assert [chunk.chunk_id for chunk in expanded] == [10, 11]


def test_store_datapoint_links_all_supporting_chunks():
    cursor = RecordingCursor()
    datapoint = ExtractionDecision.model_validate(
        {
            "action": "submit_datapoints",
            "datapoints": [
                {
                    "datapoint_type": "functional_signal",
                    "subject_label": "A child",
                    "confidence": "high",
                    "evidence_quote": "He still recognized the dog.",
                    "supporting_chunk_ids": [10, 11],
                    "value": {
                        "kind": "functional_signal",
                        "signal": "recognized the dog",
                        "direction": "present",
                    },
                }
            ],
        }
    ).datapoints[0]

    _store_datapoint(
        cursor,
        extraction_run_id=7,
        source_document_id=2,
        datapoint=datapoint,
    )

    assert len(cursor.calls) == 3
    assert "INSERT INTO ingestion.extracted_datapoints" in cursor.calls[0][0]
    assert "INSERT INTO ingestion.extracted_datapoint_chunks" in cursor.calls[1][0]
    assert "INSERT INTO ingestion.extracted_datapoint_chunks" in cursor.calls[2][0]
    assert cursor.calls[1][1][2] == 10
    assert cursor.calls[2][1][2] == 11
