import { PageHeader } from "@/components/ui/page-header";
import { requireAuth } from "@/lib/server-auth";
import { ProfileSettings } from "@/modules/users/profile-settings";

export default async function ProfilePage() {
  await requireAuth();

  return (
    <main className="space-y-6">
      <PageHeader
        description="Administre su perfil personal, credenciales y avatar dentro del shell administrativo compartido."
        eyebrow="Cuenta"
        title="Perfil"
      />

      <ProfileSettings />
    </main>
  );
}
