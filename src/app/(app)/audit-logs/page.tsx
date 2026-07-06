import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { AuditLogTable } from "@/modules/logs/audit-log-table";

export default async function AuditLogsPage() {
  const authorization = await requirePermission("audit_logs.view");

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          authorization.permissions.includes("activity_logs.view") ? (
            <Link
              className="nibol-btn-secondary"
              href="/activity-logs"
            >
              Ver actividad
            </Link>
          ) : null
        }
        description="Consulte registros inmutables de antes y despues para usuarios, roles, permisos, configuraciones e invitaciones."
        eyebrow="Cumplimiento"
        title="Auditoria"
      />

      <AuditLogTable />
    </main>
  );
}
