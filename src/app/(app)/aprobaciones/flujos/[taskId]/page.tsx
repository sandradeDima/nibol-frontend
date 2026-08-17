import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { WorkflowTaskDetail } from "@/modules/workflows/workflow-task-detail";

export default async function WorkflowTaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const authorization = await requirePermission("workflow_tasks.view");
  const { taskId } = await params;
  return (
    <main className="space-y-6">
      <PageHeader
        description="Revise el contexto, requisitos, asignación y rutas disponibles de la tarea."
        eyebrow="Aprobaciones · Workflows"
        title="Detalle de tarea"
      />
      <WorkflowTaskDetail
        canReassign={authorization.permissions.includes(
          "workflow_tasks.reassign",
        )}
        taskId={taskId}
      />
    </main>
  );
}
