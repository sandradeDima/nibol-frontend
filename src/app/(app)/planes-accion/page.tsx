import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { RemediationPlanTable } from "@/modules/remediation/remediation-plan-table";

export default async function ActionPlansPage() {
  await requirePermission("action_plans.view");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Centralice los planes de acción por observación y área, con responsables, fechas y avance aprobado."
        eyebrow="Seguimiento"
        title="Planes de acción"
      />
      <RemediationPlanTable />
    </main>
  );
}
