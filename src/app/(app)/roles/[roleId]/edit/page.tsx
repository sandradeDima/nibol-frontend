import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { RoleForm } from "@/modules/roles/role-form";

type EditRolePageProps = {
  params: Promise<{
    roleId: string;
  }>;
};

export default async function EditRolePage({ params }: EditRolePageProps) {
  await requirePermission("roles.edit");

  const { roleId } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Actualice el perfil del rol y su matriz de permisos respetando las reglas de proteccion para accesos criticos."
        eyebrow="Roles"
        title="Editar rol"
      />

      <RoleForm mode="edit" roleId={roleId} />
    </main>
  );
}
