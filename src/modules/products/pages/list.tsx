import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";

import {
  PRODUCTS_ROUTES,
} from "../constants";
import { ProductTable } from "../components/ProductTable";

type ProductsListPageProps = {
  canCreate: boolean;
};

export default function ProductsListPage({
  canCreate,
}: ProductsListPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          canCreate ? (
            <Link
              className="nibol-btn-primary"
              href={PRODUCTS_ROUTES.create}
            >
              Nuevo producto
            </Link>
          ) : null
        }
        description="Administre el catalogo de productos con busqueda, filtros, paginacion y acciones reutilizables."
        eyebrow="Catalogo"
        title="Productos"
      />

      <ProductTable />
    </main>
  );
}
