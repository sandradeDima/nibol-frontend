import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { WorkflowVersionHistory } from "@/modules/workflows/workflow-versions";

type WorkflowVersionsPageProps = {
  params: Promise<{
    workflowId: string;
  }>;
};

export default async function WorkflowVersionsPage({
  params,
}: WorkflowVersionsPageProps) {
  const authorization = await requirePermission("workflows.view_versions");
  const { workflowId } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Consulte versiones nuevas y publicadas en orden descendente, con trazabilidad y acciones de borrador controladas."
        eyebrow="Configuración · Flujos"
        title="Historial de versiones"
      />
      <WorkflowVersionHistory
        canCreateDraft={authorization.permissions.includes("workflows.edit")}
        canSimulate={authorization.permissions.includes("workflows.simulate")}
        workflowId={workflowId}
      />
    </main>
  );
}
