import { DataUnavailable } from "@/components/data-unavailable";
import { ReportPage } from "@/components/report-page";
import { getReport } from "@/lib/api";

export default async function DemoReportPage() {
  const report = await getReport("demo-child-a");

  if (!report) {
    return (
      <DataUnavailable
        title="Evidence brief is not available yet."
        body="The report route depends on canonical evidence fragments and claims from the ingestion pipeline. Those records have not been produced yet, so the evidence brief cannot be assembled."
      />
    );
  }

  return <ReportPage report={report} />;
}
