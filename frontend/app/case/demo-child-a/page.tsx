import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";
import { getCaseBundle } from "@/lib/logic";

export default function DemoCasePage() {
  const bundle = getCaseBundle("demo-child-a");

  if (!bundle) {
    notFound();
  }

  return <DashboardShell bundle={bundle} />;
}
