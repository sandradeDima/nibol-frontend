import Link from "next/link";
import { Suspense } from "react";

import { Plus } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { WorkflowList } from "@/modules/workflows/workflow-list";

export default async function WorkflowsPage() {
  const authorization = await requirePermission("workflows.view");

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          authorization.permissions.includes("workflows.create") ? (
            <Link
              className="nibol-btn-primary"
              href="/configuracion/flujos/nuevo"
            >
              <Plus className="h-4 w-4" />
              Crear flujo
            </Link>
          ) : null
        }
        description="Administre definiciones, versiones y borradores de aprobación con trazabilidad, permisos y estados claros."
        eyebrow="Configuración"
        title="Flujos configurados"
      />

      <Suspense
        fallback={
          <div className="h-[32rem] animate-pulse bg-[var(--surface-muted)]" />
        }
      >
        <WorkflowList
          canArchive={authorization.permissions.includes("workflows.archive")}
          canCreate={authorization.permissions.includes("workflows.create")}
          canEdit={authorization.permissions.includes("workflows.edit")}
          canViewVersions={authorization.permissions.includes(
            "workflows.view_versions",
          )}
        />
      </Suspense>
    </main>
  );
}
