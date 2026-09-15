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
        canApproveProgress={
          authorization.isAdmin ||
          (authorization.permissions.includes("action_plans.evaluate") &&
            authorization.permissions.includes("action_plans.approve"))
        }
        canDelete={authorization.permissions.includes("observations.delete")}
        canClose={authorization.permissions.includes("observations.close")}
        canCreateActionPlans={authorization.permissions.includes(
          "action_plans.create",
        )}
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
        canReviewEvidence={
          authorization.roleCode === "AUDITOR" &&
          authorization.permissions.includes("evidence.review")
        }
        canReturnProgress={
          authorization.isAdmin ||
          (authorization.permissions.includes("action_plans.evaluate") &&
            authorization.permissions.includes("action_plans.return"))
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
        currentUserId={authorization.userId}
        isAdmin={authorization.isAdmin}
        observationId={id}
      />
    </main>
  );
}
