import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { RemediationPlanTable } from "@/modules/remediation/remediation-plan-table";

export default async function PlanesRemediacionPage() {
  await requirePermission("observations.view");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Centralice la respuesta de cada area, su estado de revision y el avance del cronograma comprometido frente a Auditoria."
        eyebrow="Seguimiento"
        title="Planes de remediacion"
      />

      <RemediationPlanTable />
    </main>
  );
}

