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
        canAssignRecommendedExecutor={authorization.permissions.includes(
          "action_plans.assign_executor",
        )}
        canDelete={authorization.permissions.includes("observations.delete")}
        canClose={authorization.permissions.includes("observations.close")}
        canCreateRecommended={authorization.permissions.includes(
          "recommended_action_plans.create",
        )}
        canSend={authorization.permissions.includes("observations.send")}
        canEdit={authorization.permissions.includes("observations.edit")}
        canEditActionPlans={authorization.permissions.includes(
          "action_plans.edit",
        )}
        canEditRecommended={authorization.permissions.includes(
          "recommended_action_plans.edit",
        )}
        canReviewProgress={authorization.permissions.includes(
          "action_plans.evaluate",
        )}
        canReviewEvidence={
          authorization.roleCode === "AUDITOR" &&
          authorization.permissions.includes("evidence.review")
        }
        canSubmitProgress={authorization.permissions.includes(
          "action_plans.submit_to_audit",
        )}
        canSubmitRecommended={authorization.permissions.includes(
          "recommended_action_plans.submit_to_audit",
        )}
        canUploadEvidence={authorization.permissions.includes(
          "evidence.create",
        )}
        canViewTechnical={
          authorization.permissions.includes("activity.technical") ||
          authorization.isAdmin
        }
        canViewRecommended={authorization.permissions.includes(
          "recommended_action_plans.view",
        )}
        observationId={id}
      />
    </main>
  );
}
