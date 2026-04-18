# Adjacent Context Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the ingestion extractor to use a stronger model, iteratively fetch adjacent chunks, avoid duplicate conclusions, and persist many-to-one evidence links.

**Architecture:** The extractor will move from a single-pass chunk prompt to an iterative anchor-chunk loop. A new response union will let the model either request more adjacent context or submit validated datapoints; new datapoints will be deduped and linked to one or more supporting chunks through a join table.

**Tech Stack:** Python, Pydantic, OpenAI SDK, PostgreSQL, pytest

---

### Task 1: Add response-model and helper tests

**Files:**
- Modify: `tests/test_extraction_models.py`
- Create: `tests/test_extract_helpers.py`
- Test: `tests/test_extraction_models.py`
- Test: `tests/test_extract_helpers.py`

- [ ] **Step 1: Write the failing response-model tests**

```python
def test_extraction_decision_accepts_context_request():
    payload = {
        "action": "request_more_context",
        "reason": "The sentence appears split across chunks.",
        "requested_directions": ["left", "right"],
        "datapoints": [],
    }
    result = ExtractionDecision.model_validate(payload)
    assert result.action == "request_more_context"


def test_submitted_datapoint_requires_supporting_chunk_ids():
    payload = {
        "action": "submit_datapoints",
        "datapoints": [
            {
                "datapoint_type": "functional_signal",
                "confidence": "high",
                "evidence_quote": "He still remembers the dog's name.",
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_extraction_models.py -v`
Expected: FAIL with missing `ExtractionDecision` or missing `supporting_chunk_ids` validation

- [ ] **Step 3: Write the failing extractor-helper tests**

```python
def test_build_prompt_includes_existing_datapoints_and_loaded_chunks():
    prompt = _build_prompt(
        anchor_chunk_id=10,
        loaded_chunks=[
            LoadedChunk(chunk_id=10, chunk_index=3, chunk_text="Anchor text."),
            LoadedChunk(chunk_id=11, chunk_index=4, chunk_text="Right neighbor."),
        ],
        existing_datapoints=[{"datapoint_type": "outcome_claim", "evidence_quote": "existing"}],
    )
    assert "Existing datapoints for this anchor chunk" in prompt
    assert "Loaded chunks" in prompt
    assert "Anchor text." in prompt
    assert "Right neighbor." in prompt


def test_compute_dedupe_key_is_stable_for_semantically_identical_payloads():
    first = _compute_dedupe_key(...)
    second = _compute_dedupe_key(...)
    assert first == second
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pytest tests/test_extract_helpers.py -v`
Expected: FAIL with missing helper types or functions

### Task 2: Implement response models and helper utilities

**Files:**
- Modify: `pipeline/models.py`
- Modify: `pipeline/extract.py`
- Test: `tests/test_extraction_models.py`
- Test: `tests/test_extract_helpers.py`

- [ ] **Step 1: Add minimal response-model support**

```python
class ExtractionAction(str, Enum):
    REQUEST_MORE_CONTEXT = "request_more_context"
    SUBMIT_DATAPOINTS = "submit_datapoints"


class ExtractedDatapoint(BaseModel):
    supporting_chunk_ids: list[int]


class ExtractionDecision(BaseModel):
    action: Literal["request_more_context", "submit_datapoints"]
    reason: StrictText | None = None
    requested_directions: list[Literal["left", "right"]] = []
    datapoints: list[ExtractedDatapoint]
```

- [ ] **Step 2: Add minimal helper support**

```python
@dataclass(frozen=True, slots=True)
class LoadedChunk:
    chunk_id: int
    chunk_index: int
    chunk_text: str


def _compute_dedupe_key(datapoint: ExtractedDatapoint) -> str:
    payload = {
        "datapoint_type": datapoint.datapoint_type,
        "subject_label": datapoint.subject_label,
        "disease_subtype": datapoint.disease_subtype,
        "trial_program": datapoint.trial_program,
        "value": datapoint.value.model_dump(mode="json"),
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()
```

- [ ] **Step 3: Run focused tests to verify green**

Run: `pytest tests/test_extraction_models.py tests/test_extract_helpers.py -v`
Expected: PASS

### Task 3: Update SQL schema for many-to-one evidence links

**Files:**
- Modify: `pipeline/sql/init.sql`
- Test: `tests/test_extract_helpers.py`

- [ ] **Step 1: Write the failing schema-oriented helper test**

```python
def test_store_datapoint_links_all_supporting_chunks(...):
    ...
    assert executed_join_insert_count == 2
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_extract_helpers.py::test_store_datapoint_links_all_supporting_chunks -v`
Expected: FAIL because only one `chunk_id` is stored today

- [ ] **Step 3: Update schema minimally**

```sql
ALTER TABLE ingestion.extracted_datapoints
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

CREATE TABLE IF NOT EXISTS ingestion.extracted_datapoint_chunks (
  id BIGSERIAL PRIMARY KEY,
  extracted_datapoint_id BIGINT NOT NULL REFERENCES ingestion.extracted_datapoints(id) ON DELETE CASCADE,
  source_document_id BIGINT NOT NULL REFERENCES ingestion.source_documents(id) ON DELETE CASCADE,
  chunk_id BIGINT NOT NULL,
  evidence_role TEXT NOT NULL DEFAULT 'supporting',
  chunk_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(extracted_datapoint_id, chunk_id)
);
```

- [ ] **Step 4: Run focused tests to verify green**

Run: `pytest tests/test_extract_helpers.py::test_store_datapoint_links_all_supporting_chunks -v`
Expected: PASS

### Task 4: Implement iterative adjacent-chunk extraction

**Files:**
- Modify: `pipeline/config.py`
- Modify: `pipeline/extract.py`
- Modify: `pipeline/prompts/extraction_prompt.md`
- Test: `tests/test_extract_helpers.py`

- [ ] **Step 1: Write the failing retrieval-loop tests**

```python
def test_collects_next_right_chunk_when_model_requests_more_context():
    ...
    assert loaded_chunk_ids == [10, 11]


def test_stops_when_max_hops_reached_without_novel_datapoints():
    ...
    assert issue_type == "context_exhausted"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_extract_helpers.py -k "context or right_chunk" -v`
Expected: FAIL because extraction is single-pass

- [ ] **Step 3: Implement the minimal loop and config**

```python
max_adjacent_hops: int

while hops_used <= config.max_adjacent_hops:
    decision = _extract_decision(...)
    if decision.action == "submit_datapoints":
        ...
        break
    loaded_chunks = _expand_loaded_chunks(...)
    hops_used += 1
```

- [ ] **Step 4: Rewrite the prompt for mission-aware extraction**

```md
Prioritize real-world evidence of cognitive stability, recognition, language retention,
sleep stability, preserved function, and other human-scale signs that a child retained
abilities the disease natural history suggests may decline.
```

- [ ] **Step 5: Run focused tests to verify green**

Run: `pytest tests/test_extract_helpers.py -v`
Expected: PASS

### Task 5: Verify the full extraction slice

**Files:**
- Modify: `tests/test_extraction_models.py`
- Modify: `tests/test_extract_helpers.py`

- [ ] **Step 1: Run the extraction-focused test suite**

Run: `pytest tests/test_extraction_models.py tests/test_extract_helpers.py -v`
Expected: PASS

- [ ] **Step 2: Run a broader regression slice**

Run: `pytest tests/test_chunking.py tests/test_scrape_normalization.py tests/test_extraction_models.py tests/test_extract_helpers.py -v`
Expected: PASS
