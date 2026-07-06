import { PageHeader } from "@/components/ui/page-header";

import { ProductForm } from "../components/ProductForm";

export default function CreateProductPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Registre un producto con validacion compartida, trazabilidad y controles de permisos del entorno administrativo."
        eyebrow="Catalogo"
        title="Nuevo producto"
      />

      <ProductForm mode="create" />
    </main>
  );
}
