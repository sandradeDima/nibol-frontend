import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { CommitmentScheduleTable } from "@/modules/remediation/commitment-schedule-table";

export default async function CronogramaPage() {
  await requirePermission("observations.view");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Visualice compromisos, responsables, vencimientos y avance operativo dentro de un cronograma corporativo unificado."
        eyebrow="Seguimiento"
        title="Cronograma"
      />

      <CommitmentScheduleTable />
    </main>
  );
}

