import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { ExtensionRequestDetail } from "@/modules/extension-requests/extension-request-detail";

type ExtensionRequestDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExtensionRequestDetailPage({
  params,
}: ExtensionRequestDetailPageProps) {
  await requirePermission("extension_requests.view");
  const { id } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Revise la reprogramación propuesta, sus respaldos y el flujo corporativo de aprobación hasta el dictamen final."
        eyebrow="Aprobaciones"
        title="Detalle de ampliación"
      />

      <ExtensionRequestDetail requestId={id} />
    </main>
  );
}
