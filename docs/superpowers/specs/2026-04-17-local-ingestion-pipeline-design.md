# Local Ingestion Pipeline Design

## Goal

Build a local-only, repeatable ingestion pipeline for hackathon use that:

1. deterministically scrapes cataloged public sources into PostgreSQL
2. stores raw text and deterministic chunks in an ingestion schema
3. runs an agentic LLM extraction step over stored raw text
4. writes validated structured candidate datapoints into ingestion tables
5. leaves mapping into the app model for a later phase

## Scope

In scope:

- local Python pipeline
- Docker Compose Postgres bootstrapping
- idempotent schema initialization
- deterministic scraping and chunking
- LLM extraction into ingestion tables
- audit fields for provenance, confidence, and rerun tracking

Out of scope:

- production deployment
- background workers
- app-integrated API endpoints
- automatic mapping into `CaseRecord`, `EvidenceFragment`, or `Claim`
- authentication or multi-user workflows

## Recommended Architecture

Use a DB-centered staged pipeline with explicit statuses but a simple CLI runner.

This gives us:

- deterministic first-stage scraping
- resumability across reruns
- a clean separation between raw capture and LLM interpretation
- one source of truth in PostgreSQL
- minimal moving parts for a hackathon demo

## Repository Layout

Add a Python pipeline package under a new top-level folder:

```text
pipeline/
  main.py
  config.py
  db.py
  bootstrap.py
  scrape.py
  extract.py
  chunking.py
  models.py
  prompts/
    extraction_prompt.md
  sql/
    init.sql
docker-compose.yml
.env.example
```

## Runtime Model

The pipeline is local-only and CLI-driven.

Primary commands:

- `python -m pipeline.main ensure-db`
- `python -m pipeline.main init-db`
- `python -m pipeline.main sync-seeds`
- `python -m pipeline.main scrape`
- `python -m pipeline.main extract`
- `python -m pipeline.main run-all`

Recommended `run-all` flow:

1. try connecting to Postgres
2. if unavailable, run `docker compose up -d postgres`
3. poll until the database is reachable
4. run idempotent schema initialization
5. sync normalized seed catalog into `seed_sources`
6. scrape unsynced or stale source URLs
7. create deterministic chunks for new raw documents
8. run LLM extraction on eligible chunks

## Docker and DB Bootstrap

### Compose behavior

Use a single Postgres service in `docker-compose.yml`.

The main job should:

- first check whether the configured Postgres database is reachable
- only invoke Docker Compose if the database is not reachable
- never destroy existing volumes automatically
- assume a local persistent volume for repeatability

### Health check strategy

`ensure-db` should:

1. attempt a normal database connection
2. if it succeeds, return immediately
3. if it fails, invoke `docker compose up -d postgres`
4. retry connection on a short interval until timeout
5. fail with a clear message if Postgres does not come up

This keeps startup deterministic and friendly for a live demo.

## Ingestion Schema

Create a dedicated ingestion schema in Postgres rather than mixing with future app tables.

Schema name:

- `ingestion`

### `ingestion.seed_sources`

Purpose:

- persist the normalized seed catalog in the database
- support filtering, status tracking, and source-level provenance

Key fields:

- `id`
- `seed_id`
- `kind`
- `label`
- `source_urls` as JSON or array
- `platform`
- `subject_label`
- `disease_subtype`
- `trial_program`
- `intervention_class`
- `source_confidence`
- `named_publicly`
- `confirmed_participation`
- `source_type`
- `author_role`
- `symptom_domains` as JSON or array
- `temporal_signal`
- `extraction_value`
- `scrape_difficulty`
- `consent_risk`
- `comparison_use`
- `evidence_summary`
- `notes`
- `created_at`
- `updated_at`

### `ingestion.source_documents`

Purpose:

- store fetched source artifacts and normalized raw text

One row per fetched URL version.

Key fields:

- `id`
- `seed_source_id`
- `source_url`
- `canonical_url`
- `fetch_status`
- `http_status`
- `content_type`
- `title`
- `raw_html` as text
- `clean_text`
- `content_hash`
- `fetched_at`
- `last_error`
- `created_at`

Constraints and behavior:

- unique on `seed_source_id`, `source_url`, `content_hash`
- if content hash is unchanged, avoid duplicating chunk and extraction work

### `ingestion.document_chunks`

Purpose:

- store deterministic chunks created from `clean_text`

Key fields:

- `id`
- `source_document_id`
- `chunk_index`
- `char_start`
- `char_end`
- `token_estimate`
- `chunk_text`
- `chunk_hash`
- `created_at`

Constraints:

- unique on `source_document_id`, `chunk_index`

### `ingestion.extraction_runs`

Purpose:

- track each extraction pass for auditability and reruns

Key fields:

- `id`
- `source_document_id`
- `extractor_name`
- `model_name`
- `prompt_version`
- `status`
- `started_at`
- `completed_at`
- `error_message`
- `created_at`

### `ingestion.extracted_datapoints`

Purpose:

- store validated LLM-generated candidate facts
- preserve evidence lineage back to chunk and source document

Key fields:

- `id`
- `extraction_run_id`
- `source_document_id`
- `chunk_id`
- `datapoint_type`
- `schema_version`
- `subject_label`
- `disease_subtype`
- `trial_program`
- `value_json`
- `confidence`
- `evidence_quote`
- `char_start`
- `char_end`
- `created_at`

