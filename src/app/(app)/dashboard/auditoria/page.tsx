import { redirect } from "next/navigation";

import { ErrorState } from "@/components/ui/error-state";
import { DashboardRefreshButton } from "@/modules/dashboard/dashboard-refresh-button";
import { DashboardView } from "@/modules/dashboard/dashboard-view";
import {
  DashboardRequestError,
  dashboardServer,
} from "@/modules/dashboard/server";

const loadAuditDashboard = async () => {
  try {
    return {
      data: await dashboardServer.getAuditDashboard(),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
};

export default async function AuditoriaDashboardPage() {
  const result = await loadAuditDashboard();

  if (result.error instanceof DashboardRequestError && result.error.status === 403) {
    redirect("/dashboard/area");
  }

  if (result.error || !result.data) {
    return (
      <main className="space-y-6">
        <ErrorState
          action={<DashboardRefreshButton label="Reintentar" />}
          description={
            result.error instanceof Error
              ? result.error.message
              : "No fue posible cargar el dashboard de Auditoría."
          }
          title="No se pudo preparar el dashboard global"
        />
      </main>
    );
  }

  return <DashboardView data={result.data} />;
}
