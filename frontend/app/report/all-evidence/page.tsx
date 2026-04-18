import { DataUnavailable } from "@/components/data-unavailable";
import { ReportPage } from "@/components/report-page";
import { aggregateEvidenceId, getReport } from "@/lib/api";

export default async function AllEvidenceReportPage() {
  const report = await getReport(aggregateEvidenceId);

  if (!report) {
    return (
      <DataUnavailable
        title="Evidence brief is not available yet."
        body="The report route depends on canonical evidence fragments and claims from the ingestion pipeline. Those records have not been produced yet, so the aggregate evidence brief cannot be assembled."
      />
    );
  }

  return <ReportPage report={report} />;
}
