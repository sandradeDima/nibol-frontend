import { PageHeader } from "@/components/ui/page-header";
import { requireAnyPermission } from "@/lib/server-auth";
import { PendingApprovalsWorkspace } from "@/modules/extension-requests/pending-approvals-workspace";

export default async function PendingApprovalsPage() {
  const authorization = await requireAnyPermission([
    "observations.view",
    "extension_requests.view",
  ]);

  return (
    <main className="space-y-6">
      <PageHeader
        description="Centralice los dictámenes pendientes de avances y ampliaciones de plazo dentro del circuito corporativo de revisión."
        eyebrow="Aprobaciones"
        title="Pendientes de aprobacion"
      />

      <PendingApprovalsWorkspace
        canViewExtensions={authorization.permissions.includes("extension_requests.view")}
        canViewProgress={authorization.permissions.includes("observations.view")}
      />
    </main>
  );
}
