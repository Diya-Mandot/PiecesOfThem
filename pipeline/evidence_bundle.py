"""Helpers for shaping canonical evidence rows into frontend bundle payloads."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any


def _pick(row: Mapping[str, Any], *names: str) -> Any:
    for name in names:
        if name in row:
            return row[name]
    raise KeyError(names[0])


def _case_record_payload(case_record: Mapping[str, Any]) -> dict[str, Any]:
    payload: dict[str, Any] = {}
    for source_name, target_name in (
        ("id", "id"),
        ("label", "label"),
        ("disease", "disease"),
        ("therapy", "therapy"),
        ("observation_start", "observationStart"),
        ("observation_end", "observationEnd"),
        ("summary", "summary"),
        ("data_handling", "dataHandling"),
        ("review_window", "reviewWindow"),
    ):
        if source_name in case_record:
            payload[target_name] = case_record[source_name]

    return payload


def _fragment_payload(fragment: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "id": _pick(fragment, "id"),
        "caseId": _pick(fragment, "case_id", "caseId"),
        "date": _pick(fragment, "date"),
        "sourceType": _pick(fragment, "source_type", "sourceType"),
        "modality": _pick(fragment, "modality"),
        "title": _pick(fragment, "title"),
        "excerpt": _pick(fragment, "excerpt"),
        "tags": list(_pick(fragment, "tags")),
        "signalDomain": _pick(fragment, "signal_domain", "signalDomain"),
        "deidentified": _pick(fragment, "deidentified"),
        "confidence": _pick(fragment, "confidence"),
        "rawRef": _pick(fragment, "raw_ref", "rawRef"),
    }


def _claim_payload(claim: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "id": _pick(claim, "id"),
        "caseId": _pick(claim, "case_id", "caseId"),
        "statement": _pick(claim, "statement"),
        "domain": _pick(claim, "domain"),
        "trend": _pick(claim, "trend"),
        "confidence": _pick(claim, "confidence"),
        "fragmentIds": list(_pick(claim, "fragment_ids", "fragmentIds")),
    }


def build_case_bundle(
    *,
    case_record: Mapping[str, Any],
    fragments: Iterable[Mapping[str, Any]],
    claims: Iterable[Mapping[str, Any]],
) -> dict[str, Any]:
    """Return a frontend CaseBundle-style payload from canonical row mappings."""

    return {
        "caseRecord": _case_record_payload(case_record),
        "fragments": [_fragment_payload(fragment) for fragment in fragments],
        "claims": [_claim_payload(claim) for claim in claims],
    }
