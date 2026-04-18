import type { Pool } from "pg";

import type {
  DocumentChunkRecord,
  ExtractedDatapointRecord,
  ExtractionIssueRecord,
  ExtractionRunRecord,
  SeedSourceRecord,
  SourceDocumentRecord,
} from "../../../shared/ingestion.js";

type QueryFilters = Array<[column: string, value: unknown | undefined]>;

export class IngestionRepository {
  constructor(private readonly pool: Pool) {}

  async listSeedSources(filters: QueryFilters = []) {
    const { text, values } = buildSelect("ingestion.seed_sources", filters);
    const result = await this.pool.query(text, values);
    return result.rows.map((row: unknown) => mapSeedSource(row as Record<string, unknown>));
  }

  async getSeedSource(seedId: string) {
    const result = await this.pool.query(
      "SELECT * FROM ingestion.seed_sources WHERE seed_id = $1 LIMIT 1",
      [seedId],
    );
    return result.rows[0] ? mapSeedSource(result.rows[0] as Record<string, unknown>) : null;
  }

  async listSourceDocuments(filters: QueryFilters = []) {
    const { text, values } = buildSelect("ingestion.source_documents", filters);
    const result = await this.pool.query(text, values);
    return result.rows.map((row: unknown) => mapSourceDocument(row as Record<string, unknown>));
  }

  async getSourceDocument(id: number) {
    const result = await this.pool.query(
      "SELECT * FROM ingestion.source_documents WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] ? mapSourceDocument(result.rows[0] as Record<string, unknown>) : null;
  }

  async listDocumentChunks(filters: QueryFilters = []) {
    const { text, values } = buildSelect("ingestion.document_chunks", filters);
    const result = await this.pool.query(text, values);
    return result.rows.map((row: unknown) => mapDocumentChunk(row as Record<string, unknown>));
  }

  async getDocumentChunk(id: number) {
    const result = await this.pool.query(
      "SELECT * FROM ingestion.document_chunks WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] ? mapDocumentChunk(result.rows[0] as Record<string, unknown>) : null;
  }

  async listExtractionRuns(filters: QueryFilters = []) {
    const { text, values } = buildSelect("ingestion.extraction_runs", filters);
    const result = await this.pool.query(text, values);
    return result.rows.map((row: unknown) => mapExtractionRun(row as Record<string, unknown>));
  }

  async getExtractionRun(id: number) {
    const result = await this.pool.query(
      "SELECT * FROM ingestion.extraction_runs WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] ? mapExtractionRun(result.rows[0] as Record<string, unknown>) : null;
  }

  async listExtractedDatapoints(filters: QueryFilters = []) {
    const { text, values } = buildSelect("ingestion.extracted_datapoints", filters);
    const result = await this.pool.query(text, values);
    return result.rows.map((row: unknown) => mapExtractedDatapoint(row as Record<string, unknown>));
  }

  async getExtractedDatapoint(id: number) {
    const result = await this.pool.query(
      "SELECT * FROM ingestion.extracted_datapoints WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] ? mapExtractedDatapoint(result.rows[0] as Record<string, unknown>) : null;
  }

  async listExtractionIssues(filters: QueryFilters = []) {
    const { text, values } = buildSelect("ingestion.extraction_issues", filters);
    const result = await this.pool.query(text, values);
    return result.rows.map((row: unknown) => mapExtractionIssue(row as Record<string, unknown>));
  }

  async getExtractionIssue(id: number) {
    const result = await this.pool.query(
      "SELECT * FROM ingestion.extraction_issues WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] ? mapExtractionIssue(result.rows[0] as Record<string, unknown>) : null;
  }
}

function buildSelect(table: string, filters: QueryFilters) {
  const activeFilters = filters.filter(([, value]) => value !== undefined);
  const where =
    activeFilters.length === 0
      ? ""
      : ` WHERE ${activeFilters
          .map(([column], index) => `${column} = $${index + 1}`)
          .join(" AND ")}`;
  const text = `SELECT * FROM ${table}${where} ORDER BY id ASC`;
  const values = activeFilters.map(([, value]) => value);
  return { text, values };
}

function mapSeedSource(row: Record<string, unknown>): SeedSourceRecord {
  return {
    ...row,
    id: toNullableNumber(row.id),
    created_at: toNullableString(row.created_at),
    updated_at: toNullableString(row.updated_at),
  } as SeedSourceRecord;
}

function mapSourceDocument(row: Record<string, unknown>): SourceDocumentRecord {
  return {
    ...row,
    id: toNullableNumber(row.id),
    seed_source_id: Number(row.seed_source_id),
    http_status: toNullableNumber(row.http_status),
    fetched_at: toNullableString(row.fetched_at),
    created_at: toNullableString(row.created_at),
  } as SourceDocumentRecord;
}

function mapDocumentChunk(row: Record<string, unknown>): DocumentChunkRecord {
  return {
    ...row,
    id: toNullableNumber(row.id),
    source_document_id: Number(row.source_document_id),
    chunk_index: Number(row.chunk_index),
    char_start: Number(row.char_start),
    char_end: Number(row.char_end),
    token_estimate: Number(row.token_estimate),
    created_at: toNullableString(row.created_at),
  } as DocumentChunkRecord;
}

function mapExtractionRun(row: Record<string, unknown>): ExtractionRunRecord {
  return {
    ...row,
    id: toNullableNumber(row.id),
    source_document_id: Number(row.source_document_id),
    started_at: toNullableString(row.started_at),
    completed_at: toNullableString(row.completed_at),
    created_at: toNullableString(row.created_at),
  } as ExtractionRunRecord;
}

function mapExtractedDatapoint(row: Record<string, unknown>): ExtractedDatapointRecord {
  return {
    ...row,
    id: toNullableNumber(row.id),
    extraction_run_id: Number(row.extraction_run_id),
    source_document_id: Number(row.source_document_id),
    chunk_id: Number(row.chunk_id),
    value_json: (row.value_json ?? {}) as Record<string, unknown>,
    char_start: toNullableNumber(row.char_start),
    char_end: toNullableNumber(row.char_end),
    created_at: toNullableString(row.created_at),
  } as ExtractedDatapointRecord;
}

function mapExtractionIssue(row: Record<string, unknown>): ExtractionIssueRecord {
  return {
    ...row,
    id: toNullableNumber(row.id),
    extraction_run_id: toNullableNumber(row.extraction_run_id),
    source_document_id: Number(row.source_document_id),
    chunk_id: toNullableNumber(row.chunk_id),
    created_at: toNullableString(row.created_at),
  } as ExtractionIssueRecord;
}

function toNullableNumber(value: unknown) {
  return value === null || value === undefined ? null : Number(value);
}

function toNullableString(value: unknown) {
  return value === null || value === undefined ? null : String(value);
}
