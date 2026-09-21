import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { ExtensionRequestTable } from "@/modules/extension-requests/extension-request-table";

export default async function ExtensionRequestsPage() {
  const authorization = await requirePermission("deadline_extensions.view");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Consolide solicitudes de ampliación, revise su sustento y siga el circuito de aprobación asignado al responsable de área."
        eyebrow="Seguimiento"
        title="Ampliaciones de plazo"
      />

      <ExtensionRequestTable
        canApprove={authorization.permissions.includes(
          "deadline_extensions.approve",
        )}
        canReject={authorization.permissions.includes(
          "deadline_extensions.reject",
        )}
      />
    </main>
  );
}
