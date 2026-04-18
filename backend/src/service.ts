import type {
  GetCaseResponse,
  GetFragmentsResponse,
  GetReportResponse,
  GetTrajectoryResponse,
  PostClaimsResponse,
} from "../../shared/api.js";
import type {
  CaseBundle,
  CaseRecord,
  Claim,
  EvidenceFragment,
  SignalDomain,
  SourceType,
  TrajectoryPoint,
} from "../../shared/types.js";

import type { ProjectionRepository, ProjectionRow } from "./projection-repository.js";

const domainKeywords: Record<SignalDomain, string[]> = {
  vocabulary: ["verbal", "speech", "language", "word", "vocabulary", "naming"],
  recognition: ["recognition", "memory", "family", "voice", "identity", "familiar"],
  sleep: ["sleep", "night", "bedtime", "waking", "rest"],
  behavior: ["behavior", "social", "daily life", "active", "routine", "milestones"],
  motor: ["motor", "walking", "drive", "coordination", "move"],
};

const defaultDataHandling =
  "Projected from ingestion-layer extracted datapoints. Review support only; not a diagnosis, treatment recommendation, or approval recommendation.";

export class EvidenceService {
  constructor(private readonly repository: ProjectionRepository) {}

  async getCaseResponse(caseId: string): Promise<GetCaseResponse | null> {
    const bundle = await this.getCaseBundle(caseId);

    if (!bundle) {
      return null;
    }

    return {
      caseRecord: bundle.caseRecord,
      metrics: {
        fragmentCount: bundle.fragments.length,
        claimCount: bundle.claims.length,
        sourceTypes: Array.from(new Set(bundle.fragments.map((fragment) => fragment.sourceType))),
      },
    };
  }

  async getFragmentsResponse(
    caseId: string,
    domain?: SignalDomain,
    year?: string,
    query?: string,
  ): Promise<GetFragmentsResponse | null> {
    const bundle = await this.getCaseBundle(caseId);

    if (!bundle) {
      return null;
    }

    const normalizedQuery = query?.toLowerCase().trim();

    return {
      fragments: bundle.fragments
        .filter((fragment) => !domain || fragment.signalDomain === domain || fragment.tags.includes(domain))
        .filter((fragment) => !year || fragment.date.startsWith(year))
        .map((fragment) => ({
          fragment,
          score: scoreFragment(fragment, domain, normalizedQuery),
        }))
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }

          return a.fragment.date.localeCompare(b.fragment.date);
        })
        .map(({ fragment }) => fragment),
    };
  }

  async getClaimsResponse(caseId: string, domain?: SignalDomain): Promise<PostClaimsResponse | null> {
    const bundle = await this.getCaseBundle(caseId);

    if (!bundle) {
      return null;
    }

    return {
      claims: !domain ? bundle.claims : bundle.claims.filter((claim) => claim.domain === domain),
    };
  }

  async getReportResponse(caseId: string): Promise<GetReportResponse | null> {
    const bundle = await this.getCaseBundle(caseId);

    if (!bundle) {
      return null;
    }

    return {
      ...bundle.caseRecord,
      metrics: {
        fragmentCount: bundle.fragments.length,
        claimCount: bundle.claims.length,
        modalities: Array.from(new Set(bundle.fragments.map((fragment) => fragment.sourceType))).length,
        domains: Array.from(new Set(bundle.fragments.map((fragment) => fragment.signalDomain))).length,
      },
      claims: bundle.claims.map((claim) => ({
        ...claim,
        citations: resolveClaimCitations(claim, bundle.fragments),
      })),
    };
  }

  async getTrajectoryResponse(caseId: string): Promise<GetTrajectoryResponse | null> {
    const bundle = await this.getCaseBundle(caseId);

    if (!bundle) {
      return null;
    }

    const trajectoryPoints = buildTrajectory(bundle.fragments);

    if (trajectoryPoints.length === 0) {
      return null;
    }

    const baseline = trajectoryPoints[0];
    const latest = trajectoryPoints[trajectoryPoints.length - 1];
    const retentionDelta = Math.round(
      ((latest.treatedScore - latest.naturalScore) / Math.max(baseline.treatedScore, 1)) * 100,
    );

    return {
      trajectoryPoints,
      kpis: {
        retentionDelta,
        retentionDeltaDisplay: `${retentionDelta >= 0 ? "+" : ""}${retentionDelta}%`,
        pValue: "Projected from extracted datapoints",
        pLabel: "Inference from ingestion evidence",
        observationMonths: monthDifference(bundle.caseRecord.observationStart, bundle.caseRecord.observationEnd),
      },
    };
  }

  async getCaseBundle(caseId: string): Promise<CaseBundle | null> {
    const subjectLabel = await this.repository.resolveSubjectLabel(caseId);

    if (!subjectLabel) {
      return null;
    }

    const rows = await this.repository.listCaseProjectionRows(subjectLabel);

    if (rows.length === 0) {
      return null;
    }

    const fragments = rows
      .map((row) => mapFragment(row, caseId))
      .sort((a, b) => a.date.localeCompare(b.date));

    const claims = rows
      .filter((row) => row.datapoint_type === "outcome_claim" || row.datapoint_type === "functional_signal")
      .map((row) => mapClaim(row, caseId))
      .sort((a, b) => a.id.localeCompare(b.id));

    const disease = deriveDisease(rows);
    const therapy = deriveTherapy(rows);

    return {
      caseRecord: {
        id: caseId,
        label: subjectLabel,
        disease,
        therapy,
        observationStart: fragments[0]?.date ?? new Date().toISOString(),
        observationEnd: fragments[fragments.length - 1]?.date ?? new Date().toISOString(),
        summary: buildSummary(subjectLabel, rows, claims.length),
        dataHandling: defaultDataHandling,
        reviewWindow: buildReviewWindow(rows),
      },
      fragments,
      claims,
    };
  }
}

