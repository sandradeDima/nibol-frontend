import { PageHeader } from "@/components/ui/page-header";
import { requireAnyPermission } from "@/lib/server-auth";
import { ExtensionRequestDetail } from "@/modules/extension-requests/extension-request-detail";

type ExtensionRequestDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExtensionRequestDetailPage({
  params,
}: ExtensionRequestDetailPageProps) {
  const authorization = await requireAnyPermission([
    "deadline_extensions.view",
    "deadline_extensions.request",
    "deadline_extensions.approve",
    "deadline_extensions.reject",
  ]);
  const { id } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Revise la reprogramación propuesta, sus respaldos y el flujo corporativo de aprobación hasta el dictamen final."
        eyebrow="Aprobaciones"
        title="Detalle de ampliación"
      />

      <ExtensionRequestDetail
        isAdmin={authorization.isAdmin}
        canApprove={authorization.permissions.includes(
          "deadline_extensions.approve",
        )}
        canReject={authorization.permissions.includes(
          "deadline_extensions.reject",
        )}
        canRequest={authorization.permissions.includes(
          "deadline_extensions.request",
        )}
        currentUserId={authorization.userId}
        requestId={id}
      />
    </main>
  );
}
