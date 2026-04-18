# Frontend-Native Evidence Model Design

**Goal:** Redesign ingestion and extraction so PiecesOfThem stores fewer, higher-quality evidence objects that match the frontend's case dashboard and report views, while preserving source-level treatment provenance for treated-versus-untreated analysis.

## Problem

The current extraction pipeline stores chunk-level datapoints that are useful as internal facts, but they do not align cleanly with the product experience. The frontend examples are built around a small set of dated evidence fragments feeding an even smaller set of cited claims. The current extraction model also overproduces low-value rows such as identity, caregiver, and temporal metadata that do not help make the FDA-expedite story legible.

At the same time, treatment provenance already exists upstream in the seed catalog, but it is not propagated into the extracted evidence model in a way that downstream views can use directly.

## Design Principles

- Prefer fewer evidence rows with stronger reviewer value.
- Optimize for FDA-facing functional stability evidence, not generic fact extraction.
- Keep source lineage explicit from claim to fragment to chunk to source document.
- Treat treatment status as source-level provenance, not a fact the model must rediscover from chunk text.
- Match the frontend demo model directly so the backend produces product-ready data structures.

## Frontend-Native Product Model

The backend should move toward a claim-evidence graph with two visible layers.

### 1. Evidence Fragment

An evidence fragment is a dated, de-identified, reviewer-usable observation suitable for the dashboard timeline, evidence cards, and claim audit trail.

Recommended fields:

- `id`
- `case_id`
- `date`
- `source_type`
- `modality`
- `title`
- `excerpt`
- `tags`
- `signal_domain`
- `confidence`
- `raw_ref`
- `deidentified`
- `source_document_id`
- `supporting_chunk_ids`
- `treatment_status`
- `treatment_basis`
- `trial_program`
- `intervention_class`

The initial `signal_domain` vocabulary should match the frontend:

- `vocabulary`
- `recognition`
- `sleep`
- `behavior`
- `motor`

Confidence for visible evidence should match the frontend language:

- `high`
- `moderate`

### 2. Claim

A claim is a reviewer-facing synthesis statement built from multiple fragments. Claims power the regulatory summary cards and the report view.

Recommended fields:

- `id`
- `case_id`
- `statement`
- `domain`
- `trend`
- `confidence`
- `fragment_ids`
- `treatment_status`
- `trial_program`

The initial `trend` vocabulary should match the frontend:

- `stable`
- `improving`
- `declining`
- `mixed`

## What Stops Being First-Class UI Evidence

The following current extraction types should no longer be primary visible evidence objects:

- `child_identity`
- `caregiver_role`
- `disease_subtype`
- `trial_participation`
- most `temporal_marker` rows

These remain useful as metadata and provenance, but they should not dominate `extracted_datapoints` or be surfaced as peer objects to functional observations.

The main visible evidence path should be:

- `functional_signal` -> `EvidenceFragment`
- `outcome_claim` -> input to `Claim` synthesis

## Extraction Architecture

Use a two-stage model.

### Stage 1: Fragment Extraction

The model extracts a very small number of reviewer-usable evidence fragments from each chunk window.

Fragment extraction rules:

- prioritize functional evidence that supports the regulatory mission
- prefer strong retained-function observations over background details
- cap outputs per pass
- emit nothing rather than weak evidence
- assign exactly one `signal_domain`
- write display-ready `title` and `excerpt`
- preserve evidence lineage to loaded chunks only
- do not infer treatment status from text

The fragment extractor should heavily prioritize:

- vocabulary retention
- recognition of family, voices, or familiar objects
- sleep stability or sleep improvement
- behavior regulation or reduced disruptive episodes
- motor preservation in daily tasks

### Stage 2: Claim Synthesis

The model synthesizes a smaller set of longitudinal claims from existing fragments.

Claim synthesis rules:

- use fragments as the only evidence source
- prefer claims that show preserved function or stability over time
- require explicit citation lineage to fragment ids
- keep claim count small
- produce reviewer-friendly language suitable for dashboard cards and evidence briefs

Claims should be biased toward what helps the FDA-expedite story:

- sustained vocabulary
- preserved recognition
- improved or stabilized sleep
- behavior or routine stability
- preserved daily function

## Treatment Provenance Model

Treatment status must be attached from source-level provenance, not extracted from every chunk.

### Treatment Status Vocabulary

Recommended initial values:

- `treated`
- `untreated`
- `unknown`

### Treatment Basis Vocabulary

Recommended initial values:

- `seed_provenance`
- `manual_review`
- `document_evidence`

### Propagation Rule

Treatment provenance should flow through the ingestion pipeline as:

- `seed_source -> source_document -> evidence_fragment -> claim`

This allows all downstream evidence objects to carry a stable treatment classification without asking the model to infer it from narrative text.

## Important Provenance Constraint

Existing seed metadata shows that `confirmed_participation = false` does **not** automatically mean untreated. Public discovery sources are not valid untreated controls by default. The backend must not collapse “not confirmed participant” into “untreated.”

The design should therefore introduce a separate treatment-status classification rather than overloading the existing `confirmed_participation` boolean.

## Prompt Direction

The extraction prompt should be rewritten around evidence fragments, not generic datapoints.

The prompt must:

- ask for only the strongest functional evidence fragments
- explicitly deprioritize identity-only, caregiver-only, and weak temporal details
- optimize for reviewer-ready fragment titles and excerpts
- cap fragment count
- require domain assignment from the frontend domain vocabulary
- require evidence lineage to loaded chunks
- forbid treatment-status inference

The claim-synthesis prompt must:

- ask for only the strongest longitudinal claims
- prefer treated-case stability signals that support regulatory urgency
- require fragment citations
- use frontend-aligned `trend` and `confidence` values

## Storage Strategy

The current `ingestion.extracted_datapoints` table can remain as a staging or transitional layer if needed, but the product-facing canonical model should move to:

- `evidence_fragments`
- `evidence_fragment_chunks`
- `claims`
- `claim_fragments`

These tables should carry enough provenance to build the frontend payload directly.

Recommended metadata placement:

- case-level identity and disease details belong with the case record
- source-level treatment provenance belongs on fragments and claims
- chunk-level lineage belongs in join tables, not in display objects

## Testing Strategy

Add tests for:

- prompt behavior that suppresses low-value metadata-only outputs
- fragment extraction capped to a small number
- domain assignment restricted to the frontend vocabulary
- claim synthesis with valid fragment citations
- treatment-status propagation from seed/source provenance
- exclusion of weak evidence from visible fragment storage
- frontend payload shaping from fragment and claim records

## Migration Strategy

Implement in phases:

1. Introduce the new canonical fragment and claim model.
2. Preserve current extraction rows only as a staging layer if necessary.
3. Propagate source-level treatment provenance into the new visible evidence objects.
4. Add a claim-evidence payload mapper that matches the frontend's `CaseBundle` shape.
5. Retire or down-rank old raw datapoint types from product-facing views.

## Expected Outcome

After this redesign, PiecesOfThem should produce:

- fewer stored evidence objects
- higher-value functional evidence fragments
- a small, cited claim set aligned to the dashboard and evidence brief
- explicit treatment provenance on downstream evidence rows
- a backend payload shape that matches the teammate’s frontend vision with minimal translation
