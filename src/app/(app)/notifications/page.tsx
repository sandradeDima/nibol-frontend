import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { NotificationCenter } from "@/modules/notifications/notification-center";

export default async function NotificationsPage() {
  const authorization = await requirePermission("notifications.view");
  const canCreate = authorization.permissions.includes("notifications.create");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Centralice alertas internas, pendientes de lectura y flujos reutilizables de comunicacion desde una sola bandeja."
        eyebrow="Centro de alertas"
        title="Notificaciones"
      />

      <NotificationCenter canCreate={canCreate} />
    </main>
  );
}
