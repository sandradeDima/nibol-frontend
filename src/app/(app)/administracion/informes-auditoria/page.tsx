import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { AuditReportAdmin } from "@/modules/configuration/audit-report-admin";

export default async function AuditReportsAdminPage() {
  await requirePermission("audit_reports.view");
  return (
    <main className="space-y-6">
      <PageHeader
        description="Registre cada informe una sola vez y úselo como origen de sus observaciones y plazos."
        eyebrow="Administración"
        title="Informes de Auditoría"
      />
      <AuditReportAdmin />
    </main>
  );
}
