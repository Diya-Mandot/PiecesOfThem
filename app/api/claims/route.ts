import { NextResponse } from "next/server";

import { getClaims } from "@/lib/logic";
import type { SignalDomain } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { caseId?: string; domain?: SignalDomain };

  if (!body.caseId) {
    return NextResponse.json({ error: "Missing caseId" }, { status: 400 });
  }

  const claims = getClaims(body.caseId, body.domain);
  return NextResponse.json({ claims });
}
