# Frontend-Native Evidence Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace product-facing chunk datapoints with a frontend-native evidence model made of high-value evidence fragments and cited claims, while propagating source-level treatment provenance into downstream evidence objects.

**Architecture:** Keep the current ingestion pipeline as the entrypoint, but shift the canonical product model to `evidence_fragments` and `claims`. Extraction becomes a two-stage process: first emit a small number of display-ready evidence fragments from chunk windows, then synthesize a smaller claim set from stored fragments. Treatment status is attached from seed/source provenance rather than inferred from chunk text.

**Tech Stack:** Python, Pydantic, PostgreSQL, OpenAI SDK, pytest

---

### Task 1: Add failing tests for the frontend-native evidence model

**Files:**
- Modify: `tests/test_extraction_models.py`
- Create: `tests/test_evidence_models.py`
- Test: `tests/test_extraction_models.py`
- Test: `tests/test_evidence_models.py`

- [ ] **Step 1: Write the failing fragment and claim model tests**

```python
from pipeline.models import EvidenceFragmentResponse, ClaimSynthesisResponse


def test_evidence_fragment_response_accepts_fragment_payload():
    payload = {
        "action": "submit_fragments",
        "fragments": [
            {
                "date": "2026-02-11",
                "source_type": "Parent Journal",
                "modality": "text",
                "title": "Recognition check during visit",
                "excerpt": "Turned toward aunt's voice immediately.",
                "tags": ["recognition", "voice"],
                "signal_domain": "recognition",
                "confidence": "high",
                "supporting_chunk_ids": [41],
            }
        ],
    }
    result = EvidenceFragmentResponse.model_validate(payload)
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `& 'C:\Users\benbe\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest tests/test_extraction_models.py tests/test_evidence_models.py -v`
Expected: FAIL with missing fragment/claim models

- [ ] **Step 3: Add failing provenance and mapping tests**

```python
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
```

- [ ] **Step 4: Run test to verify it fails**

Run: `& 'C:\Users\benbe\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest tests/test_evidence_models.py -v`
Expected: FAIL with missing treatment provenance helper

### Task 2: Add canonical evidence-fragment and claim storage

**Files:**
- Modify: `pipeline/sql/init.sql`
- Modify: `pipeline/models.py`
- Create: `pipeline/evidence.py`
- Test: `tests/test_evidence_models.py`

- [ ] **Step 1: Write the failing storage helper tests**

```python
def test_store_fragment_links_chunks_and_treatment_status():
    ...
    assert fragment_row["treatment_status"] == "treated"


def test_store_claim_links_fragment_ids():
    ...
    assert linked_fragment_ids == ["FRG-1", "FRG-2"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `& 'C:\Users\benbe\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest tests/test_evidence_models.py -v`
Expected: FAIL because canonical evidence tables and helpers do not exist

- [ ] **Step 3: Add minimal schema and helper implementation**

```sql
CREATE TABLE IF NOT EXISTS ingestion.evidence_fragments (...);
CREATE TABLE IF NOT EXISTS ingestion.evidence_fragment_chunks (...);
CREATE TABLE IF NOT EXISTS ingestion.claims (...);
CREATE TABLE IF NOT EXISTS ingestion.claim_fragments (...);
```

```python
def infer_treatment_status(seed_source: dict[str, Any]) -> str:
    if seed_source["confirmed_participation"] or seed_source["trial_program"] or seed_source["intervention_class"]:
        return "treated"
    return "unknown"
```

- [ ] **Step 4: Run focused tests to verify green**

Run: `& 'C:\Users\benbe\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest tests/test_evidence_models.py -v`
Expected: PASS

### Task 3: Convert extraction from generic datapoints to evidence fragments

**Files:**
- Modify: `pipeline/prompts/extraction_prompt.md`
- Modify: `pipeline/extract.py`
- Modify: `pipeline/models.py`
- Test: `tests/test_extract_helpers.py`
- Test: `tests/test_evidence_models.py`

- [ ] **Step 1: Write the failing extraction prompt and helper tests**

```python
def test_build_prompt_mentions_frontend_domains_and_fragment_cap():
    prompt = build_fragment_prompt(...)
    assert "vocabulary" in prompt
    assert "recognition" in prompt
    assert "Emit only the strongest evidence fragments" in prompt


def test_fragment_extraction_skips_metadata_only_records():
    ...
    assert should_store_fragment(fragment_payload) is False
```

- [ ] **Step 2: Run test to verify it fails**

Run: `& 'C:\Users\benbe\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest tests/test_extract_helpers.py tests/test_evidence_models.py -v`
Expected: FAIL because extraction still targets generic datapoints

- [ ] **Step 3: Implement minimal fragment extraction path**

```python
decision = EvidenceFragmentResponse.model_validate(payload)
for fragment in decision.fragments:
    store_evidence_fragment(...)
```

- [ ] **Step 4: Run focused tests to verify green**

Run: `& 'C:\Users\benbe\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest tests/test_extract_helpers.py tests/test_evidence_models.py -v`
Expected: PASS

### Task 4: Add claim synthesis from stored fragments

**Files:**
- Create: `pipeline/prompts/claim_synthesis_prompt.md`
- Modify: `pipeline/extract.py`
- Modify: `pipeline/main.py`
- Test: `tests/test_evidence_models.py`

- [ ] **Step 1: Write the failing claim synthesis tests**

```python
def test_claim_synthesis_groups_fragments_into_domain_claims():
    ...
    assert claims[0]["domain"] == "recognition"


def test_claim_synthesis_preserves_fragment_lineage():
    ...
    assert claims[0]["fragment_ids"] == ["FRG-1", "FRG-2"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `& 'C:\Users\benbe\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest tests/test_evidence_models.py -v`
Expected: FAIL because no claim synthesis exists

- [ ] **Step 3: Implement minimal claim synthesis**

```python
def synthesize_claims(config: PipelineConfig) -> int:
    ...
```

- [ ] **Step 4: Run focused tests to verify green**

Run: `& 'C:\Users\benbe\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest tests/test_evidence_models.py -v`
Expected: PASS

### Task 5: Add frontend-aligned bundle shaping and verification

**Files:**
- Create: `pipeline/evidence_bundle.py`
- Create: `tests/test_evidence_bundle.py`
- Test: `tests/test_evidence_bundle.py`
- Test: `tests/test_evidence_models.py`
- Test: `tests/test_extract_helpers.py`

- [ ] **Step 1: Write the failing bundle-shaping tests**

```python
def test_build_case_bundle_matches_frontend_shape():
    bundle = build_case_bundle(...)
    assert set(bundle.keys()) == {"caseRecord", "fragments", "claims"}


def test_bundle_claims_include_cited_fragment_ids():
    ...
    assert bundle["claims"][0]["fragmentIds"] == ["FRG-1", "FRG-2"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `& 'C:\Users\benbe\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest tests/test_evidence_bundle.py -v`
Expected: FAIL because no bundle builder exists

- [ ] **Step 3: Implement minimal bundle builder and final verification**

```python
def build_case_bundle(...):
    return {"caseRecord": ..., "fragments": ..., "claims": ...}
```

- [ ] **Step 4: Run the broader regression slice**

Run: `& 'C:\Users\benbe\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest tests/test_chunking.py tests/test_scrape_normalization.py tests/test_extraction_models.py tests/test_extract_helpers.py tests/test_evidence_models.py tests/test_evidence_bundle.py -v`
Expected: PASS
