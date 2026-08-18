import { PageHeader } from "@/components/ui/page-header";
import { requireAnyPermission } from "@/lib/server-auth";
import { WorkflowInstanceDetail } from "@/modules/workflows/workflow-instance-detail";

export default async function WorkflowInstanceDetailPage({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const authorization = await requireAnyPermission([
    "workflows.view_instances",
    "workflow_tasks.view",
    "workflow_instances.start",
  ]);
  const { instanceId } = await params;
  return (
    <main className="space-y-6">
      <PageHeader
        description="Consulte la versión fijada, las decisiones y el historial normalizado de ejecución."
        eyebrow="Configuración · Workflows"
        title="Detalle de instancia"
      />
      <WorkflowInstanceDetail
        canCancel={authorization.permissions.includes(
          "workflow_instances.cancel",
        )}
        canRetry={authorization.permissions.includes(
          "workflow_instances.retry",
        )}
        instanceId={instanceId}
      />
    </main>
  );
}