Notes:

- `value_json` allows the first schema version to evolve without rewriting table design
- downstream mapping into app-model rows can transform from these candidate datapoints later

### `ingestion.extraction_issues`

Purpose:

- record invalid model output, parse failures, schema mismatches, and insertion errors

Key fields:

- `id`
- `extraction_run_id`
- `source_document_id`
- `chunk_id`
- `issue_type`
- `raw_output`
- `message`
- `created_at`

## Deterministic Scraping Design

### Input

The scraper reads from `seedCatalog` in `lib/seed-catalog.ts`.

Because the Python pipeline should not parse TypeScript directly, we should export the catalog into a stable JSON artifact during implementation, or create a small mirrored JSON file checked into the repo. For the hackathon phase, the simplest path is to create a JSON seed file derived from the catalog.

### Fetching

Use a deterministic fetch stack:

- `requests`
- fixed timeout
- fixed user agent
- no browser automation
- no LLM involvement

### Extraction of visible text

Use fixed parsing rules:

- parse HTML with `BeautifulSoup`
- remove script, style, noscript, nav, footer, and obvious boilerplate tags
- preserve document title when possible
- normalize whitespace
- preserve paragraph boundaries when possible

### Idempotency

For each fetched page:

- compute a content hash of normalized text
- if the latest stored document for that URL has the same hash, skip rechunking and re-extraction

This makes reruns cheap and deterministic.

## Deterministic Chunking Design

Chunking should remain entirely deterministic.

Recommended first pass:

- paragraph-aware chunk builder
- target size around 1,500 to 2,500 characters
- fixed overlap around 200 characters
- stable chunk ordering

Chunking must emit:

- text
- boundaries
- hash
- estimated token count

## Agentic Extraction Design

The LLM stage begins only after raw text is stored in the database.

### Input boundary

The extractor may read only:

- `source_documents.clean_text`
- `document_chunks.chunk_text`
- source metadata already stored in the ingestion schema

The extractor should not fetch the live web again.

### Output contract

The model must return strict JSON matching a defined extraction schema.

Initial datapoint categories should support:

- child identity mention
- caregiver role
- disease subtype
- treatment or trial participation
- functional signal
- temporal marker
- outcome claim
- direct evidence quote

### Validation

Every extraction response should be:

1. parsed as JSON
2. validated against a deterministic schema
3. inserted only if valid
4. otherwise logged to `extraction_issues`

### Auditability

Each datapoint should include:

- the exact quote that supports it
- originating document
- originating chunk
- model and prompt version

This is essential for later regulatory-style evidence tracing.

## Suggested Datapoint JSON Shape

The first extraction schema should be flexible but bounded.

```json
{
  "datapoints": [
    {
      "datapoint_type": "trial_participation",
      "subject_label": "Eliza O'Neill",
      "disease_subtype": "MPS IIIA",
      "trial_program": "UX111-ABO-102",
      "confidence": "high",
      "evidence_quote": "Eliza was treated ...",
      "value": {
        "participation_status": "confirmed",
        "named_publicly": true
      }
    }
  ]
}
```

The exact schema can be finalized during implementation, but the ingestion table design above already supports it.

## Error Handling

### Scraping stage

Handle and persist:

- network timeout
- non-200 responses
- unsupported content type
- empty cleaned text

Errors should be recorded on the relevant document row rather than crashing the whole run.

### Extraction stage

Handle and persist:

- model call failures
- malformed JSON
- schema validation failures
- insertion errors

The pipeline should continue processing other chunks when one chunk fails.

## Configuration

Use environment variables for:

- Postgres host
- Postgres port
- Postgres database
- Postgres user
- Postgres password
- OpenAI API key
- extraction model name

Provide a checked-in `.env.example`.

## Recommended Implementation Order

1. Add Docker Compose Postgres service
2. Add SQL init for ingestion schema and tables
3. Add Python DB bootstrap and health checks
4. Add seed sync from normalized catalog artifact
5. Add deterministic scraper into `source_documents`
6. Add deterministic chunker into `document_chunks`
7. Add extraction schema and LLM client
8. Add validated extraction writes into `extracted_datapoints`

## Risks and Mitigations

### Risk: catalog lives in TypeScript, scraper is Python

Mitigation:

- introduce a repo-stable JSON export for ingestion seeds

### Risk: fragile HTML structures across sites

Mitigation:

- start with simple generic extraction rules
- rely on normalized text storage so parser improvements can be re-run later

### Risk: LLM outputs drift

Mitigation:

- strict JSON schema
- prompt versioning
- validation before insert

### Risk: sensitive public health narratives

Mitigation:

- preserve consent-risk fields from the catalog
- keep public named, anonymized, and aggregate cases distinct
- avoid downstream app-model mapping until later review

## Decision Summary

Chosen approach:

- local-only Python pipeline
- Docker Compose managed Postgres
- dedicated ingestion schema first
- deterministic scraping and chunking
- agentic extraction second
- later mapping into the app model

This is the best fit for the hackathon because it is fast to implement, easy to rerun, and preserves a clean audit trail from raw public text to extracted candidate evidence.
