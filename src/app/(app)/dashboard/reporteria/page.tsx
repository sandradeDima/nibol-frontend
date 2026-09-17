import { requirePermission } from "@/lib/server-auth";
import { ReportingDashboard } from "@/modules/dashboard/reporting-dashboard";

export default async function ReportingDashboardPage() {
  const authorization = await requirePermission("reports.view");

  return (
    <ReportingDashboard
      canExport={
        authorization.isAdmin ||
        authorization.permissions.includes("reports.export")
      }
    />
  );
}
