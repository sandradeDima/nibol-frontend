import { requirePermission } from "@/lib/server-auth";
import { AuditReports } from "@/modules/reports/audit-reports";

export default async function AuditReportsPage() {
  const authorization = await requirePermission("audit_reports.view");

  return (
    <AuditReports
      canExport={
        authorization.isAdmin ||
        authorization.permissions.includes("audit_reports.export")
      }
    />
  );
}
