import { PageHeader } from "@/components/ui/page-header";
import { requireAnyPermission } from "@/lib/server-auth";
import { ExtensionRequestTable } from "@/modules/extension-requests/extension-request-table";

export default async function ExtensionRequestsPage() {
  const authorization = await requireAnyPermission([
    "deadline_extensions.view",
    "deadline_extensions.request",
    "deadline_extensions.approve",
    "deadline_extensions.reject",
  ]);

  return (
    <main className="space-y-6">
      <PageHeader
        description="Consolide solicitudes de ampliación, revise su sustento y siga el circuito de aprobación asignado al responsable de área."
        eyebrow="Seguimiento"
        title="Ampliaciones de plazo"
      />

      <ExtensionRequestTable
        isAdmin={authorization.isAdmin}
        canRequest={authorization.permissions.includes(
          "deadline_extensions.request",
        )}
        currentUserId={authorization.userId}
      />
    </main>
  );
}
