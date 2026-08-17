import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { ActionPlanScheduleTable } from "@/modules/remediation/action-plan-schedule-table";

export default async function CronogramaPage() {
  await requirePermission("observations.view");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Visualice planes de acción, responsables, vencimientos y avance aprobado dentro de un cronograma corporativo unificado."
        eyebrow="Seguimiento"
        title="Cronograma"
      />

      <ActionPlanScheduleTable />
    </main>
  );
}
