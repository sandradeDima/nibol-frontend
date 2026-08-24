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
        description="Revise el resumen ejecutivo del hallazgo, sus responsables, fechas y próximas acciones de seguimiento."
        eyebrow="Ficha de observacion"
        title="Detalle de observacion"
      />

      <ObservationDetail
        canAccessExtensions={authorization.permissions.includes(
          "extension_requests.view",
        )}
        canDelete={authorization.permissions.includes("observations.delete")}
        canClose={authorization.permissions.includes("observations.close")}
        canEdit={authorization.permissions.includes("observations.edit")}
        canEditActionPlans={authorization.permissions.includes(
          "action_plans.edit",
        )}
        canViewTechnical={
          authorization.permissions.includes("activity.technical") ||
          authorization.isAdmin
        }
        observationId={id}
      />
    </main>
  );
}
