import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { ObservationForm } from "@/modules/observations/observation-form";

export default async function NewObservationPage() {
  await requirePermission("observations.create");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Cree una observacion base de auditoria con riesgo, estado, area, responsable y fecha limite dentro del flujo corporativo de seguimiento."
        eyebrow="Observaciones"
        title="Nueva observacion"
      />

      <ObservationForm mode="create" />
    </main>
  );
}
