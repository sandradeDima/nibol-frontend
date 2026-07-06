import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { ObservationDetail } from "@/modules/observations/observation-detail";

type ObservationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ObservationDetailPage({
  params,
}: ObservationDetailPageProps) {
  const authorization = await requirePermission("observations.view");
  const { id } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Revise el resumen ejecutivo del hallazgo, sus responsables, fechas y placeholders de remediacion preparados para las siguientes fases."
        eyebrow="Ficha de observacion"
        title="Detalle de observacion"
      />

      <ObservationDetail
        canDelete={authorization.permissions.includes("observations.delete")}
        canEdit={authorization.permissions.includes("observations.edit")}
        observationId={id}
      />
    </main>
  );
}
