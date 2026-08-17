import { requirePermission } from "@/lib/server-auth";
import { ReportGenerator } from "@/modules/reports/report-generator";

export default async function ReportGeneratorPage() {
  const authorization = await requirePermission("reports.view");

  return (
    <ReportGenerator
      canExport={
        authorization.isAdmin ||
        authorization.permissions.includes("reports.export")
      }
    />
  );
}
