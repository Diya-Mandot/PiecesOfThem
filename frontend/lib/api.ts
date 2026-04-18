import type {
  GetCaseResponse,
  GetFragmentsResponse,
  GetReportResponse,
  GetTrajectoryResponse,
  PostClaimsResponse
} from "@shared/api";
import type {
  CaseBundle,
  Claim,
  ClaimProvenance,
  EvidenceFragment,
  EvidenceProvenance,
  ReportReadiness,
} from "@shared/types";

import {
  demoFallbackBundle,
  demoFallbackReport,
  demoFallbackTrajectory,
} from "@/lib/demo-fallback";

const backendBaseUrl = process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:4000";

function getBackendUrl(path: string) {
  return new URL(path, backendBaseUrl).toString();
}

async function fetchBackend<T>(path: string, init?: RequestInit): Promise<T | null> {
  let response: Response;

  try {
    response = await fetch(getBackendUrl(path), {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    });
  } catch {
    return null;
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    // 5xx: backend is up but erroring — return null so callers can fall back to demo data
    if (response.status >= 500) {
      return null;
    }

    let details = response.statusText;

    try {
      const body = (await response.json()) as { error?: string };
      details = body.error ?? details;
    } catch {
      // Keep the fallback status text when the response is not JSON.
    }

    throw new Error(`Backend request failed: ${details}`);
  }

  return (await response.json()) as T;
}

export async function getDashboardBundle(caseId: string): Promise<CaseBundle | null> {
  const encodedCaseId = encodeURIComponent(caseId);
  const [caseResponse, fragmentsResponse, claimsResponse] = await Promise.all([
    fetchBackend<GetCaseResponse>(`/api/cases/${encodedCaseId}`),
    fetchBackend<GetFragmentsResponse>(`/api/fragments?caseId=${encodedCaseId}`),
    fetchBackend<PostClaimsResponse>(`/api/claims`, {
      method: "POST",
      body: JSON.stringify({ caseId })
    })
  ]);

  if (!caseResponse || !fragmentsResponse || !claimsResponse) {
    return caseId === "demo-child-a" ? demoFallbackBundle : null;
  }

  const bundle = {
    caseRecord: caseResponse.caseRecord,
    fragments: fragmentsResponse.fragments,
    claims: claimsResponse.claims
  };

  if (caseId === "demo-child-a") {
    return mergeDemoBundle(bundle, demoFallbackBundle);
  }

  return bundle;
}

export async function getReport(caseId: string): Promise<GetReportResponse | null> {
  const report = await fetchBackend<GetReportResponse>(`/api/report/${encodeURIComponent(caseId)}`);
  if (!report && caseId === "demo-child-a") {
    return demoFallbackReport;
  }

  if (report && caseId === "demo-child-a") {
    return buildReportFromBundle(
      mergeDemoBundle(
        {
          caseRecord: {
            id: report.id,
            label: report.label,
            disease: report.disease,
            therapy: report.therapy,
            observationStart: report.observationStart,
            observationEnd: report.observationEnd,
            summary: report.summary,
            dataHandling: report.dataHandling,
            reviewWindow: report.reviewWindow,
            provenanceSummary: report.provenanceSummary,
            reportReadiness: report.reportReadiness,
          },
          fragments: report.claims.flatMap((claim) => claim.citations),
          claims: report.claims.map(({ citations: _citations, ...claim }) => claim),
        },
        demoFallbackBundle,
      ),
    );
  }

  return report;
}

export type WorkbenchData = {
  bundle: CaseBundle;
  trajectory: GetTrajectoryResponse;
};

export async function getWorkbenchData(caseId: string): Promise<WorkbenchData | null> {
  if (caseId === "demo-child-a") {
    const bundle = await getDashboardBundle(caseId);

    if (!bundle) {
      return {
        bundle: demoFallbackBundle,
        trajectory: demoFallbackTrajectory,
      };
    }

    return {
      bundle,
      trajectory: demoFallbackTrajectory,
    };
  }

  const encodedCaseId = encodeURIComponent(caseId);
  const [bundle, trajectory] = await Promise.all([
    getDashboardBundle(caseId),
    fetchBackend<GetTrajectoryResponse>(`/api/chart/trajectory/${encodedCaseId}`),
  ]);

  if (!bundle || !trajectory) {
    return null;
  }

  return { bundle, trajectory };
}

function mergeDemoBundle(primary: CaseBundle, synthetic: CaseBundle): CaseBundle {
  const mergedFragments = Array.from(
    new Map(
      [...synthetic.fragments, ...primary.fragments].map((fragment) => [fragment.id, fragment]),
    ).values(),
  ).sort((left, right) => left.date.localeCompare(right.date));

  const mergedClaims = Array.from(
    new Map([...synthetic.claims, ...primary.claims].map((claim) => [claim.id, claim])).values(),
  ).sort((left, right) => left.id.localeCompare(right.id));

  const reportReadiness = deriveReportReadiness(mergedFragments, mergedClaims);

  return {
    caseRecord: {
      ...synthetic.caseRecord,
      ...primary.caseRecord,
      label: synthetic.caseRecord.label,
      disease: synthetic.caseRecord.disease,
      therapy: synthetic.caseRecord.therapy,
      observationStart: mergedFragments[0]?.date ?? synthetic.caseRecord.observationStart,
      observationEnd:
        mergedFragments[mergedFragments.length - 1]?.date ?? synthetic.caseRecord.observationEnd,
      summary:
        "Hackathon demo case built primarily from authored caregiver-style evidence fragments, then enriched with public-source-grounded signals so the workbench can show temporal retrieval, synthesis, and citation lineage clearly.",
      dataHandling:
        "Hackathon demo case uses primarily synthetic, de-identified caregiver-style evidence with supplemental public-source-grounded signals. Review support only; not diagnosis, treatment guidance, or approval recommendation.",
      provenanceSummary: buildProvenanceSummary(mergedFragments, mergedClaims),
      reportReadiness,
    },
    fragments: mergedFragments,
    claims: mergedClaims,
  };
}

function buildReportFromBundle(bundle: CaseBundle): GetReportResponse {
  return {
    ...bundle.caseRecord,
    metrics: {
      fragmentCount: bundle.fragments.length,
      claimCount: bundle.claims.length,
      modalities: Array.from(new Set(bundle.fragments.map((fragment) => fragment.sourceType))).length,
      domains: Array.from(new Set(bundle.fragments.map((fragment) => fragment.signalDomain))).length,
      realFragments: bundle.fragments.filter((fragment) => fragment.provenance === "real").length,
      syntheticFragments: bundle.fragments.filter((fragment) => fragment.provenance === "synthetic").length,
      mixedClaims: bundle.claims.filter((claim) => claim.provenance === "mixed").length,
    },
    claims: bundle.claims.map((claim) => ({
      ...claim,
      citations: bundle.fragments.filter((fragment) => claim.fragmentIds.includes(fragment.id)),
    })),
  };
}

function buildProvenanceSummary(fragments: EvidenceFragment[], claims: Claim[]) {
  const realFragments = fragments.filter((fragment) => fragment.provenance === "real").length;
  const syntheticFragments = fragments.filter((fragment) => fragment.provenance === "synthetic").length;
  const mixedClaims = claims.filter((claim) => claim.provenance === "mixed").length;

  return `${realFragments} real fragment${realFragments === 1 ? "" : "s"}, ${syntheticFragments} synthetic fragment${syntheticFragments === 1 ? "" : "s"}, ${mixedClaims} mixed claim${mixedClaims === 1 ? "" : "s"}.`;
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
