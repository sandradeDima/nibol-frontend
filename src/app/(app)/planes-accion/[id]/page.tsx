import { requirePermission } from "@/lib/server-auth";
import { ActionPlanDetailView } from "@/modules/remediation/action-plan-detail";

export default async function ActionPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const authorization = await requirePermission("action_plans.view");
  const { id } = await params;
  const query = await searchParams;
  const edit = Array.isArray(query.edit) ? query.edit[0] : query.edit;
  return (
    <main>
      <ActionPlanDetailView
        actionPlanId={id}
        canApproveExtensions={authorization.permissions.includes(
          "deadline_extensions.approve",
        )}
        canApproveProgress={
          authorization.isAdmin ||
          (authorization.permissions.includes("action_plans.evaluate") &&
            authorization.permissions.includes("action_plans.approve"))
        }
        canViewObservation={authorization.permissions.includes(
          "observations.view",
        )}
        canEdit={authorization.permissions.includes("action_plans.edit")}
        canManageExtensions={
          authorization.permissions.includes("deadline_extensions.approve") ||
          authorization.permissions.includes("deadline_extensions.reject")
        }
        canRequestExtension={authorization.permissions.includes(
          "deadline_extensions.request",
        )}
        canRejectExtensions={authorization.permissions.includes(
          "deadline_extensions.reject",
        )}
        canReturnProgress={
          authorization.isAdmin ||
          (authorization.permissions.includes("action_plans.evaluate") &&
            authorization.permissions.includes("action_plans.return"))
        }
        canViewExtensions={authorization.permissions.includes(
          "deadline_extensions.view",
        )}
        canUploadEvidence={authorization.permissions.includes(
          "evidence.create",
        )}
        currentUserId={authorization.userId}
        initialEditing={edit === "1"}
        isAdmin={authorization.isAdmin}
      />
    </main>
  );
}
