import type {
  GetCaseResponse,
  GetFragmentsResponse,
  GetReportResponse,
  GetTrajectoryResponse,
  PostClaimsResponse
} from "@shared/api";
import type { CaseBundle } from "@shared/types";

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

  return {
    caseRecord: caseResponse.caseRecord,
    fragments: fragmentsResponse.fragments,
    claims: claimsResponse.claims
  };
}

export async function getReport(caseId: string): Promise<GetReportResponse | null> {
  const report = await fetchBackend<GetReportResponse>(`/api/report/${encodeURIComponent(caseId)}`);
  if (!report && caseId === "demo-child-a") {
    return demoFallbackReport;
  }

  return report;
}

export type WorkbenchData = {
  bundle: CaseBundle;
  trajectory: GetTrajectoryResponse;
};

export async function getWorkbenchData(caseId: string): Promise<WorkbenchData | null> {
  const encodedCaseId = encodeURIComponent(caseId);
  const [bundle, trajectory] = await Promise.all([
    getDashboardBundle(caseId),
    fetchBackend<GetTrajectoryResponse>(`/api/chart/trajectory/${encodedCaseId}`),
  ]);

  if (!bundle || !trajectory) {
    if (caseId === "demo-child-a") {
      return {
        bundle: demoFallbackBundle,
        trajectory: demoFallbackTrajectory,
      };
    }

    return null;
  }

  return { bundle, trajectory };
}
