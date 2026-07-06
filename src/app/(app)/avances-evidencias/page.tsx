import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { ProgressUpdatesTable } from "@/modules/progress/progress-updates-table";

export default async function AvancesEvidenciasPage() {
  await requirePermission("observations.view");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Consolide en una sola bandeja los avances operativos, la evidencia asociada y su estado de revision frente a Auditoria."
        eyebrow="Seguimiento"
        title="Avances y evidencias"
      />

      <ProgressUpdatesTable />
    </main>
  );
}
