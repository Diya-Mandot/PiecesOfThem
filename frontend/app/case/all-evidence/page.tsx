import { DataUnavailable } from "@/components/data-unavailable";
import { DashboardShell } from "@/components/dashboard-shell";
import { aggregateEvidenceId, getWorkbenchData } from "@/lib/api";

export default async function AllEvidencePage() {
  const workbench = await getWorkbenchData(aggregateEvidenceId);

  if (!workbench) {
    return (
      <DataUnavailable
        title="Evidence archive is not projected yet."
        body="The backend route is reachable, but it does not yet have the evidence fragments and claims needed to assemble the evidence workbench."
      />
    );
  }

  return <DashboardShell bundle={workbench.bundle} trajectory={workbench.trajectory} />;
}
