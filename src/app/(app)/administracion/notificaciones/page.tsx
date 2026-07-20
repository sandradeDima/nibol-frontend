import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { AutomaticNotificationAdmin } from "@/modules/notifications/automatic-notification-admin";
import { getServerAuthorization } from "@/lib/server-auth";

export default async function AutomaticNotificationsPage() {
  const authorization = await getServerAuthorization();
  const canAccess = Boolean(
    authorization?.isAdmin || authorization?.roles.some((role) => /^(sistemas?|systems?)$/i.test(role)),
  );
  if (!canAccess) redirect("/forbidden?missing=automatic_jobs.view");

  return <main className="space-y-6"><PageHeader description="Configure recordatorios, canales y revisiones del proceso que monitorea vencimientos." eyebrow="Administración" title="Notificaciones automáticas" /><AutomaticNotificationAdmin canExecute={canAccess} /></main>;
}