function resolveClaimCitations(claim: Claim, fragments: EvidenceFragment[]) {
  return fragments.filter((fragment) => claim.fragmentIds.includes(fragment.id));
}

function mapFragment(row: ProjectionRow, caseId: string): EvidenceFragment {
  const signalDomain = inferSignalDomain(row);
  const title = buildFragmentTitle(row);
  const date = deriveDate(row);

  return {
    id: `ED-${row.datapoint_id}`,
    caseId,
    date,
    sourceType: normalizeSourceType(row.seed_source_type, row.platform),
    modality: normalizeModality(row.content_type),
    title,
    excerpt: row.evidence_quote,
    tags: buildFragmentTags(row, signalDomain),
    signalDomain,
    deidentified: true,
    confidence: row.confidence === "medium" || row.confidence === "moderate" ? "moderate" : "high",
    rawRef: `${row.seed_id} / doc:${row.source_document_id}${row.chunk_index !== null ? ` / chunk:${row.chunk_index}` : ""}`,
  };
}

function mapClaim(row: ProjectionRow, caseId: string): Claim {
  return {
    id: `CLM-${row.datapoint_id}`,
    caseId,
    statement: extractClaimStatement(row),
    domain: inferSignalDomain(row),
    trend: inferTrend(row),
    confidence: row.confidence === "medium" || row.confidence === "moderate" ? "moderate" : "high",
    fragmentIds: [`ED-${row.datapoint_id}`],
  };
}

function buildTrajectory(fragments: EvidenceFragment[]): TrajectoryPoint[] {
  const candidates = fragments
    .filter((fragment) => fragment.signalDomain !== "behavior" || fragment.confidence === "high")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 12);

  if (candidates.length === 0) {
    return [];
  }

  const naturalStart = 72;
  let treated = 70;

  return candidates.map((fragment, index) => {
    treated = clamp(treated + directionWeight(fragment), 25, 92);
    const naturalScore = clamp(naturalStart - index * 4, 20, naturalStart);

    return {
      fragmentId: fragment.id,
      date: fragment.date,
      treatedScore: treated,
      naturalScore,
    };
  });
}

function buildSummary(subjectLabel: string, rows: ProjectionRow[], claimCount: number) {
  const functionalCount = rows.filter((row) => row.datapoint_type === "functional_signal").length;
  const trialCount = rows.filter((row) => row.datapoint_type === "trial_participation").length;

  return `${subjectLabel} is projected from ${rows.length} extracted datapoints across ${rows.length > 0 ? new Set(rows.map((row) => row.source_document_id)).size : 0} source documents, including ${functionalCount} functional signals and ${claimCount} synthesized claims.${trialCount > 0 ? " Trial participation evidence is present." : ""}`;
}

function buildReviewWindow(rows: ProjectionRow[]) {
  const dates = rows
    .map((row) => deriveDate(row))
    .sort((a, b) => a.localeCompare(b));

  if (dates.length === 0) {
    return "No observation window available.";
  }

  return `Projected from evidence spanning ${dates[0]} through ${dates[dates.length - 1]}.`;
}

function buildFragmentTitle(row: ProjectionRow) {
  const value = row.value_json;

  switch (row.datapoint_type) {
    case "functional_signal":
      return humanize(readString(value, "signal") ?? "Functional signal");
    case "outcome_claim":
      return humanize(readString(value, "claim") ?? "Outcome claim");
    case "temporal_marker":
      return humanize(readString(value, "marker") ?? "Temporal marker");
    case "trial_participation":
      return "Trial participation evidence";
    case "disease_subtype":
      return humanize(readString(value, "subtype") ?? "Disease subtype");
    case "caregiver_role":
      return humanize(readString(value, "relation") ?? "Caregiver role");
    case "child_identity":
      return humanize(readString(value, "display_name") ?? "Child identity");
    default:
      return humanize(row.datapoint_type.replaceAll("_", " "));
  }
}

