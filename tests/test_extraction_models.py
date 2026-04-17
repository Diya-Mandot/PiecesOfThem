import pytest
from pydantic import ValidationError

from pipeline.models import ExtractionResponse


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
                "value": {
                    "kind": "child_identity",
                    "display_name": "Eliza O'Neill",
                },
            },
            {
                "datapoint_type": "caregiver_role",
                "confidence": "low",
                "evidence_quote": "Her mother spoke.",
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
