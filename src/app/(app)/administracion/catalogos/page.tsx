import { requirePermission } from "@/lib/server-auth";
import { CatalogsPage } from "@/modules/configuration/catalogs-page";

export default async function CatalogosPage() {
  const authorization = await requirePermission("catalogs.view");

  return (
    <CatalogsPage
      canCreate={authorization.permissions.includes("catalogs.create")}
      canDelete={authorization.permissions.includes("catalogs.delete")}
      canEdit={authorization.permissions.includes("catalogs.edit")}
    />
  );
}
