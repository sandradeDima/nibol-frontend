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
        canApproveProgress={
          authorization.isAdmin ||
          (authorization.permissions.includes("action_plans.evaluate") &&
            authorization.permissions.includes("action_plans.approve"))
        }
        canDelete={authorization.permissions.includes("action_plans.delete")}
        canViewObservation={
          authorization.isAdmin ||
          authorization.permissions.includes("observations.view")
        }
        canEdit={authorization.permissions.includes("action_plans.edit")}
        canRequestExtension={authorization.permissions.includes(
          "deadline_extensions.request",
        )}
        canReturnProgress={
          authorization.isAdmin ||
          (authorization.permissions.includes("action_plans.evaluate") &&
            authorization.permissions.includes("action_plans.return"))
        }
        canUploadEvidence={
          authorization.isAdmin ||
          authorization.permissions.includes("evidence.create")
        }
        canViewExtensions={authorization.permissions.includes(
          "deadline_extensions.view",
        )}
        canViewWorkflowTasks={authorization.permissions.includes(
          "workflow_tasks.view",
        )}
        currentUserId={authorization.userId}
        initialEditing={edit === "1"}
        isAdmin={authorization.isAdmin}
      />
    </main>
  );
}