function buildFragmentTags(row: ProjectionRow, signalDomain: SignalDomain) {
  const tags = new Set<string>([row.datapoint_type, signalDomain]);
  const value = row.value_json;

  for (const key of ["kind", "direction", "relation", "marker_type", "participation_status"]) {
    const item = readString(value, key);
    if (item) {
      tags.add(item.toLowerCase());
    }
  }

  const subtype = readString(value, "subtype");
  if (subtype) {
    tags.add(subtype.toLowerCase());
  }

  return Array.from(tags);
}

function deriveDisease(rows: ProjectionRow[]) {
  for (const row of rows) {
    const fromValue = readString(row.value_json, "subtype");
    if (fromValue) {
      return fromValue;
    }
    if (row.disease_subtype) {
      return row.disease_subtype;
    }
  }

  return "Sanfilippo Syndrome";
}

function deriveTherapy(rows: ProjectionRow[]) {
  const trialProgram = rows.find((row) => row.trial_program)?.trial_program;
  if (trialProgram) {
    return `${trialProgram} evidence projection`;
  }

  if (rows.some((row) => row.datapoint_type === "trial_participation")) {
    return "Trial participation evidence";
  }

  return "Public narrative evidence";
}

function inferSignalDomain(row: ProjectionRow): SignalDomain {
  const haystack = `${row.evidence_quote} ${readString(row.value_json, "signal") ?? ""} ${readString(row.value_json, "claim") ?? ""}`.toLowerCase();

  for (const [domain, keywords] of Object.entries(domainKeywords) as Array<[SignalDomain, string[]]>) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return domain;
    }
  }

  switch (row.datapoint_type) {
    case "trial_participation":
    case "caregiver_role":
      return "behavior";
    case "temporal_marker":
      return "recognition";
    default:
      return "behavior";
  }
}

function inferTrend(row: ProjectionRow): Claim["trend"] {
  const direction = readString(row.value_json, "direction")?.toLowerCase();

  if (direction === "worsened") {
    return "declining";
  }

  if (direction === "present") {
    return "stable";
  }

  if (direction === "mixed") {
    return "mixed";
  }

  return "stable";
}

function extractClaimStatement(row: ProjectionRow) {
  return readString(row.value_json, "claim") ?? readString(row.value_json, "signal") ?? row.evidence_quote;
}

function deriveDate(row: ProjectionRow) {
  const temporal = readString(row.value_json, "marker");
  const markerType = readString(row.value_json, "marker_type");

  if (row.datapoint_type === "temporal_marker" && markerType === "date" && temporal) {
    const parsed = Date.parse(temporal);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  return row.fetched_at ?? new Date().toISOString();
}

function directionWeight(fragment: EvidenceFragment) {
  const tagString = fragment.tags.join(" ").toLowerCase();

  if (tagString.includes("worsened")) {
    return -5;
  }
  if (tagString.includes("mixed")) {
    return -2;
  }
  if (tagString.includes("present") || fragment.confidence === "high") {
    return 1;
  }
  return 0;
}

function scoreFragment(fragment: EvidenceFragment, domain?: SignalDomain, normalizedQuery?: string) {
  let score = 0;

  if (domain && (fragment.signalDomain === domain || fragment.tags.includes(domain))) {
    score += 5;
  }

  if (normalizedQuery) {
    const queryTerms = normalizedQuery.split(/\s+/);
    const haystack = `${fragment.title} ${fragment.excerpt} ${fragment.tags.join(" ")}`.toLowerCase();
    const termMatches = queryTerms.filter((term) => haystack.includes(term)).length;
    score += termMatches * 2;
  }

  const keywordBonus = domain
    ? domainKeywords[domain].filter((keyword) => {
        const haystack = `${fragment.excerpt} ${fragment.tags.join(" ")}`.toLowerCase();
        return haystack.includes(keyword);
      }).length
    : 0;

  score += keywordBonus;
  score += fragment.confidence === "high" ? 1 : 0;

  return score;
}

function normalizeSourceType(seedSourceType: string, platform: string): SourceType {
  const source = `${seedSourceType} ${platform}`.toLowerCase();

  if (source.includes("voice") || source.includes("audio")) {
    return "Voice Memo";
  }
  if (source.includes("clinic") || source.includes("hospital")) {
    return "Clinic Summary";
  }
  if (source.includes("transcript")) {
    return "Caregiver Transcript";
  }
  if (source.includes("journal")) {
    return "Parent Journal";
  }
  return "Forum Observation";
}

function normalizeModality(contentType: string | null): EvidenceFragment["modality"] {
  const value = contentType?.toLowerCase() ?? "";
  if (value.includes("audio")) {
    return "audio-transcript";
  }
  if (value.includes("pdf") || value.includes("html")) {
    return "summary";
  }
  return "text";
}

function readString(value: Record<string, unknown>, key: string) {
  const result = value[key];
  return typeof result === "string" ? result : undefined;
}

function humanize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function monthDifference(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return Math.max(
    1,
    (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
      (endDate.getUTCMonth() - startDate.getUTCMonth()),
  );
}
