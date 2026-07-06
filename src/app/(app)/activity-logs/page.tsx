import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { ActivityLogTable } from "@/modules/logs/activity-log-table";

export default async function ActivityLogsPage() {
  const authorization = await requirePermission("activity_logs.view");

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          authorization.permissions.includes("audit_logs.view") ? (
            <Link
              className="nibol-btn-secondary"
              href="/audit-logs"
            >
              Ver auditoria
            </Link>
          ) : null
        }
        description="Revise la trazabilidad operativa de accesos, usuarios, roles, invitaciones y acciones del sistema."
        eyebrow="Trazabilidad"
        title="Bitacora de actividad"
      />

      <ActivityLogTable />
    </main>
  );
}
