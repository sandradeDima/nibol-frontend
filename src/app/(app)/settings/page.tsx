import { hasPermission } from "@/lib/permissions";
import { requirePermission } from "@/lib/server-auth";
import { SettingsPageContent } from "@/modules/settings/settings-page";

export default async function SettingsPage() {
  const authorization = await requirePermission("settings.view");
  const canEdit =
    authorization.isAdmin && hasPermission(authorization.permissions, "settings.edit");

  return (
    <main className="space-y-6">
      <SettingsPageContent canEdit={canEdit} />
    </main>
  );
}
