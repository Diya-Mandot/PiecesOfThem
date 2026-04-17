import { NextResponse } from "next/server";

import { getFragments } from "@/lib/logic";
import type { SignalDomain } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId");
  const domain = searchParams.get("domain") as SignalDomain | null;
  const year = searchParams.get("year") ?? undefined;
  const query = searchParams.get("query") ?? undefined;

  if (!caseId) {
    return NextResponse.json({ error: "Missing caseId" }, { status: 400 });
  }

  const fragments = getFragments(caseId, domain ?? undefined, year, query);
  return NextResponse.json({ fragments });
}
