import type { Pool } from "pg";

export type ProjectionRow = {
  datapoint_id: number;
  extraction_run_id: number;
  source_document_id: number;
  chunk_id: number | null;
  datapoint_type: string;
  subject_label: string | null;
  disease_subtype: string | null;
  trial_program: string | null;
  value_json: Record<string, unknown>;
  confidence: string;
  evidence_quote: string;
  char_start: number | null;
  char_end: number | null;
  chunk_text: string | null;
  chunk_index: number | null;
  document_title: string | null;
  source_url: string;
  content_type: string | null;
  fetched_at: string | null;
  seed_id: string;
  seed_label: string;
  seed_source_type: string;
  platform: string;
};

type SubjectCandidate = {
  subject_label: string;
  datapoint_count: number;
  functional_count: number;
  claim_count: number;
  trial_count: number;
};

export class ProjectionRepository {
  constructor(private readonly pool: Pool) {}

  async resolveSubjectLabel(caseId: string): Promise<string | null> {
    const candidates = await this.listSubjectCandidates();

    if (candidates.length === 0) {
      return null;
    }

    if (caseId === "demo-child-a") {
      return candidates[0].subject_label;
    }

    const exact = candidates.find((candidate) => slugify(candidate.subject_label) === caseId);
    return exact?.subject_label ?? null;
  }

  async listCaseProjectionRows(subjectLabel: string): Promise<ProjectionRow[]> {
    const result = await this.pool.query(
      `
        SELECT
          ed.id AS datapoint_id,
          ed.extraction_run_id,
          ed.source_document_id,
          ed.chunk_id,
          ed.datapoint_type,
          ed.subject_label,
          ed.disease_subtype,
          ed.trial_program,
          ed.value_json,
          ed.confidence,
          ed.evidence_quote,
          ed.char_start,
          ed.char_end,
          dc.chunk_text,
          dc.chunk_index,
          sd.title AS document_title,
          sd.source_url,
          sd.content_type,
          sd.fetched_at,
          ss.seed_id,
          ss.label AS seed_label,
          ss.source_type AS seed_source_type,
          ss.platform
        FROM ingestion.extracted_datapoints ed
        INNER JOIN ingestion.source_documents sd ON sd.id = ed.source_document_id
        INNER JOIN ingestion.seed_sources ss ON ss.id = sd.seed_source_id
        LEFT JOIN ingestion.document_chunks dc ON dc.id = ed.chunk_id
        WHERE ed.subject_label = $1
        ORDER BY COALESCE(sd.fetched_at, ed.created_at) ASC, ed.id ASC
      `,
      [subjectLabel],
    );

    return result.rows.map((row: unknown) => mapProjectionRow(row as Record<string, unknown>));
  }

  private async listSubjectCandidates(): Promise<SubjectCandidate[]> {
    const result = await this.pool.query(
      `
        SELECT
          ed.subject_label,
          COUNT(*) AS datapoint_count,
          COUNT(*) FILTER (WHERE ed.datapoint_type = 'functional_signal') AS functional_count,
          COUNT(*) FILTER (WHERE ed.datapoint_type = 'outcome_claim') AS claim_count,
          COUNT(*) FILTER (WHERE ed.datapoint_type = 'trial_participation') AS trial_count
        FROM ingestion.extracted_datapoints ed
        WHERE ed.subject_label IS NOT NULL
          AND btrim(ed.subject_label) <> ''
        GROUP BY ed.subject_label
        ORDER BY
          COUNT(*) FILTER (WHERE ed.datapoint_type = 'trial_participation') DESC,
          COUNT(*) FILTER (WHERE ed.datapoint_type = 'functional_signal') DESC,
          COUNT(*) FILTER (WHERE ed.datapoint_type = 'outcome_claim') DESC,
          COUNT(*) DESC,
          ed.subject_label ASC
      `,
    );

    return result.rows.map((row: unknown) => {
      const record = row as Record<string, unknown>;
      return {
        subject_label: String(record.subject_label),
        datapoint_count: Number(record.datapoint_count),
        functional_count: Number(record.functional_count),
        claim_count: Number(record.claim_count),
        trial_count: Number(record.trial_count),
      };
    });
  }
}

function mapProjectionRow(record: Record<string, unknown>): ProjectionRow {
  return {
    datapoint_id: Number(record.datapoint_id),
    extraction_run_id: Number(record.extraction_run_id),
    source_document_id: Number(record.source_document_id),
    chunk_id: record.chunk_id === null ? null : Number(record.chunk_id),
    datapoint_type: String(record.datapoint_type),
    subject_label: record.subject_label ? String(record.subject_label) : null,
    disease_subtype: record.disease_subtype ? String(record.disease_subtype) : null,
    trial_program: record.trial_program ? String(record.trial_program) : null,
    value_json: (record.value_json ?? {}) as Record<string, unknown>,
    confidence: String(record.confidence),
    evidence_quote: String(record.evidence_quote),
    char_start: record.char_start === null ? null : Number(record.char_start),
    char_end: record.char_end === null ? null : Number(record.char_end),
    chunk_text: record.chunk_text ? String(record.chunk_text) : null,
    chunk_index: record.chunk_index === null ? null : Number(record.chunk_index),
    document_title: record.document_title ? String(record.document_title) : null,
    source_url: String(record.source_url),
    content_type: record.content_type ? String(record.content_type) : null,
    fetched_at: record.fetched_at ? new Date(String(record.fetched_at)).toISOString() : null,
    seed_id: String(record.seed_id),
    seed_label: String(record.seed_label),
    seed_source_type: String(record.seed_source_type),
    platform: String(record.platform),
  };
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
