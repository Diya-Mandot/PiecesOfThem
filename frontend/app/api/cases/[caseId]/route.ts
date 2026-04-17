import { NextResponse } from "next/server";

import { getCaseBundle } from "@/lib/logic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  const bundle = getCaseBundle(caseId);

  if (!bundle) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  return NextResponse.json({
    caseRecord: bundle.caseRecord,
    metrics: {
      fragmentCount: bundle.fragments.length,
      claimCount: bundle.claims.length,
      sourceTypes: Array.from(new Set(bundle.fragments.map((fragment) => fragment.sourceType))),
    },
  });
}
