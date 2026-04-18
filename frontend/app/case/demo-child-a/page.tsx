import { DataUnavailable } from "@/components/data-unavailable";
import { DashboardShell } from "@/components/dashboard-shell";
import { getWorkbenchData } from "@/lib/api";

/** Demo workbench route that resolves to the current backend-backed evidence set. */
export default async function DemoCasePage() {
  const workbench = await getWorkbenchData("demo-child-a");

  if (!workbench) {
    return (
      <DataUnavailable
        title="Demo case is not projected yet."
        body="The backend route for the demo case is reachable, but it does not yet have the evidence fragments and claims needed to assemble the workbench."
      />
    );
  }

  return <DashboardShell bundle={workbench.bundle} trajectory={workbench.trajectory} />;
}
