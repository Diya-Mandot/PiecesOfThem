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
  ClaimProvenance,
  EvidenceFragment,
  EvidenceProvenance,
  ReportReadiness,
  SignalDomain,
  SourceType,
  TrajectoryPoint,
} from "../../shared/types.js";

import type { CaseCandidate, ClaimRow, FragmentRow, ProjectionRepository } from "./projection-repository.js";

const domainKeywords: Record<SignalDomain, string[]> = {
  vocabulary: ["verbal", "speech", "language", "word", "vocabulary", "naming", "alphabet", "song"],
  recognition: ["recognition", "memory", "family", "voice", "identity", "familiar", "name"],
  sleep: ["sleep", "night", "bedtime", "waking", "rest"],
  behavior: ["behavior", "social", "daily life", "active", "routine", "milestones"],
  motor: ["motor", "walking", "drive", "coordination", "move", "seizure"],
};

const defaultDataHandling =
  "Projected from canonical evidence fragments and claims in the ingestion layer. Review support only; not a diagnosis, treatment recommendation, or approval recommendation.";
const aggregateEvidenceId = "all-evidence";
const aggregateEvidenceLabel = "All Evidence Findings";

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
        modalities: Array.from(new Set(bundle.fragments.map((fragment) => fragment.modality))).length,
        domains: Array.from(new Set(bundle.fragments.map((fragment) => fragment.signalDomain))).length,
        realFragments: bundle.fragments.filter((fragment) => fragment.provenance === "real").length,
        syntheticFragments: bundle.fragments.filter((fragment) => fragment.provenance === "synthetic").length,
        mixedClaims: bundle.claims.filter((claim) => claim.provenance === "mixed").length,
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
        pValue: "Projected from evidence fragments",
        pLabel: "Inference from canonical evidence",
        observationMonths: monthDifference(bundle.caseRecord.observationStart, bundle.caseRecord.observationEnd),
      },
    };
  }

  async getCaseBundle(caseId: string): Promise<CaseBundle | null> {
    if (caseId === aggregateEvidenceId) {
      return this.getAggregateBundle();
    }

    const candidate = await this.resolveCaseCandidate(caseId);

    if (!candidate) {
      return null;
    }

    const [fragmentRows, claimRows] = await Promise.all([
      this.repository.listCaseFragments(candidate.case_id),
      this.repository.listCaseClaims(candidate.case_id),
    ]);

    if (fragmentRows.length === 0) {
      return null;
    }

    const fragments = fragmentRows.map((row) => mapFragment(row)).sort((a, b) => a.date.localeCompare(b.date));
    const claims = claimRows.map((row) => mapClaim(row));

    return {
      caseRecord: buildCaseRecord(candidate, fragmentRows, fragments, claims),
      fragments,
      claims,
    };
  }

  private async resolveCaseCandidate(caseId: string): Promise<CaseCandidate | null> {
    const candidates = await this.repository.listCaseCandidates();

    if (candidates.length === 0) {
      return null;
    }

    // Preserve the stable frontend demo route by resolving it to the first
    // available projected case when a real demo-specific case id is absent.
    if (caseId === "demo-child-a") {
      return candidates[0];
    }

    const exactCase = candidates.find((candidate) => candidate.case_id === caseId);
    if (exactCase) {
      return exactCase;
    }

    const slugMatch = candidates.find((candidate) => slugify(candidate.label) === caseId);
    return slugMatch ?? null;
  }

  private async getAggregateBundle(): Promise<CaseBundle | null> {
    const [fragmentRows, claimRows] = await Promise.all([
      this.repository.listAllFragments(),
      this.repository.listAllClaims(),
    ]);

    if (fragmentRows.length === 0) {
      return null;
    }

    const fragments = fragmentRows.map((row) => mapFragment(row)).sort((a, b) => a.date.localeCompare(b.date));
    const claims = claimRows.map((row) => mapClaim(row));

    return {
      caseRecord: buildAggregateRecord(fragmentRows, fragments, claims),
      fragments,
      claims,
    };
  }
}

