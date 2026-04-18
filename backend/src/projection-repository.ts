import type { Pool } from "pg";

export type CaseCandidate = {
  case_id: string;
  label: string;
  disease_subtype: string | null;
  trial_program: string | null;
  treatment_status: string | null;
};

export type FragmentRow = {
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
  treatment_status: string | null;
  trial_program: string | null;
  document_title: string | null;
  source_url: string;
  fetched_at: string | null;
  seed_id: string;
  seed_label: string;
  disease_subtype: string | null;
};

export type ClaimRow = {
  external_id: string;
  case_id: string;
  statement: string;
  signal_domain: string;
  trend: string;
  confidence: string;
  treatment_status: string | null;
  trial_program: string | null;
  fragment_ids: string[];
};

/** SQL read-model for the product-facing evidence explorer and report surfaces. */
export class ProjectionRepository {
  constructor(private readonly pool: Pool) {}

  async listCaseCandidates(): Promise<CaseCandidate[]> {
    const result = await this.pool.query(
      `
        SELECT
          ef.case_id,
          MIN(ss.label) AS label,
          NULLIF(MIN(COALESCE(ss.disease_subtype, '')), '') AS disease_subtype,
          NULLIF(MIN(COALESCE(ef.trial_program, ss.trial_program, '')), '') AS trial_program,
          NULLIF(MIN(COALESCE(ef.treatment_status, '')), '') AS treatment_status
        FROM ingestion.evidence_fragments ef
        INNER JOIN ingestion.source_documents sd ON sd.id = ef.source_document_id
        INNER JOIN ingestion.seed_sources ss ON ss.id = sd.seed_source_id
        GROUP BY ef.case_id
        ORDER BY ef.case_id ASC
      `,
    );

    return result.rows.map((row: unknown) => mapCaseCandidate(row as Record<string, unknown>));
  }

  async listCaseFragments(caseId: string): Promise<FragmentRow[]> {
    const result = await this.pool.query(
      `
        SELECT
          ef.external_id,
          ef.case_id,
          ef.source_document_id,
          ef.fragment_date,
          ef.source_type,
          ef.modality,
          ef.title,
          ef.excerpt,
          ef.tags_json,
          ef.signal_domain,
          ef.confidence,
          ef.raw_ref,
          ef.treatment_status,
          COALESCE(ef.trial_program, ss.trial_program) AS trial_program,
          sd.title AS document_title,
          sd.source_url,
          sd.fetched_at,
          ss.seed_id,
          ss.label AS seed_label,
          NULLIF(ss.disease_subtype, '') AS disease_subtype
        FROM ingestion.evidence_fragments ef
        INNER JOIN ingestion.source_documents sd ON sd.id = ef.source_document_id
        INNER JOIN ingestion.seed_sources ss ON ss.id = sd.seed_source_id
        WHERE ef.case_id = $1
        ORDER BY ef.fragment_date ASC, ef.external_id ASC
      `,
      [caseId],
    );

    return result.rows.map((row: unknown) => mapFragmentRow(row as Record<string, unknown>));
  }

  async listAllFragments(): Promise<FragmentRow[]> {
    const result = await this.pool.query(
      `
        SELECT
          ef.external_id,
          ef.case_id,
          ef.source_document_id,
          ef.fragment_date,
          ef.source_type,
          ef.modality,
          ef.title,
          ef.excerpt,
          ef.tags_json,
          ef.signal_domain,
          ef.confidence,
          ef.raw_ref,
          ef.treatment_status,
          COALESCE(ef.trial_program, ss.trial_program) AS trial_program,
          sd.title AS document_title,
          sd.source_url,
          sd.fetched_at,
          ss.seed_id,
          ss.label AS seed_label,
          NULLIF(ss.disease_subtype, '') AS disease_subtype
        FROM ingestion.evidence_fragments ef
        INNER JOIN ingestion.source_documents sd ON sd.id = ef.source_document_id
        INNER JOIN ingestion.seed_sources ss ON ss.id = sd.seed_source_id
        ORDER BY ef.fragment_date ASC, ef.external_id ASC
      `,
    );

    return result.rows.map((row: unknown) => mapFragmentRow(row as Record<string, unknown>));
  }

