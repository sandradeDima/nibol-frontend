import { requirePermission } from "@/lib/server-auth";
import { WorkflowSimulation } from "@/modules/workflows/workflow-simulation";

type WorkflowSimulationPageProps = {
  params: Promise<{
    versionId: string;
    workflowId: string;
  }>;
};

export default async function WorkflowSimulationPage({
  params,
}: WorkflowSimulationPageProps) {
  const authorization = await requirePermission("workflows.simulate");
  const { versionId, workflowId } = await params;

  return (
    <main>
      <WorkflowSimulation
        canPublish={authorization.permissions.includes("workflows.publish")}
        versionId={versionId}
        workflowId={workflowId}
      />
    </main>
  );
}
