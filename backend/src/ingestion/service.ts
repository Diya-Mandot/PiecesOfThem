import type {
  ListClaimsResponse,
  ListDocumentChunksResponse,
  ListEvidenceFragmentsResponse,
  ListExtractedDatapointsResponse,
  ListExtractionIssuesResponse,
  ListExtractionRunsResponse,
  ListSeedSourcesResponse,
  ListSourceDocumentsResponse,
} from "../../../shared/ingestion-api.js";

import type { IngestionRepository } from "./repository.js";

/** Thin orchestration layer that normalizes repository output into API response envelopes. */
export class IngestionService {
  constructor(private readonly repository: IngestionRepository) {}

  async listSeedSources(filters: {
    kind?: string;
    disease_subtype?: string;
    trial_program?: string;
    comparison_use?: string;
    named_publicly?: boolean;
    confirmed_participation?: boolean;
  }): Promise<ListSeedSourcesResponse> {
    const seedSources = await this.repository.listSeedSources([
      ["kind", filters.kind],
      ["disease_subtype", filters.disease_subtype],
      ["trial_program", filters.trial_program],
      ["comparison_use", filters.comparison_use],
      ["named_publicly", filters.named_publicly],
      ["confirmed_participation", filters.confirmed_participation],
    ]);

    return { seed_sources: seedSources, total_count: seedSources.length };
  }

  async getSeedSource(seedId: string) {
    return this.repository.getSeedSource(seedId);
  }

  async listSourceDocuments(filters: {
    seed_source_id?: number;
    fetch_status?: string;
    content_type?: string;
  }): Promise<ListSourceDocumentsResponse> {
    const sourceDocuments = await this.repository.listSourceDocuments([
      ["seed_source_id", filters.seed_source_id],
      ["fetch_status", filters.fetch_status],
      ["content_type", filters.content_type],
    ]);

    return { source_documents: sourceDocuments, total_count: sourceDocuments.length };
  }

  async getSourceDocument(id: number) {
    return this.repository.getSourceDocument(id);
  }

  async listDocumentChunks(filters: { source_document_id?: number }): Promise<ListDocumentChunksResponse> {
    const documentChunks = await this.repository.listDocumentChunks([["source_document_id", filters.source_document_id]]);
    return { document_chunks: documentChunks, total_count: documentChunks.length };
  }

  async getDocumentChunk(id: number) {
    return this.repository.getDocumentChunk(id);
  }

  async listExtractionRuns(filters: {
    source_document_id?: number;
    status?: string;
    extractor_name?: string;
    model_name?: string;
  }): Promise<ListExtractionRunsResponse> {
    const extractionRuns = await this.repository.listExtractionRuns([
      ["source_document_id", filters.source_document_id],
      ["status", filters.status],
      ["extractor_name", filters.extractor_name],
      ["model_name", filters.model_name],
    ]);

    return { extraction_runs: extractionRuns, total_count: extractionRuns.length };
  }

  async getExtractionRun(id: number) {
    return this.repository.getExtractionRun(id);
  }

  async listEvidenceFragments(filters: {
    source_document_id?: number;
    case_id?: string;
    signal_domain?: string;
    confidence?: string;
    treatment_status?: string;
    trial_program?: string;
  }): Promise<ListEvidenceFragmentsResponse> {
    const evidenceFragments = await this.repository.listEvidenceFragments([
      ["source_document_id", filters.source_document_id],
      ["case_id", filters.case_id],
      ["signal_domain", filters.signal_domain],
      ["confidence", filters.confidence],
      ["treatment_status", filters.treatment_status],
      ["trial_program", filters.trial_program],
    ]);

    return { evidence_fragments: evidenceFragments, total_count: evidenceFragments.length };
  }

  async getEvidenceFragment(id: number) {
    return this.repository.getEvidenceFragment(id);
  }

  async listClaims(filters: {
    case_id?: string;
    signal_domain?: string;
    trend?: string;
    confidence?: string;
    treatment_status?: string;
    trial_program?: string;
  }): Promise<ListClaimsResponse> {
    const claims = await this.repository.listClaims([
      ["case_id", filters.case_id],
      ["signal_domain", filters.signal_domain],
      ["trend", filters.trend],
      ["confidence", filters.confidence],
      ["treatment_status", filters.treatment_status],
      ["trial_program", filters.trial_program],
    ]);

    return { claims, total_count: claims.length };
  }

  async getClaim(id: number) {
    return this.repository.getClaim(id);
  }

  async listExtractedDatapoints(filters: {
    source_document_id?: number;
    chunk_id?: number;
    datapoint_type?: string;
    disease_subtype?: string;
    trial_program?: string;
    confidence?: string;
  }): Promise<ListExtractedDatapointsResponse> {
    const extractedDatapoints = await this.repository.listExtractedDatapoints([
      ["source_document_id", filters.source_document_id],
      ["chunk_id", filters.chunk_id],
      ["datapoint_type", filters.datapoint_type],
      ["disease_subtype", filters.disease_subtype],
      ["trial_program", filters.trial_program],
      ["confidence", filters.confidence],
    ]);

    return { extracted_datapoints: extractedDatapoints, total_count: extractedDatapoints.length };
  }

  async getExtractedDatapoint(id: number) {
    return this.repository.getExtractedDatapoint(id);
  }

  async listExtractionIssues(filters: {
    source_document_id?: number;
    chunk_id?: number;
    issue_type?: string;
  }): Promise<ListExtractionIssuesResponse> {
    const extractionIssues = await this.repository.listExtractionIssues([
      ["source_document_id", filters.source_document_id],
      ["chunk_id", filters.chunk_id],
      ["issue_type", filters.issue_type],
    ]);

    return { extraction_issues: extractionIssues, total_count: extractionIssues.length };
  }

  async getExtractionIssue(id: number) {
    return this.repository.getExtractionIssue(id);
  }
}
