import { requirePermission } from "@/lib/server-auth";
import { SystemParametersPage } from "@/modules/configuration/system-parameters-page";

export default async function ParametrosPage() {
  const authorization = await requirePermission("system_parameters.view");

  return (
    <SystemParametersPage
      canCreate={authorization.permissions.includes("system_parameters.create")}
      canDelete={authorization.permissions.includes("system_parameters.delete")}
      canEdit={authorization.permissions.includes("system_parameters.edit")}
    />
  );
}
