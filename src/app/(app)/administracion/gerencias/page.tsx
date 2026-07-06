import { requirePermission } from "@/lib/server-auth";
import { AreasPage } from "@/modules/configuration/areas-page";

export default async function GerenciasPage() {
  const authorization = await requirePermission("areas.view");

  return (
    <AreasPage
      canCreate={authorization.permissions.includes("areas.create")}
      canDelete={authorization.permissions.includes("areas.delete")}
      canEdit={authorization.permissions.includes("areas.edit")}
    />
  );
}