  async listCaseClaims(caseId: string): Promise<ClaimRow[]> {
    const result = await this.pool.query(
      `
        SELECT
          c.external_id,
          c.case_id,
          c.statement,
          c.signal_domain,
          c.trend,
          c.confidence,
          c.treatment_status,
          c.trial_program,
          COALESCE(
            array_agg(cf.fragment_external_id ORDER BY cf.fragment_order)
              FILTER (WHERE cf.fragment_external_id IS NOT NULL),
            ARRAY[]::text[]
          ) AS fragment_ids
        FROM ingestion.claims c
        LEFT JOIN ingestion.claim_fragments cf ON cf.claim_id = c.id
        WHERE c.case_id = $1
        GROUP BY c.id
        ORDER BY c.external_id ASC
      `,
      [caseId],
    );

    return result.rows.map((row: unknown) => mapClaimRow(row as Record<string, unknown>));
  }

  async listAllClaims(): Promise<ClaimRow[]> {
    const result = await this.pool.query(
      `
        SELECT
          c.external_id,
          c.case_id,
          c.statement,
          c.signal_domain,
          c.trend,
          c.confidence,
          c.treatment_status,
          c.trial_program,
          COALESCE(
            array_agg(cf.fragment_external_id ORDER BY cf.fragment_order)
              FILTER (WHERE cf.fragment_external_id IS NOT NULL),
            ARRAY[]::text[]
          ) AS fragment_ids
        FROM ingestion.claims c
        LEFT JOIN ingestion.claim_fragments cf ON cf.claim_id = c.id
        GROUP BY c.id
        ORDER BY c.external_id ASC
      `,
    );

    return result.rows.map((row: unknown) => mapClaimRow(row as Record<string, unknown>));
  }
}

function mapCaseCandidate(record: Record<string, unknown>): CaseCandidate {
  return {
    case_id: String(record.case_id),
    label: String(record.label),
    disease_subtype: toNullableString(record.disease_subtype),
    trial_program: toNullableString(record.trial_program),
    treatment_status: toNullableString(record.treatment_status),
  };
}

function mapFragmentRow(record: Record<string, unknown>): FragmentRow {
  return {
    external_id: String(record.external_id),
    case_id: String(record.case_id),
    source_document_id: Number(record.source_document_id),
    fragment_date: String(record.fragment_date),
    source_type: String(record.source_type),
    modality: String(record.modality),
    title: String(record.title),
    excerpt: String(record.excerpt),
    tags_json: toStringArray(record.tags_json),
    signal_domain: String(record.signal_domain),
    confidence: String(record.confidence),
    raw_ref: String(record.raw_ref),
    treatment_status: toNullableString(record.treatment_status),
    trial_program: toNullableString(record.trial_program),
    document_title: toNullableString(record.document_title),
    source_url: String(record.source_url),
    fetched_at: record.fetched_at ? new Date(String(record.fetched_at)).toISOString() : null,
    seed_id: String(record.seed_id),
    seed_label: String(record.seed_label),
    disease_subtype: toNullableString(record.disease_subtype),
  };
}

function mapClaimRow(record: Record<string, unknown>): ClaimRow {
  return {
    external_id: String(record.external_id),
    case_id: String(record.case_id),
    statement: String(record.statement),
    signal_domain: String(record.signal_domain),
    trend: String(record.trend),
    confidence: String(record.confidence),
    treatment_status: toNullableString(record.treatment_status),
    trial_program: toNullableString(record.trial_program),
    fragment_ids: toStringArray(record.fragment_ids),
  };
}

function toNullableString(value: unknown) {
  return value === null || value === undefined || value === "" ? null : String(value);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}
