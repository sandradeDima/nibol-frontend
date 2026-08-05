import { requireAnyPermission } from "@/lib/server-auth";
import { WorkflowDesigner } from "@/modules/workflows/workflow-designer";

type WorkflowDesignerPageProps = {
  params: Promise<{
    versionId: string;
    workflowId: string;
  }>;
};

export default async function WorkflowDesignerPage({
  params,
}: WorkflowDesignerPageProps) {
  const authorization = await requireAnyPermission([
    "workflows.edit",
    "workflows.simulate",
    "workflows.validate",
    "workflows.view_versions",
  ]);
  const { versionId, workflowId } = await params;

  return (
    <main>
      <WorkflowDesigner
        canEdit={authorization.permissions.includes("workflows.edit")}
        canPublish={authorization.permissions.includes("workflows.publish")}
        canSimulate={authorization.permissions.includes("workflows.simulate")}
        canValidate={authorization.permissions.includes("workflows.validate")}
        versionId={versionId}
        workflowId={workflowId}
      />
    </main>
  );
}
