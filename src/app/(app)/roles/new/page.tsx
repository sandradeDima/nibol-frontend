import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { RoleForm } from "@/modules/roles/role-form";

export default async function NewRolePage() {
  await requirePermission("roles.create");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Cree un perfil de acceso reutilizable con nombre validado, descripcion opcional y permisos definidos con claridad."
        eyebrow="Roles"
        title="Nuevo rol"
      />

      <RoleForm mode="create" />
    </main>
  );
}
