import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { ObservationCatalogPage } from "@/modules/configuration/observation-catalog-page";

export default async function ObservationDictionaryPage() {
  await requirePermission("observation_dictionary.view");
  return (
    <main className="space-y-6">
      <PageHeader
        description="Defina las observaciones principales reutilizables en los informes de Auditoría."
        eyebrow="Administración"
        title="Diccionario de observaciones"
      />
      <ObservationCatalogPage kind="observation-dictionary" />
    </main>
  );
}
