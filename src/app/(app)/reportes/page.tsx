import { requirePermission } from "@/lib/server-auth";
import { ReportsDashboard } from "@/modules/reports/reports-dashboard";

export default async function ReportesPage() {
  const authorization = await requirePermission("reports.view");

  return (
    <ReportsDashboard
      canExport={
        authorization.isAdmin ||
        authorization.permissions.includes("reports.export")
      }
      canViewAudit={
        authorization.isAdmin ||
        authorization.permissions.includes("audit_reports.view")
      }
    />
  );
}
