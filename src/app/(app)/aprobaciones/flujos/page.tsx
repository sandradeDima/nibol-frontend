import { PageHeader } from "@/components/ui/page-header";
import { requireAnyPermission } from "@/lib/server-auth";
import { WorkflowTaskInbox } from "@/modules/workflows/workflow-task-inbox";

export default async function WorkflowTasksPage() {
  await requireAnyPermission([
    "workflow_tasks.view",
    "workflow_tasks.approve",
    "workflow_tasks.complete",
    "workflow_tasks.reject",
    "workflow_tasks.observe",
    "workflow_tasks.request_correction",
    "workflow_tasks.reassign",
  ]);
  return (
    <main className="space-y-6">
      <PageHeader
        description="Revise y atienda únicamente las tareas de workflows asignadas a su usuario, roles o áreas administradas."
        eyebrow="Aprobaciones · Workflows"
        title="Tareas de aprobación"
      />
      <WorkflowTaskInbox />
    </main>
  );
}
