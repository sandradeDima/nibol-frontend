import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { ObservationForm } from "@/modules/observations/observation-form";

type EditObservationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditObservationPage({
  params,
}: EditObservationPageProps) {
  await requirePermission("observations.edit");
  const { id } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Actualice la clasificacion, responsable, plazo o contexto del hallazgo sin perder trazabilidad en el registro de auditoria."
        eyebrow="Observaciones"
        title="Editar observacion"
      />

      <ObservationForm mode="edit" observationId={id} />
    </main>
  );
}
