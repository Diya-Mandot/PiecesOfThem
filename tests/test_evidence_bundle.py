from __future__ import annotations

from pipeline.evidence_bundle import build_case_bundle


def test_build_case_bundle_matches_frontend_casebundle_shape():
    bundle = build_case_bundle(
        case_record={
            "id": "demo-child-a",
            "label": "Case A-17",
            "disease": "Sanfilippo Syndrome Type A",
            "therapy": "UX111 observational evidence brief",
            "observation_start": "2024-03-08",
            "observation_end": "2026-02-11",
            "summary": "A de-identified observational case.",
            "data_handling": "Demo records are synthetic or de-identified.",
            "review_window": "FDA resubmission accepted April 2, 2026.",
        },
        fragments=[
            {
                "id": "FRG-2026-041",
                "case_id": "demo-child-a",
                "date": "2026-02-11",
                "source_type": "Parent Journal",
                "modality": "text",
                "title": "Recognition check during visit",
                "excerpt": "Turned toward aunt's voice immediately.",
                "tags": ["recognition", "voice"],
                "signal_domain": "recognition",
                "deidentified": True,
                "confidence": "high",
                "raw_ref": "Journal / February 2026 / Entry 04",
            }
        ],
        claims=[
            {
                "id": "CLM-RECOGNITION-STABLE",
                "case_id": "demo-child-a",
                "statement": "Recognition of primary caregivers remains intact.",
                "domain": "recognition",
                "trend": "stable",
                "confidence": "high",
                "fragment_ids": ["FRG-2026-041"],
            }
        ],
    )

    assert set(bundle.keys()) == {"caseRecord", "fragments", "claims"}
    assert bundle["caseRecord"] == {
        "id": "demo-child-a",
        "label": "Case A-17",
        "disease": "Sanfilippo Syndrome Type A",
        "therapy": "UX111 observational evidence brief",
        "observationStart": "2024-03-08",
        "observationEnd": "2026-02-11",
        "summary": "A de-identified observational case.",
        "dataHandling": "Demo records are synthetic or de-identified.",
        "reviewWindow": "FDA resubmission accepted April 2, 2026.",
    }
    assert bundle["fragments"] == [
        {
            "id": "FRG-2026-041",
            "caseId": "demo-child-a",
            "date": "2026-02-11",
            "sourceType": "Parent Journal",
            "modality": "text",
            "title": "Recognition check during visit",
            "excerpt": "Turned toward aunt's voice immediately.",
            "tags": ["recognition", "voice"],
            "signalDomain": "recognition",
            "deidentified": True,
            "confidence": "high",
            "rawRef": "Journal / February 2026 / Entry 04",
        }
    ]
    assert bundle["claims"] == [
        {
            "id": "CLM-RECOGNITION-STABLE",
            "caseId": "demo-child-a",
            "statement": "Recognition of primary caregivers remains intact.",
            "domain": "recognition",
            "trend": "stable",
            "confidence": "high",
            "fragmentIds": ["FRG-2026-041"],
        }
    ]


def test_build_case_bundle_preserves_fragment_id_lineage_order():
    bundle = build_case_bundle(
        case_record={"id": "case-1"},
        fragments=[],
        claims=[
            {
                "id": "CLM-1",
                "case_id": "case-1",
                "statement": "A synthesized claim.",
                "domain": "sleep",
                "trend": "improving",
                "confidence": "moderate",
                "fragment_ids": ["FRG-2", "FRG-1"],
            }
        ],
    )

    assert bundle["claims"][0]["fragmentIds"] == ["FRG-2", "FRG-1"]
