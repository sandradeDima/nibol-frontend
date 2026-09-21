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
    <main>
      <ObservationDetail
        canAssignRecommendedExecutor={authorization.permissions.includes(
          "action_plans.assign_executor",
        )}
        canDelete={authorization.permissions.includes("observations.delete")}
        canClose={authorization.permissions.includes("observations.close")}
        canCreateActionPlans={authorization.permissions.includes(
          "action_plans.create",
        )}
        canCreateRecommended={authorization.permissions.includes(
          "recommended_action_plans.create",
        )}
        canDeleteEvidence={authorization.permissions.includes(
          "evidence.delete",
        )}
        canSend={authorization.permissions.includes("observations.send")}
        canEdit={authorization.permissions.includes("observations.edit")}
        canEditActionPlans={authorization.permissions.includes(
          "action_plans.edit",
        )}
        canEditRecommended={authorization.permissions.includes(
          "recommended_action_plans.edit",
        )}
        canSubmitProgress={authorization.permissions.includes(
          "action_plans.submit_to_audit",
        )}
        canSubmitRecommended={authorization.permissions.includes(
          "recommended_action_plans.submit_to_audit",
        )}
        canUploadEvidence={authorization.permissions.includes(
          "evidence.create",
        )}
        canViewRecommended={authorization.permissions.includes(
          "recommended_action_plans.view",
        )}
        currentUserId={authorization.userId}
        observationId={id}
      />
    </main>
  );
}
