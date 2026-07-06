import { requirePermission } from "@/lib/server-auth";
import { RiskLevelsPage } from "@/modules/configuration/risk-levels-page";

export default async function NivelesRiesgoPage() {
  const authorization = await requirePermission("risk_levels.view");

  return (
    <RiskLevelsPage
      canCreate={authorization.permissions.includes("risk_levels.create")}
      canDelete={authorization.permissions.includes("risk_levels.delete")}
      canEdit={authorization.permissions.includes("risk_levels.edit")}
    />
  );
}
