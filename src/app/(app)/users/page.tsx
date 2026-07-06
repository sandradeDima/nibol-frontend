import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { UserTable } from "@/modules/users/user-table";

export default async function UsersPage() {
  const authorization = await requirePermission("users.view");

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          authorization.permissions.includes("users.create") ? (
            <Link
              className="nibol-btn-primary"
              href="/users/new"
            >
              Nuevo usuario
            </Link>
          ) : null
        }
        description="Administre usuarios con el mismo motor de tablas, filtros y permisos reutilizable del resto del entorno corporativo."
        eyebrow="Directorio"
        title="Usuarios"
      />

      <UserTable />
    </main>
  );
}
