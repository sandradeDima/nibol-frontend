import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { RoleDetail } from "@/modules/roles/role-detail";

type RoleDetailPageProps = {
  params: Promise<{
    roleId: string;
  }>;
};

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  await requirePermission("roles.view");

  const { roleId } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Revise permisos asignados, metadatos y resguardos especiales del perfil dentro del modulo de roles."
        eyebrow="Ficha de rol"
        title="Detalle del rol"
      />

      <RoleDetail roleId={roleId} />
    </main>
  );
}
