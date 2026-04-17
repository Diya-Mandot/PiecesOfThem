import { notFound } from "next/navigation";

import { ReportPage } from "@/components/report-page";
import { getReportPayload } from "@/lib/logic";

export default function DemoReportPage() {
  const report = getReportPayload("demo-child-a");

  if (!report) {
    notFound();
  }

  return <ReportPage report={report} />;
}
