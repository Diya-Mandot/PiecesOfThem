import { DataUnavailable } from "@/components/data-unavailable";
import { DashboardShell } from "@/components/dashboard-shell";
import { getWorkbenchData } from "@/lib/api";

export default async function DemoCasePage() {
  const workbench = await getWorkbenchData("demo-child-a");

  if (!workbench) {
    return (
      <DataUnavailable
        title="Demo case is not projected yet."
        body="The backend route for the demo case is reachable, but it does not yet have the extracted datapoints needed to assemble fragments, claims, and trajectory data for the workbench."
      />
    );
  }

  return <DashboardShell bundle={workbench.bundle} trajectory={workbench.trajectory} />;
}
