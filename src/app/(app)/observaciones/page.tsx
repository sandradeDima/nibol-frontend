import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { ObservationTable } from "@/modules/observations/observation-table";

export default async function ObservacionesPage() {
  const authorization = await requirePermission("observations.view");
  const canCreate = authorization.permissions.includes("observations.create");
  const canDelete = authorization.permissions.includes("observations.delete");
  const canEdit = authorization.permissions.includes("observations.edit");

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <button
              className="nibol-btn-secondary cursor-not-allowed px-4 py-2.5 text-sm opacity-60"
              disabled
              title="Disponible en la siguiente fase"
              type="button"
            >
              Exportar Excel
            </button>
            {canCreate ? (
              <Link className="nibol-btn-primary" href="/observaciones/nueva">
                Nueva observacion
              </Link>
            ) : null}
          </>
        }
        description="Registre, clasifique y haga seguimiento corporativo a observaciones y hallazgos de auditoria con filtros, responsables y fechas compromiso."
        eyebrow="Auditoria"
        title="Observaciones"
      />

      <ObservationTable canDelete={canDelete} canEdit={canEdit} />
    </main>
  );
}
