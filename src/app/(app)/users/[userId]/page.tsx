import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { UserDetail } from "@/modules/users/user-detail";

type UserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  await requirePermission("users.view");

  const { userId } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Revise metadatos de la cuenta, roles asignados, estado y acciones de ciclo de vida desde el mismo modulo administrativo."
        eyebrow="Ficha de usuario"
        title="Detalle del usuario"
      />

      <UserDetail userId={userId} />
    </main>
  );
}
