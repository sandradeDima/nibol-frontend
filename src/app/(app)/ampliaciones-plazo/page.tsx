import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { ExtensionRequestTable } from "@/modules/extension-requests/extension-request-table";

export default async function ExtensionRequestsPage() {
  await requirePermission("extension_requests.view");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Consolide solicitudes de ampliación, revise su sustento y siga el circuito de aprobación entre Gerencia y Auditoría."
        eyebrow="Seguimiento"
        title="Ampliaciones de plazo"
      />

      <ExtensionRequestTable />
    </main>
  );
}
