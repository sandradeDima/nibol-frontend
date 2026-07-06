import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { InvitationTable } from "@/modules/invitations/invitation-table";

export default async function InvitationsPage() {
  const authorization = await requirePermission("invitations.view");

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          authorization.permissions.includes("invitations.create") ? (
            <Link
              className="nibol-btn-primary"
              href="/invitations/new"
            >
              Nueva invitacion
            </Link>
          ) : null
        }
        description="Controle invitaciones pendientes, aceptadas, vencidas o revocadas desde el mismo esquema operativo del panel."
        eyebrow="Incorporacion"
        title="Invitaciones"
      />

      <InvitationTable />
    </main>
  );
}
