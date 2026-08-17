import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { WorkflowTaskInbox } from "@/modules/workflows/workflow-task-inbox";

export default async function WorkflowTasksPage() {
  await requirePermission("workflow_tasks.view");
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
