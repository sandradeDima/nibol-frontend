import { requirePermission } from "@/lib/server-auth";
import { VigentesVencidas } from "@/modules/reports/vigentes-vencidas";

export default async function VigentesVencidasPage() {
  const authorization = await requirePermission("reports.view");

  return (
    <VigentesVencidas
      canExport={
        authorization.isAdmin ||
        authorization.permissions.includes("reports.export")
      }
    />
  );
}
