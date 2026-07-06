"use client";

import Link from "next/link";

import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

import {
  PRODUCTS_ROUTES,
} from "../constants";
import { useProducts } from "../hooks/useProducts";

type ProductViewPageProps = {
  productId: string;
};

const sectionClassName =
  "nibol-panel p-6";

export default function ProductViewPage({
  productId,
}: ProductViewPageProps) {
  const { useProduct } = useProducts();
  const productQuery = useProduct(productId);

  if (productQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void productQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={productQuery.error.message}
        title="No fue posible cargar el producto"
      />
    );
  }

  if (productQuery.isLoading || !productQuery.data) {
    return (
      <section className={sectionClassName}>
        <p className="text-sm text-stone-500">Cargando detalle del producto...</p>
      </section>
    );
  }

  const record = productQuery.data;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <Link
            className="nibol-btn-primary"
            href={PRODUCTS_ROUTES.edit(record.id)}
          >
            Editar producto
          </Link>
        }
        description="Revise la informacion maestra del producto dentro del mismo entorno administrativo con control de permisos."
        eyebrow="Ficha de producto"
        title="Detalle del producto"
      />

      <section className={sectionClassName}>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Nombre
            </dt>
            <dd className="text-lg font-semibold text-stone-950">{record.name}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Estado
            </dt>
            <dd className="text-sm text-stone-700">
              {record.isActive ? "Activo" : "Inactivo"}
            </dd>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Descripcion
            </dt>
            <dd className="text-sm leading-7 text-stone-700">
              {record.description || "Sin descripcion registrada."}
            </dd>
          </div>
          <div className="space-y-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Creado
            </dt>
            <dd className="text-sm text-stone-700">{record.createdAt}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Actualizado
            </dt>
            <dd className="text-sm text-stone-700">{record.updatedAt}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
