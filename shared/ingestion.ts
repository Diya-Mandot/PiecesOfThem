/** Shared record shapes for the raw and canonical ingestion tables exposed through admin APIs. */
export type SeedSourceKind = "public-source" | "trial-participant";

export type SeedSourceAccess = "public";

export type SeedSourceConfidence =
  | "confirmed"
  | "likely-anonymized"
  | "aggregate-only"
  | "public-source";

export type SeedSourceRisk = "low" | "medium" | "high";

export type SeedSourceRecord = {
  id?: number | null;
  seed_id: string;
  kind: SeedSourceKind;
  label: string;
  source_urls: string[];
  platform: string;
  access: SeedSourceAccess;
  subject_label: string | null;
  child_age_signal: string;
  disease_subtype: string;
  trial_program: string | null;
  intervention_class: string | null;
  source_confidence: SeedSourceConfidence;
  named_publicly: boolean;
  confirmed_participation: boolean;
  source_type: string;
  author_role: string;
  symptom_domains: string[];
  temporal_signal: string;
  extraction_value: string;
  scrape_difficulty: SeedSourceRisk;
  consent_risk: SeedSourceRisk;
  comparison_use: string | null;
  evidence_summary: string;
  notes: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SourceDocumentRecord = {
  id?: number | null;
  seed_source_id: number;
  source_url: string;
  canonical_url: string | null;
  fetch_status: string;
  http_status: number | null;
  content_type: string | null;
  title: string | null;
  raw_html: string | null;
  clean_text: string | null;
  content_hash: string | null;
  fetched_at?: string | null;
  last_error: string | null;
  created_at?: string | null;
};

export type DocumentChunkRecord = {
  id?: number | null;
  source_document_id: number;
  chunk_index: number;
  char_start: number;
  char_end: number;
  token_estimate: number;
  chunk_text: string;
  chunk_hash: string;
  created_at?: string | null;
};

export type ExtractionRunRecord = {
  id?: number | null;
  source_document_id: number;
  extractor_name: string;
  model_name: string;
  prompt_version: string;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  error_message: string | null;
  created_at?: string | null;
};

export type ExtractedDatapointRecord = {
  id?: number | null;
  extraction_run_id: number;
  source_document_id: number;
  datapoint_type: string;
  schema_version: string;
  dedupe_key: string;
  subject_label: string | null;
  disease_subtype: string | null;
  trial_program: string | null;
  value_json: Record<string, unknown>;
  confidence: string;
  evidence_quote: string;
  chunk_ids: number[];
  char_start: number | null;
  char_end: number | null;
  created_at?: string | null;
};

export type ExtractionIssueRecord = {
  id?: number | null;
  extraction_run_id: number | null;
  source_document_id: number;
  chunk_id: number | null;
  issue_type: string;
  raw_output: string | null;
  message: string;
  created_at?: string | null;
};

export type EvidenceFragmentRecord = {
  id?: number | null;
  external_id: string;
  case_id: string;
  source_document_id: number;
  fragment_date: string;
  source_type: string;
  modality: string;
  title: string;
  excerpt: string;
  tags_json: string[];
  signal_domain: string;
  confidence: string;
  raw_ref: string;
  treatment_status: string;
  treatment_basis: string;
  trial_program: string | null;
  intervention_class: string | null;
  chunk_ids: number[];
  created_at?: string | null;
};

export type ClaimRecord = {
  id?: number | null;
  external_id: string;
  case_id: string;
  statement: string;
  signal_domain: string;
  trend: string;
  confidence: string;
  treatment_status: string;
  trial_program: string | null;
  fragment_ids: string[];
  created_at?: string | null;
};
