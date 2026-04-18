import pytest
from pydantic import ValidationError

from pipeline.models import ExtractionDecision, ExtractionResponse


def test_extraction_response_validates_datapoints():
    payload = {
        "datapoints": [
            {
                "datapoint_type": "trial_participation",
                "subject_label": "Eliza O'Neill",
                "disease_subtype": "MPS IIIA",
                "trial_program": "UX111-ABO-102",
                "confidence": "high",
                "evidence_quote": "Eliza was treated.",
                "supporting_chunk_ids": [1],
                "value": {
                    "kind": "trial_participation",
                    "participation_status": "confirmed",
                    "named_publicly": True,
                },
            }
        ]
    }
    result = ExtractionResponse.model_validate(payload)
    assert result.datapoints[0].datapoint_type == "trial_participation"


def test_extraction_response_accepts_omitted_optional_fields():
    payload = {
        "datapoints": [
            {
                "datapoint_type": "child_identity",
                "confidence": "medium",
                "evidence_quote": "Eliza.",
                "supporting_chunk_ids": [1],
                "value": {
                    "kind": "child_identity",
                    "display_name": "Eliza O'Neill",
                },
            },
            {
                "datapoint_type": "caregiver_role",
                "confidence": "low",
                "evidence_quote": "Her mother spoke.",
                "supporting_chunk_ids": [1],
                "value": {
                    "kind": "caregiver_role",
                    "relation": "mother",
                },
            },
        ]
    }
    result = ExtractionResponse.model_validate(payload)
    assert result.datapoints[0].value.pronouns is None
    assert result.datapoints[0].value.age_text is None
    assert result.datapoints[1].value.caregiver_name is None


def test_trial_participation_accepts_named_publicly_false():
    payload = {
        "datapoints": [
            {
                "datapoint_type": "trial_participation",
                "confidence": "high",
                "evidence_quote": "The family participated anonymously.",
                "supporting_chunk_ids": [1],
                "value": {
                    "kind": "trial_participation",
                    "participation_status": "confirmed",
                    "named_publicly": False,
                },
            }
        ]
    }
    result = ExtractionResponse.model_validate(payload)
    assert result.datapoints[0].value.named_publicly is False


@pytest.mark.parametrize(
    "payload",
    [
        {
            "datapoints": [
                {
                    "datapoint_type": "trial_participation",
                    "confidence": "high",
                    "evidence_quote": "   ",
                    "supporting_chunk_ids": [1],
                    "value": {
                        "kind": "trial_participation",
                        "participation_status": "confirmed",
                        "named_publicly": True,
                    },
                }
            ]
        },
        {
            "datapoints": [
                {
                    "datapoint_type": "trial_participation",
                    "subject_label": "   ",
                    "confidence": "high",
                    "evidence_quote": "Eliza was treated.",
                    "supporting_chunk_ids": [1],
                    "value": {
                        "kind": "trial_participation",
                        "participation_status": "confirmed",
                        "named_publicly": True,
                    },
                }
            ]
        },
        {
            "datapoints": [
                {
                    "datapoint_type": "trial_participation",
                    "confidence": "high",
                    "evidence_quote": "Eliza was treated.",
                    "supporting_chunk_ids": [1],
                    "value": {
                        "kind": "trial_participation",
                        "participation_status": "confirmed",
                        "named_publicly": True,
                        "junk": "nope",
                    },
                }
            ]
        },
        {
            "datapoints": [
                {
                    "datapoint_type": "trial_participation",
                    "confidence": "high",
                    "evidence_quote": "Eliza was treated.",
                    "supporting_chunk_ids": [1],
                    "value": {
                        "kind": "outcome_claim",
                        "claim": "She improved.",
                        "direction": "improved",
                    },
                }
            ]
        },
    ],
)
def test_extraction_response_rejects_blank_quotes_and_bad_payloads(payload):
    with pytest.raises(ValidationError):
        ExtractionResponse.model_validate(payload)


def test_extraction_decision_accepts_context_request():
    payload = {
        "action": "request_more_context",
        "reason": "The sentence appears to continue in adjacent chunks.",
        "requested_directions": ["left", "right"],
        "datapoints": [],
    }
    result = ExtractionDecision.model_validate(payload)
    assert result.action == "request_more_context"
    assert result.requested_directions == ["left", "right"]


def test_extraction_decision_accepts_supporting_chunk_ids():
    payload = {
        "action": "submit_datapoints",
        "datapoints": [
            {
                "datapoint_type": "functional_signal",
                "confidence": "high",
                "evidence_quote": "He still remembered the dog's name.",
                "supporting_chunk_ids": [11, 12],
                "value": {
                    "kind": "functional_signal",
                    "signal": "remembered the dog's name",
                    "direction": "present",
                },
            }
        ],
    }
    result = ExtractionDecision.model_validate(payload)
    assert result.datapoints[0].supporting_chunk_ids == [11, 12]


def test_extraction_decision_rejects_missing_supporting_chunk_ids():
    payload = {
        "action": "submit_datapoints",
        "datapoints": [
            {
                "datapoint_type": "functional_signal",
                "confidence": "high",
                "evidence_quote": "He still remembered the dog's name.",
                "value": {
                    "kind": "functional_signal",
                    "signal": "remembered the dog's name",
                    "direction": "present",
                },
            }
        ],
    }
    with pytest.raises(ValidationError):
        ExtractionDecision.model_validate(payload)
