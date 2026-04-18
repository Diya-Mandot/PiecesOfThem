import type {
  ClaimRecord,
  DocumentChunkRecord,
  EvidenceFragmentRecord,
  ExtractedDatapointRecord,
  ExtractionIssueRecord,
  ExtractionRunRecord,
  SeedSourceRecord,
  SourceDocumentRecord
} from "./ingestion";

/** Shared ingestion/admin API contracts for inspecting raw pipeline tables. */
type PaginationMeta = {
  total_count: number;
};

export type ListSeedSourcesQuery = {
  kind?: string;
  disease_subtype?: string;
  trial_program?: string;
  comparison_use?: string;
  named_publicly?: string;
  confirmed_participation?: string;
};

export type ListSeedSourcesResponse = {
  seed_sources: SeedSourceRecord[];
} & PaginationMeta;

export type GetSeedSourceResponse = {
  seed_source: SeedSourceRecord;
};

export type ListSourceDocumentsQuery = {
  seed_source_id?: string;
  fetch_status?: string;
  content_type?: string;
};

export type ListSourceDocumentsResponse = {
  source_documents: SourceDocumentRecord[];
} & PaginationMeta;

export type GetSourceDocumentResponse = {
  source_document: SourceDocumentRecord;
};

export type ListDocumentChunksQuery = {
  source_document_id?: string;
};

export type ListDocumentChunksResponse = {
  document_chunks: DocumentChunkRecord[];
} & PaginationMeta;

export type GetDocumentChunkResponse = {
  document_chunk: DocumentChunkRecord;
};

export type ListExtractionRunsQuery = {
  source_document_id?: string;
  status?: string;
  extractor_name?: string;
  model_name?: string;
};

export type ListExtractionRunsResponse = {
  extraction_runs: ExtractionRunRecord[];
} & PaginationMeta;

export type GetExtractionRunResponse = {
  extraction_run: ExtractionRunRecord;
};

export type ListEvidenceFragmentsQuery = {
  source_document_id?: string;
  case_id?: string;
  signal_domain?: string;
  confidence?: string;
  treatment_status?: string;
  trial_program?: string;
};

export type ListEvidenceFragmentsResponse = {
  evidence_fragments: EvidenceFragmentRecord[];
} & PaginationMeta;

export type GetEvidenceFragmentResponse = {
  evidence_fragment: EvidenceFragmentRecord;
};

export type ListClaimsQuery = {
  case_id?: string;
  signal_domain?: string;
  trend?: string;
  confidence?: string;
  treatment_status?: string;
  trial_program?: string;
};

export type ListClaimsResponse = {
  claims: ClaimRecord[];
} & PaginationMeta;

export type GetClaimResponse = {
  claim: ClaimRecord;
};

export type ListExtractedDatapointsQuery = {
  source_document_id?: string;
  chunk_id?: string;
  datapoint_type?: string;
  disease_subtype?: string;
  trial_program?: string;
  confidence?: string;
};

export type ListExtractedDatapointsResponse = {
  extracted_datapoints: ExtractedDatapointRecord[];
} & PaginationMeta;

export type GetExtractedDatapointResponse = {
  extracted_datapoint: ExtractedDatapointRecord;
};

export type ListExtractionIssuesQuery = {
  source_document_id?: string;
  chunk_id?: string;
  issue_type?: string;
};

export type ListExtractionIssuesResponse = {
  extraction_issues: ExtractionIssueRecord[];
} & PaginationMeta;

export type GetExtractionIssueResponse = {
  extraction_issue: ExtractionIssueRecord;
};
