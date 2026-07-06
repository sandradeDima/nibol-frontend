import { requirePermission } from "@/lib/server-auth";
import { ObservationStatusesPage } from "@/modules/configuration/observation-statuses-page";

export default async function EstadosObservacionPage() {
  const authorization = await requirePermission("observation_statuses.view");

  return (
    <ObservationStatusesPage
      canCreate={authorization.permissions.includes("observation_statuses.create")}
      canDelete={authorization.permissions.includes("observation_statuses.delete")}
      canEdit={authorization.permissions.includes("observation_statuses.edit")}
    />
  );
}
