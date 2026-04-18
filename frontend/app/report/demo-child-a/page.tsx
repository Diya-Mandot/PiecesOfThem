import { DataUnavailable } from "@/components/data-unavailable";
import { ReportPage } from "@/components/report-page";
import { getReport } from "@/lib/api";

export default async function DemoReportPage() {
  const report = await getReport("demo-child-a");

  if (!report) {
    return (
      <DataUnavailable
        title="Evidence brief is not available yet."
        body="The report route depends on structured extracted datapoints from the ingestion pipeline. Those datapoints have not been produced yet, so the evidence brief cannot be assembled."
      />
    );
  }

  return <ReportPage report={report} />;
}
