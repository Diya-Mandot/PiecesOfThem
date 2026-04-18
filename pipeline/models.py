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
FrontendConfidence = Literal["moderate", "high"]
SignalDomain = Literal["vocabulary", "recognition", "sleep", "behavior", "motor"]
SourceType = Literal[
    "Parent Journal",
    "Caregiver Transcript",
    "Clinic Summary",
    "Forum Observation",
    "Voice Memo",
]
SourceModality = Literal["text", "audio-transcript", "summary"]
ClaimTrend = Literal["stable", "declining", "improving", "mixed"]


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
    supporting_chunk_ids: list[int]
    value: ExtractionValue

    @model_validator(mode="after")
    def _validate_datapoint_type_matches_value(self) -> "ExtractedDatapoint":
        if self.datapoint_type != self.value.kind:
            raise ValueError("datapoint_type must match value.kind")
        if not self.supporting_chunk_ids:
            raise ValueError("supporting_chunk_ids must not be empty")
        if len(set(self.supporting_chunk_ids)) != len(self.supporting_chunk_ids):
            raise ValueError("supporting_chunk_ids must be unique")
        return self


class ExtractionResponse(BaseModel):
    """Top-level extraction response returned by the model."""

    model_config = ConfigDict(extra="forbid")

    datapoints: list[ExtractedDatapoint]


class ExtractionDecision(BaseModel):
    """Top-level extraction action returned by the model."""

    model_config = ConfigDict(extra="forbid")

    action: Literal["request_more_context", "submit_datapoints"]
    reason: StrictText | None = None
    requested_directions: list[Literal["left", "right"]] = []
    datapoints: list[ExtractedDatapoint]

    @model_validator(mode="after")
    def _validate_action_payload(self) -> "ExtractionDecision":
        if self.action == "request_more_context":
            if not self.requested_directions:
                raise ValueError("requested_directions must not be empty")
            if self.datapoints:
                raise ValueError("request_more_context must not include datapoints")
        else:
            if self.requested_directions:
                raise ValueError("submit_datapoints must not request directions")
        return self


class EvidenceFragment(BaseModel):
    """Reviewer-facing fragment aligned to the frontend evidence card shape."""

    model_config = ConfigDict(extra="forbid")

    date: StrictText
    source_type: SourceType
    modality: SourceModality
    title: StrictText
    excerpt: StrictText
    tags: list[StrictText]
    signal_domain: SignalDomain
    confidence: FrontendConfidence
    supporting_chunk_ids: list[int]

    @model_validator(mode="after")
    def _validate_supporting_chunk_ids(self) -> "EvidenceFragment":
        if not self.supporting_chunk_ids:
            raise ValueError("supporting_chunk_ids must not be empty")
        if len(set(self.supporting_chunk_ids)) != len(self.supporting_chunk_ids):
            raise ValueError("supporting_chunk_ids must be unique")
        return self


class EvidenceFragmentCandidate(BaseModel):
    """LLM-emitted fragment fields before provenance-based hydration."""

    model_config = ConfigDict(extra="forbid")

    date: StrictText
    title: StrictText
    excerpt: StrictText
    tags: list[StrictText]
    signal_domain: SignalDomain
    confidence: FrontendConfidence
    supporting_chunk_ids: list[int]

    @model_validator(mode="after")
    def _validate_supporting_chunk_ids(self) -> "EvidenceFragmentCandidate":
        if not self.supporting_chunk_ids:
            raise ValueError("supporting_chunk_ids must not be empty")
        if len(set(self.supporting_chunk_ids)) != len(self.supporting_chunk_ids):
            raise ValueError("supporting_chunk_ids must be unique")
        return self


class EvidenceFragmentExtractionResponse(BaseModel):
    """Top-level fragment extraction response returned by the model."""

    model_config = ConfigDict(extra="forbid")

    action: Literal["request_more_context", "submit_fragments"]
    reason: StrictText | None = None
    requested_directions: list[Literal["left", "right"]] = []
    fragments: list[EvidenceFragmentCandidate]

    @model_validator(mode="after")
    def _validate_action_payload(self) -> "EvidenceFragmentExtractionResponse":
        if self.action == "request_more_context":
            if not self.requested_directions:
                raise ValueError("requested_directions must not be empty")
            if self.fragments:
                raise ValueError("request_more_context must not include fragments")
        else:
            if self.requested_directions:
                raise ValueError("submit_fragments must not request directions")
        return self


class SynthesizedClaim(BaseModel):
    """Reviewer-facing claim aligned to the frontend claim card shape."""

    model_config = ConfigDict(extra="forbid")

    statement: StrictText
    domain: SignalDomain
    trend: ClaimTrend
    confidence: FrontendConfidence
    fragment_ids: list[StrictText]

    @model_validator(mode="after")
    def _validate_fragment_ids(self) -> "SynthesizedClaim":
        if not self.fragment_ids:
            raise ValueError("fragment_ids must not be empty")
        if len(set(self.fragment_ids)) != len(self.fragment_ids):
            raise ValueError("fragment_ids must be unique")
        return self


class ClaimSynthesisResponse(BaseModel):
    """Top-level claim synthesis response."""

    model_config = ConfigDict(extra="forbid")

    claims: list[SynthesizedClaim]
