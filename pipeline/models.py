"""Pydantic models for extraction outputs."""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator


StrictText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


DatapointType = Literal[
    "child_identity",
    "caregiver_role",
    "disease_subtype",
    "trial_participation",
    "functional_signal",
    "temporal_marker",
    "outcome_claim",
]


Confidence = Literal["low", "medium", "high"]


class ChildIdentityValue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["child_identity"]
    display_name: StrictText
    pronouns: StrictText | None = None
    age_text: StrictText | None = None


class CaregiverRoleValue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["caregiver_role"]
    relation: StrictText
    caregiver_name: StrictText | None = None


class DiseaseSubtypeValue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["disease_subtype"]
    subtype: StrictText


class TrialParticipationValue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["trial_participation"]
    participation_status: Literal["confirmed", "mentioned", "planned", "completed"]
    named_publicly: bool


class FunctionalSignalValue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["functional_signal"]
    signal: StrictText
    direction: Literal["improved", "worsened", "stable", "present", "absent", "unclear"]


class TemporalMarkerValue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["temporal_marker"]
    marker: StrictText
    marker_type: Literal["age", "date", "duration", "sequence", "relative_time", "other"]


class OutcomeClaimValue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["outcome_claim"]
    claim: StrictText
    direction: Literal["improved", "worsened", "stable", "mixed", "unclear"]


ExtractionValue = Annotated[
    ChildIdentityValue
    | CaregiverRoleValue
    | DiseaseSubtypeValue
    | TrialParticipationValue
    | FunctionalSignalValue
    | TemporalMarkerValue
    | OutcomeClaimValue,
    Field(discriminator="kind"),
]


class ExtractedDatapoint(BaseModel):
    """One evidence-backed datapoint extracted from a chunk."""

    model_config = ConfigDict(extra="forbid")

    datapoint_type: DatapointType
    subject_label: StrictText | None = None
    disease_subtype: StrictText | None = None
    trial_program: StrictText | None = None
    confidence: Confidence
    evidence_quote: StrictText
    value: ExtractionValue

    @model_validator(mode="after")
    def _validate_datapoint_type_matches_value(self) -> "ExtractedDatapoint":
        if self.datapoint_type != self.value.kind:
            raise ValueError("datapoint_type must match value.kind")
        return self


class ExtractionResponse(BaseModel):
    """Top-level extraction response returned by the model."""

    model_config = ConfigDict(extra="forbid")

    datapoints: list[ExtractedDatapoint]
