import type { Pool } from "pg";

import type {
  ClaimRecord,
  DocumentChunkRecord,
  EvidenceFragmentRecord,
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

  async listEvidenceFragments(filters: QueryFilters = []) {
    const { text, values } = buildEvidenceFragmentsSelect(filters);
    const result = await this.pool.query(text, values);
    return result.rows.map((row: unknown) => mapEvidenceFragment(row as Record<string, unknown>));
  }

  async getEvidenceFragment(id: number) {
    const result = await this.pool.query(buildEvidenceFragmentsByIdSelect(), [id]);
    return result.rows[0] ? mapEvidenceFragment(result.rows[0] as Record<string, unknown>) : null;
  }

  async listClaims(filters: QueryFilters = []) {
    const { text, values } = buildClaimsSelect(filters);
    const result = await this.pool.query(text, values);
    return result.rows.map((row: unknown) => mapClaim(row as Record<string, unknown>));
  }

  async getClaim(id: number) {
    const result = await this.pool.query(buildClaimsByIdSelect(), [id]);
    return result.rows[0] ? mapClaim(result.rows[0] as Record<string, unknown>) : null;
  }

  async listExtractedDatapoints(filters: QueryFilters = []) {
    const { text, values } = buildExtractedDatapointsSelect(filters);
    const result = await this.pool.query(text, values);
    return result.rows.map((row: unknown) => mapExtractedDatapoint(row as Record<string, unknown>));
  }

  async getExtractedDatapoint(id: number) {
    const result = await this.pool.query(buildExtractedDatapointsByIdSelect(), [id]);
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

function buildEvidenceFragmentsSelect(filters: QueryFilters) {
  const { where, values } = buildWhereClause(filters, 1);
  return {
    text: `
      SELECT
        ef.*,
        COALESCE(
          array_agg(efc.chunk_id ORDER BY efc.chunk_order)
            FILTER (WHERE efc.chunk_id IS NOT NULL),
          ARRAY[]::bigint[]
        ) AS chunk_ids
      FROM ingestion.evidence_fragments ef
      LEFT JOIN ingestion.evidence_fragment_chunks efc
        ON efc.evidence_fragment_id = ef.id
      ${where}
      GROUP BY ef.id
      ORDER BY ef.id ASC
    `,
    values,
  };
}

function buildEvidenceFragmentsByIdSelect() {
  return `
    SELECT
      ef.*,
      COALESCE(
        array_agg(efc.chunk_id ORDER BY efc.chunk_order)
          FILTER (WHERE efc.chunk_id IS NOT NULL),
        ARRAY[]::bigint[]
      ) AS chunk_ids
    FROM ingestion.evidence_fragments ef
    LEFT JOIN ingestion.evidence_fragment_chunks efc
      ON efc.evidence_fragment_id = ef.id
    WHERE ef.id = $1
    GROUP BY ef.id
    LIMIT 1
  `;
}

function buildClaimsSelect(filters: QueryFilters) {
  const { where, values } = buildWhereClause(filters, 1, "c");
  return {
    text: `
      SELECT
        c.*,
        COALESCE(
          array_agg(cf.fragment_external_id ORDER BY cf.fragment_order)
            FILTER (WHERE cf.fragment_external_id IS NOT NULL),
          ARRAY[]::text[]
        ) AS fragment_ids
      FROM ingestion.claims c
      LEFT JOIN ingestion.claim_fragments cf
        ON cf.claim_id = c.id
      ${where}
      GROUP BY c.id
      ORDER BY c.id ASC
    `,
    values,
  };
}

function buildClaimsByIdSelect() {
  return `
    SELECT
      c.*,
      COALESCE(
        array_agg(cf.fragment_external_id ORDER BY cf.fragment_order)
          FILTER (WHERE cf.fragment_external_id IS NOT NULL),
        ARRAY[]::text[]
      ) AS fragment_ids
    FROM ingestion.claims c
    LEFT JOIN ingestion.claim_fragments cf
      ON cf.claim_id = c.id
    WHERE c.id = $1
    GROUP BY c.id
    LIMIT 1
  `;
}

function buildExtractedDatapointsSelect(filters: QueryFilters) {
  const activeFilters = filters.filter(([, value]) => value !== undefined);
  const values: unknown[] = [];
  const conditions: string[] = [];

  for (const [column, value] of activeFilters) {
    values.push(value);
    const parameter = `$${values.length}`;
    if (column === "chunk_id") {
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM ingestion.extracted_datapoint_chunks edc
          WHERE edc.extracted_datapoint_id = ed.id
            AND edc.chunk_id = ${parameter}
        )
      `);
      continue;
    }

    conditions.push(`ed.${column} = ${parameter}`);
  }

  const where = conditions.length === 0 ? "" : `WHERE ${conditions.join(" AND ")}`;
  return {
    text: `
      SELECT
        ed.*,
        COALESCE(
          array_agg(edc.chunk_id ORDER BY edc.chunk_order)
            FILTER (WHERE edc.chunk_id IS NOT NULL),
          ARRAY[]::bigint[]
        ) AS chunk_ids
      FROM ingestion.extracted_datapoints ed
      LEFT JOIN ingestion.extracted_datapoint_chunks edc
        ON edc.extracted_datapoint_id = ed.id
      ${where}
      GROUP BY ed.id
      ORDER BY ed.id ASC
    `,
    values,
  };
}

function buildExtractedDatapointsByIdSelect() {
  return `
    SELECT
      ed.*,
      COALESCE(
        array_agg(edc.chunk_id ORDER BY edc.chunk_order)
          FILTER (WHERE edc.chunk_id IS NOT NULL),
        ARRAY[]::bigint[]
      ) AS chunk_ids
    FROM ingestion.extracted_datapoints ed
    LEFT JOIN ingestion.extracted_datapoint_chunks edc
      ON edc.extracted_datapoint_id = ed.id
    WHERE ed.id = $1
    GROUP BY ed.id
    LIMIT 1
  `;
}

function buildWhereClause(filters: QueryFilters, startIndex: number, tableAlias?: string) {
  const activeFilters = filters.filter(([, value]) => value !== undefined);
  const prefix = tableAlias ? `${tableAlias}.` : "";
  const where =
    activeFilters.length === 0
      ? ""
      : `WHERE ${activeFilters
          .map(([column], index) => `${prefix}${column} = $${startIndex + index}`)
          .join(" AND ")}`;

  return {
    where,
    values: activeFilters.map(([, value]) => value),
  };
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

function mapEvidenceFragment(row: Record<string, unknown>): EvidenceFragmentRecord {
  return {
    ...row,
    id: toNullableNumber(row.id),
    source_document_id: Number(row.source_document_id),
    tags_json: toStringArray(row.tags_json),
    trial_program: toNullableString(row.trial_program),
    intervention_class: toNullableString(row.intervention_class),
    chunk_ids: toNumberArray(row.chunk_ids),
    created_at: toNullableString(row.created_at),
  } as EvidenceFragmentRecord;
}

function mapClaim(row: Record<string, unknown>): ClaimRecord {
  return {
    ...row,
    id: toNullableNumber(row.id),
    trial_program: toNullableString(row.trial_program),
    fragment_ids: toStringArray(row.fragment_ids),
    created_at: toNullableString(row.created_at),
  } as ClaimRecord;
}

function mapExtractedDatapoint(row: Record<string, unknown>): ExtractedDatapointRecord {
  return {
    ...row,
    id: toNullableNumber(row.id),
    extraction_run_id: Number(row.extraction_run_id),
    source_document_id: Number(row.source_document_id),
    value_json: (row.value_json ?? {}) as Record<string, unknown>,
    chunk_ids: toNumberArray(row.chunk_ids),
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

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toNumberArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (item === null || item === undefined ? null : Number(item)))
    .filter((item): item is number => item !== null && !Number.isNaN(item));
}
