import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { PendingProgressApprovals } from "@/modules/progress/pending-progress-approvals";

export default async function PendingApprovalsPage() {
  await requirePermission("observations.view");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Revise exclusivamente los avances enviados a Auditoria y emita su dictamen sin salir del circuito corporativo."
        eyebrow="Aprobaciones"
        title="Pendientes de aprobacion"
      />

      <PendingProgressApprovals />
    </main>
  );
}
