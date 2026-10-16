import { PageHeader } from "@/components/ui/page-header";
import { requireAnyPermission } from "@/lib/server-auth";
import { WorkflowTaskDetail } from "@/modules/workflows/workflow-task-detail";

export default async function WorkflowTaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const authorization = await requireAnyPermission([
    "workflow_tasks.view",
    "workflow_tasks.approve",
    "workflow_tasks.complete",
    "workflow_tasks.reject",
    "workflow_tasks.observe",
    "workflow_tasks.request_correction",
    "workflow_tasks.reassign",
  ]);
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