function buildCaseRecord(
  candidate: CaseCandidate,
  fragmentRows: FragmentRow[],
  fragments: EvidenceFragment[],
  claims: Claim[],
): CaseRecord {
  const observationStart = fragments[0]?.date ?? new Date().toISOString();
  const observationEnd = fragments[fragments.length - 1]?.date ?? new Date().toISOString();
  const sourceDocumentCount = new Set(fragmentRows.map((row) => row.source_document_id)).size;
  const realFragments = fragments.filter((fragment) => fragment.provenance === "real").length;
  const syntheticFragments = fragments.length - realFragments;
  const mixedClaims = claims.filter((claim) => claim.provenance === "mixed").length;
  const reportReadiness = deriveReportReadiness(fragments, claims);

  return {
    id: candidate.case_id,
    label: candidate.label,
    disease: deriveDisease(candidate, fragmentRows),
    therapy: deriveTherapy(candidate),
    observationStart,
    observationEnd,
    summary: `${candidate.label} is projected from ${fragments.length} evidence fragments across ${sourceDocumentCount} source document${sourceDocumentCount === 1 ? "" : "s"} and ${claims.length} synthesized claim${claims.length === 1 ? "" : "s"}.`,
    dataHandling: defaultDataHandling,
    reviewWindow: `Projected from evidence spanning ${observationStart} through ${observationEnd}.`,
    provenanceSummary: `${realFragments} real fragment${realFragments === 1 ? "" : "s"}, ${syntheticFragments} synthetic fragment${syntheticFragments === 1 ? "" : "s"}, ${mixedClaims} mixed claim${mixedClaims === 1 ? "" : "s"}.`,
    reportReadiness,
  };
}

function resolveClaimCitations(claim: Claim, fragments: EvidenceFragment[]) {
  return fragments.filter((fragment) => claim.fragmentIds.includes(fragment.id));
}

function buildAggregateRecord(
  fragmentRows: FragmentRow[],
  fragments: EvidenceFragment[],
  claims: Claim[],
): CaseRecord {
  const observationStart = fragments[0]?.date ?? new Date().toISOString();
  const observationEnd = fragments[fragments.length - 1]?.date ?? new Date().toISOString();
  const sourceDocumentCount = new Set(fragmentRows.map((row) => row.source_document_id)).size;
  const sourceNarrativeCount = new Set(fragmentRows.map((row) => row.seed_id)).size;
  const reportReadiness = deriveReportReadiness(fragments, claims);

  return {
    id: aggregateEvidenceId,
    label: aggregateEvidenceLabel,
    disease: "Sanfilippo Syndrome evidence archive",
    therapy: "Cross-source evidence bundle",
    observationStart,
    observationEnd,
    summary: `This archive bundles ${fragments.length} evidence findings across ${sourceNarrativeCount} source narratives, ${sourceDocumentCount} source documents, and ${claims.length} synthesized claims.`,
    dataHandling: defaultDataHandling,
    reviewWindow: `Aggregate evidence spanning ${observationStart} through ${observationEnd}. Source details are preserved on each citation.`,
    provenanceSummary: `${fragments.length} real fragments, 0 synthetic fragments, ${claims.filter((claim) => claim.provenance === "mixed").length} mixed claims.`,
    reportReadiness,
  };
}

function mapFragment(row: FragmentRow): EvidenceFragment {
  return {
    id: row.external_id,
    caseId: row.case_id,
    date: row.fragment_date,
    sourceType: normalizeSourceType(row.source_type),
    modality: normalizeModality(row.modality),
    title: row.title,
    excerpt: row.excerpt,
    tags: row.tags_json,
    signalDomain: normalizeSignalDomain(row.signal_domain),
    deidentified: true,
    confidence: normalizeConfidence(row.confidence),
    rawRef: row.raw_ref,
    provenance: "real",
    sourceLabel: row.seed_label,
    sourceUrl: row.source_url,
    documentTitle: row.document_title ?? undefined,
  };
}

