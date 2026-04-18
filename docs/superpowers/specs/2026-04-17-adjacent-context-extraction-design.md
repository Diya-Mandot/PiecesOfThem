# Adjacent Context Extraction Design

**Goal:** Improve ingestion datapoint quality by upgrading the extraction model, allowing iterative adjacent-chunk retrieval, preventing duplicate conclusions, and aligning extraction behavior with the PiecesOfThem regulatory mission.

## Problem

The current extraction pass treats each chunk as an isolated fragment. That works for simple facts, but it misses cross-chunk evidence, repeats conclusions that already exist for the same anchor chunk, and does not emphasize the mission-critical evidence the product is trying to surface: regulator-trustworthy, human-scale signs of cognitive stability and functional retention in Sanfilippo stories.

## Constraints

- Extraction must remain evidence-backed and audit-friendly.
- The model must only use loaded chunk text, never outside knowledge.
- The database must support one extracted datapoint being backed by multiple chunks.
- Existing datapoints for the anchor chunk should be given to the model so it can avoid re-concluding the same evidence.
- Adjacent context retrieval should continue hopping outward if needed, but terminate deterministically.

## Recommended Approach

Use an iterative extraction loop centered on an anchor chunk.

1. Load the anchor chunk and any datapoints already linked to it.
2. Ask the model to either:
   - return novel datapoints supported by the currently loaded context, or
   - request additional adjacent chunks by direction.
3. If the model requests more context, load the next unvisited left and/or right neighbors and retry.
4. Repeat until the model returns datapoints, returns no novel evidence, or reaches a configurable hop limit.
5. Persist each accepted datapoint once, then link it to all supporting chunks through a join table.

This keeps retrieval deterministic while allowing just-in-time context expansion.

## Data Model Changes

`ingestion.extracted_datapoints` remains the canonical datapoint row, but no longer stores a single `chunk_id`.

Add `ingestion.extracted_datapoint_chunks`:

- `id`
- `extracted_datapoint_id`
- `source_document_id`
- `chunk_id`
- `evidence_role`
- `chunk_order`

This allows one datapoint to cite many supporting chunks while preserving source-document integrity.

Add a deterministic `dedupe_key` column on `ingestion.extracted_datapoints` so overlapping chunk windows do not create duplicate conclusions. The key should be derived from the normalized semantic identity of the datapoint rather than insertion order.

## Prompt Design

The prompt should shift from a generic extractor to a mission-aware evidence capture instruction set:

- prioritize small, human, regulator-relevant signs of cognitive stability, recognition, memory, language retention, sleep stability, and preserved daily function
- frame the task as surfacing real-world evidence that can support a regulatory dossier
- require strict evidence lineage to loaded chunks only
- tell the model to avoid repeating already-known datapoints unless the newly loaded context materially refines them
- allow the model to ask for adjacent context before concluding when support appears incomplete

The prompt should also continue enforcing omission over speculation.

## Response Contract

Replace the single-output contract with a union response:

- `action = "request_more_context"` with directions for `left`, `right`, or both
- `action = "submit_datapoints"` with a list of candidate datapoints

Each submitted datapoint should carry the chunk ids that support it from the currently loaded context.

## Runtime Behavior

- Default model becomes `gpt-5.4`.
- Add a max adjacent hop radius to config.
- Track visited chunk ids per anchor to prevent loops.
- Give the model a compact summary of existing datapoints for the anchor chunk.
- When the model returns datapoints, validate them, compute dedupe keys, skip duplicates already linked to the anchor chunk, then persist new datapoints and chunk links.
- If the model exhausts the hop limit without novel evidence, record an extraction issue rather than failing the run.

## Testing Strategy

Add tests for:

- response model validation for the new action union
- prompt construction with mission framing and existing datapoint context
- deterministic dedupe key generation
- adjacent chunk selection and hop expansion behavior
- insertion of many-to-one datapoint-to-chunk links
- duplicate suppression when a model returns an already-known datapoint

## Risks And Mitigations

- Token growth from expanded context: mitigate with a hard hop limit and compact existing-datapoint summaries.
- Duplicate near-matches: mitigate with deterministic normalized dedupe keys.
- Overeager retrieval requests: mitigate by restricting retrieval to deterministic adjacent chunks only.
- Schema drift during local development: mitigate by updating bootstrap SQL and tests together.
