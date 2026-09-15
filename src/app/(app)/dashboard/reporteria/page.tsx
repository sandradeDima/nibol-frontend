import { ErrorState } from "@/components/ui/error-state";

import { requirePermission } from "@/lib/server-auth";
import { DashboardRefreshButton } from "@/modules/dashboard/dashboard-refresh-button";
import { DashboardView } from "@/modules/dashboard/dashboard-view";
import { dashboardServer } from "@/modules/dashboard/server";

export default async function ReportingDashboardPage() {
  await requirePermission("reports.view");
  const summary = await dashboardServer.getMySummary();
  const result = await (
    summary.preferredDashboard === "auditoria"
      ? dashboardServer.getAuditDashboard()
      : dashboardServer.getAreaDashboard()
  )
    .then((data) => ({ data, error: null as unknown }))
    .catch((error: unknown) => ({ data: null, error }));

  if (!result.data) {
    return (
      <main className="space-y-6">
        <ErrorState
          action={<DashboardRefreshButton label="Reintentar" />}
          description={
            result.error instanceof Error
              ? result.error.message
              : "No fue posible cargar el dashboard de reportería."
          }
          title="No se pudo preparar el dashboard de reportería"
        />
      </main>
    );
  }

  return <DashboardView data={result.data} />;
}
