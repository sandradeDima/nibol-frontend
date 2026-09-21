import { PageHeader } from "@/components/ui/page-header";
import { hasAnyPermission } from "@/lib/permissions";
import { requireAnyPermission } from "@/lib/server-auth";
import { PendingApprovalsWorkspace } from "@/modules/extension-requests/pending-approvals-workspace";

export default async function PendingApprovalsPage() {
  const authorization = await requireAnyPermission([
    "action_plans.view",
    "action_plans.evaluate",
    "deadline_extensions.approve",
    "deadline_extensions.reject",
  ]);

  return (
    <main className="space-y-6">
      <PageHeader
        description="Centralice los dictámenes pendientes de avances y ampliaciones de plazo dentro del circuito corporativo de revisión."
        eyebrow="Aprobaciones"
        title="Pendientes de aprobación"
      />

      <PendingApprovalsWorkspace
        canApproveProgress={
          authorization.isAdmin ||
          (authorization.permissions.includes("action_plans.evaluate") &&
            authorization.permissions.includes("action_plans.approve"))
        }
        canReturnProgress={
          authorization.isAdmin ||
          (authorization.permissions.includes("action_plans.evaluate") &&
            authorization.permissions.includes("action_plans.return"))
        }
        canApproveExtensions={authorization.permissions.includes(
          "deadline_extensions.approve",
        )}
        canRejectExtensions={authorization.permissions.includes(
          "deadline_extensions.reject",
        )}
        canViewExtensions={hasAnyPermission(authorization.permissions, [
          "deadline_extensions.approve",
          "deadline_extensions.reject",
        ])}
        canViewProgress={authorization.permissions.includes(
          "action_plans.evaluate",
        )}
      />
    </main>
  );
}
