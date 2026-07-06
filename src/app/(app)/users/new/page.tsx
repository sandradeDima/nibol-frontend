import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { UserForm } from "@/modules/users/user-form";

export default async function NewUserPage() {
  await requirePermission("users.create");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Cree un nuevo usuario con credenciales validadas, roles asignados y estado operativo dentro del mismo flujo corporativo."
        eyebrow="Usuarios"
        title="Nuevo usuario"
      />

      <UserForm mode="create" />
    </main>
  );
}
