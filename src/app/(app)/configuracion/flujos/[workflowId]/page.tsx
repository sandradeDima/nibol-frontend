import { PageHeader } from "@/components/ui/page-header";
import { Suspense } from "react";
import { requirePermission } from "@/lib/server-auth";
import { WorkflowDetail } from "@/modules/workflows/workflow-detail";

type WorkflowDetailPageProps = {
  params: Promise<{
    workflowId: string;
  }>;
};

export default async function WorkflowDetailPage({
  params,
}: WorkflowDetailPageProps) {
  const authorization = await requirePermission("workflows.view");
  const { workflowId } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Revise la información general, actividad reciente y ciclo de versiones del flujo."
        eyebrow="Configuración · Flujos"
        title="Detalle del flujo"
      />
      <Suspense
        fallback={
          <div className="h-[32rem] animate-pulse bg-[var(--surface-muted)]" />
        }
      >
        <WorkflowDetail
          canArchive={authorization.permissions.includes("workflows.archive")}
          canCreate={authorization.permissions.includes("workflows.create")}
          canEdit={authorization.permissions.includes("workflows.edit")}
          canSimulate={authorization.permissions.includes("workflows.simulate")}
          canViewVersions={authorization.permissions.includes(
            "workflows.view_versions",
          )}
          workflowId={workflowId}
        />
      </Suspense>
    </main>
  );
}
