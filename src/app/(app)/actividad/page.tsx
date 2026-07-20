import { PageHeader } from "@/components/ui/page-header";
import { requireAnyPermission } from "@/lib/server-auth";
import { ActivityPage } from "@/modules/activity/activity-page";

export default async function ActivityPageRoute() {
  const authorization = await requireAnyPermission(["activity.view", "activity_logs.view", "observations.view"]);

  return (
    <main className="space-y-6">
      <PageHeader description="Una vista consolidada de cambios, avances, evidencias, decisiones y procesos automáticos con el alcance que corresponde a su rol." eyebrow="Control y trazabilidad" title="Actividad" />
      <ActivityPage canExport={authorization.permissions.includes("activity.export")} canViewTechnical={authorization.permissions.includes("activity.technical") || authorization.isAdmin} />
    </main>
  );
}
