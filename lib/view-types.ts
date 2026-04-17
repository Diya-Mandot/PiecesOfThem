import type { getReportPayload } from "@/lib/logic";

export type ReturnTypeOfReportPayload = NonNullable<ReturnType<typeof getReportPayload>>;
