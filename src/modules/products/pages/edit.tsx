import { PageHeader } from "@/components/ui/page-header";

import { ProductForm } from "../components/ProductForm";

type EditProductPageProps = {
  productId: string;
};

export default function EditProductPage({
  productId,
}: EditProductPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Actualice la informacion del producto con el mismo contrato de datos y resguardos de acceso del flujo de alta."
        eyebrow="Catalogo"
        title="Editar producto"
      />

      <ProductForm mode="edit" productId={productId} />
    </main>
  );
}
