import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { AutomaticNotificationAdmin } from "@/modules/notifications/automatic-notification-admin";
import { getServerAuthorization } from "@/lib/server-auth";

export default async function AutomaticNotificationsPage() {
  const authorization = await getServerAuthorization();
  const canView = Boolean(
    authorization?.permissions.includes("automatic_jobs.view"),
  );
  if (!canView) redirect("/forbidden?missing=automatic_jobs.view");
  const canEdit = Boolean(
    authorization?.permissions.includes("automatic_jobs.edit"),
  );

  return (
    <main className="space-y-6">
      <PageHeader
        description="Configure recordatorios, canales y revisiones del proceso que monitorea vencimientos."
        eyebrow="Administración"
        title="Notificaciones automáticas"
      />
      <AutomaticNotificationAdmin canExecute={canEdit} />
    </main>
  );
}
