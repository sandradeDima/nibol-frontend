import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { RoleTable } from "@/modules/roles/role-table";

export default async function RolesPage() {
  const authorization = await requirePermission("roles.view");

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          authorization.permissions.includes("roles.create") ? (
            <Link
              className="nibol-btn-primary"
              href="/roles/new"
            >
              Nuevo rol
            </Link>
          ) : null
        }
        description="Gestione perfiles de acceso con una matriz de permisos clara, trazabilidad y resguardos para roles criticos."
        eyebrow="Directorio"
        title="Roles"
      />

      <RoleTable />
    </main>
  );
}
