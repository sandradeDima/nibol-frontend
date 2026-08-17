import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { ObservationCatalogPage } from "@/modules/configuration/observation-catalog-page";

export default async function RisksPage() {
  await requirePermission("risks.view");
  return (
    <main className="space-y-6">
      <PageHeader
        description="Mantenga el catálogo multi-selección de riesgos asociados a los hallazgos."
        eyebrow="Administración"
        title="Riesgos asociados"
      />
      <ObservationCatalogPage kind="risks" />
    </main>
  );
}
