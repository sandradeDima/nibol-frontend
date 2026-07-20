import { ErrorState } from "@/components/ui/error-state";
import { DashboardRefreshButton } from "@/modules/dashboard/dashboard-refresh-button";
import { DashboardView } from "@/modules/dashboard/dashboard-view";
import { dashboardServer } from "@/modules/dashboard/server";

const loadAreaDashboard = async () => {
  try {
    return {
      data: await dashboardServer.getAreaDashboard(),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
};

export default async function AreaDashboardPage() {
  const result = await loadAreaDashboard();

  if (result.error || !result.data) {
    return (
      <main className="space-y-6">
        <ErrorState
          action={<DashboardRefreshButton label="Reintentar" />}
          description={
            result.error instanceof Error
              ? result.error.message
              : "No fue posible cargar el dashboard del área."
          }
          title="No se pudo preparar el dashboard del área"
        />
      </main>
    );
  }

  return <DashboardView data={result.data} />;
}
