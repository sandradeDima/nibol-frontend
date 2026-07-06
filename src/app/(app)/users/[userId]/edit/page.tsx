import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { UserForm } from "@/modules/users/user-form";

type EditUserPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  await requirePermission("users.edit");

  const { userId } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Actualice datos de la cuenta, roles asignados y estado activo con el mismo contrato de validacion del flujo de alta."
        eyebrow="Usuarios"
        title="Editar usuario"
      />

      <UserForm mode="edit" userId={userId} />
    </main>
  );
}
