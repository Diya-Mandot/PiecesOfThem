CREATE SCHEMA IF NOT EXISTS ingestion;

CREATE TABLE IF NOT EXISTS ingestion.seed_sources (
  id BIGSERIAL PRIMARY KEY,
  seed_id TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  source_urls JSONB NOT NULL,
  platform TEXT NOT NULL,
  access TEXT NOT NULL,
  subject_label TEXT,
  child_age_signal TEXT NOT NULL,
  disease_subtype TEXT NOT NULL,
  trial_program TEXT,
  intervention_class TEXT,
  source_confidence TEXT NOT NULL,
  named_publicly BOOLEAN NOT NULL,
  confirmed_participation BOOLEAN NOT NULL,
  source_type TEXT NOT NULL,
  author_role TEXT NOT NULL,
  symptom_domains JSONB NOT NULL,
  temporal_signal TEXT NOT NULL,
  extraction_value TEXT NOT NULL,
  scrape_difficulty TEXT NOT NULL,
  consent_risk TEXT NOT NULL,
  comparison_use TEXT,
  evidence_summary TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion.source_documents (
  id BIGSERIAL PRIMARY KEY,
  seed_source_id BIGINT NOT NULL REFERENCES ingestion.seed_sources(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  canonical_url TEXT,
  fetch_status TEXT NOT NULL,
  http_status INTEGER,
  content_type TEXT,
  title TEXT,
  raw_html TEXT,
  clean_text TEXT,
  content_hash TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seed_source_id, source_url, content_hash)
);

CREATE UNIQUE INDEX IF NOT EXISTS source_documents_seed_source_url_content_hash_uq
  ON ingestion.source_documents (seed_source_id, source_url, COALESCE(content_hash, ''));

CREATE TABLE IF NOT EXISTS ingestion.document_chunks (
  id BIGSERIAL PRIMARY KEY,
  source_document_id BIGINT NOT NULL REFERENCES ingestion.source_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  char_start INTEGER NOT NULL,
  char_end INTEGER NOT NULL,
  token_estimate INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_document_id, chunk_index),
  UNIQUE(id, source_document_id)
);

CREATE TABLE IF NOT EXISTS ingestion.extraction_runs (
  id BIGSERIAL PRIMARY KEY,
  source_document_id BIGINT NOT NULL REFERENCES ingestion.source_documents(id) ON DELETE CASCADE,
  extractor_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id, source_document_id)
);

CREATE TABLE IF NOT EXISTS ingestion.extracted_datapoints (
  id BIGSERIAL PRIMARY KEY,
  extraction_run_id BIGINT NOT NULL,
  source_document_id BIGINT NOT NULL REFERENCES ingestion.source_documents(id) ON DELETE CASCADE,
  chunk_id BIGINT NOT NULL,
  datapoint_type TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  subject_label TEXT,
  disease_subtype TEXT,
  trial_program TEXT,
  value_json JSONB NOT NULL,
  confidence TEXT NOT NULL,
  evidence_quote TEXT NOT NULL,
  char_start INTEGER,
  char_end INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT extracted_datapoints_extraction_run_source_document_fk
    FOREIGN KEY (extraction_run_id, source_document_id)
    REFERENCES ingestion.extraction_runs(id, source_document_id)
    ON DELETE CASCADE,
  CONSTRAINT extracted_datapoints_chunk_source_document_fk
    FOREIGN KEY (chunk_id, source_document_id)
    REFERENCES ingestion.document_chunks(id, source_document_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ingestion.extraction_issues (
  id BIGSERIAL PRIMARY KEY,
  extraction_run_id BIGINT,
  source_document_id BIGINT NOT NULL REFERENCES ingestion.source_documents(id) ON DELETE CASCADE,
  chunk_id BIGINT,
  issue_type TEXT NOT NULL,
  raw_output TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT extraction_issues_extraction_run_source_document_fk
    FOREIGN KEY (extraction_run_id, source_document_id)
    REFERENCES ingestion.extraction_runs(id, source_document_id)
    ON DELETE CASCADE,
  CONSTRAINT extraction_issues_chunk_source_document_fk
    FOREIGN KEY (chunk_id, source_document_id)
    REFERENCES ingestion.document_chunks(id, source_document_id)
    ON DELETE CASCADE
);
