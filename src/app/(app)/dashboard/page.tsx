import { ErrorState } from "@/components/ui/error-state";
import { hasAnyPermission, hasPermission } from "@/lib/permissions";
import { requirePermission } from "@/lib/server-auth";
import { OperationalDashboard } from "@/modules/dashboard/operational-dashboard";
import { dashboardServer } from "@/modules/dashboard/server";
import { DashboardRefreshButton } from "@/modules/dashboard/dashboard-refresh-button";

export default async function DashboardRoutePage() {
  const authorization = await requirePermission("observations.view");
  const result = await dashboardServer
    .getOperationalDashboard()
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
              : "No fue posible preparar el dashboard operativo."
          }
          title="No se pudo preparar el dashboard"
        />
      </main>
    );
  }

  return (
    <OperationalDashboard
      canViewApprovals={hasAnyPermission(authorization.permissions, [
        "action_plans.evaluate",
        "deadline_extensions.approve",
        "deadline_extensions.reject",
      ])}
      canViewExtensions={hasPermission(
        authorization.permissions,
        "deadline_extensions.view",
      )}
      canViewReports={hasPermission(authorization.permissions, "reports.view")}
      canViewWorkflowTasks={hasPermission(
        authorization.permissions,
        "workflow_tasks.view",
      )}
      data={result.data}
    />
  );
}