function mapClaim(row: ClaimRow): Claim {
  return {
    id: row.external_id,
    caseId: row.case_id,
    statement: row.statement,
    domain: normalizeSignalDomain(row.signal_domain),
    trend: normalizeTrend(row.trend),
    confidence: normalizeConfidence(row.confidence),
    fragmentIds: row.fragment_ids,
    provenance: "real",
  };
}

function deriveReportReadiness(
  fragments: EvidenceFragment[],
  claims: Claim[],
): ReportReadiness {
  const fragmentProvenance = new Set<EvidenceProvenance>(fragments.map((fragment) => fragment.provenance));
  const claimProvenance = new Set<ClaimProvenance>(claims.map((claim) => claim.provenance));

  if (fragmentProvenance.size === 1 && fragmentProvenance.has("real") && !claimProvenance.has("mixed")) {
    return "review-ready";
  }

  if (fragmentProvenance.has("synthetic")) {
    return fragmentProvenance.has("real") ? "internal-review" : "demo-only";
  }

  return "internal-review";
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

function deriveDisease(candidate: CaseCandidate, fragmentRows: FragmentRow[]) {
  const subtype = candidate.disease_subtype ?? fragmentRows.find((row) => row.disease_subtype)?.disease_subtype;

  if (!subtype || subtype.toLowerCase() === "unknown") {
    return "Sanfilippo Syndrome";
  }

  return subtype.toLowerCase().includes("sanfilippo") ? subtype : `Sanfilippo Syndrome ${subtype}`;
}

function deriveTherapy(candidate: CaseCandidate) {
  if (candidate.trial_program) {
    return `${candidate.trial_program} evidence brief`;
  }

  if (candidate.treatment_status === "treated") {
    return "Treated observational evidence";
  }

  if (candidate.treatment_status === "untreated") {
    return "Untreated observational evidence";
  }

  return "Public narrative evidence";
}

function directionWeight(fragment: EvidenceFragment) {
  const tagString = fragment.tags.join(" ").toLowerCase();
  const excerpt = fragment.excerpt.toLowerCase();
  const haystack = `${tagString} ${excerpt}`;

  if (
    haystack.includes("worsened") ||
    haystack.includes("declin") ||
    haystack.includes("lost the ability") ||
    haystack.includes("loss")
  ) {
    return -5;
  }
  if (haystack.includes("mixed")) {
    return -2;
  }
  if (
    haystack.includes("stable") ||
    haystack.includes("retained") ||
    haystack.includes("preserved") ||
    fragment.confidence === "high"
  ) {
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

function normalizeSourceType(value: string): SourceType {
  switch (value) {
    case "Parent Journal":
    case "Caregiver Transcript":
    case "Clinic Summary":
    case "Forum Observation":
    case "Voice Memo":
      return value;
    default:
      return "Forum Observation";
  }
}

function normalizeModality(value: string): EvidenceFragment["modality"] {
  if (value === "audio-transcript" || value === "summary" || value === "text") {
    return value;
  }

  return "text";
}

function normalizeSignalDomain(value: string): SignalDomain {
  switch (value) {
    case "vocabulary":
    case "recognition":
    case "sleep":
    case "behavior":
    case "motor":
      return value;
    default:
      return "behavior";
  }
}

function normalizeTrend(value: string): Claim["trend"] {
  switch (value) {
    case "stable":
    case "declining":
    case "improving":
    case "mixed":
      return value;
    default:
      return "stable";
  }
}

function normalizeConfidence(value: string): EvidenceFragment["confidence"] {
  return value === "moderate" || value === "medium" ? "moderate" : "high";
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

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
