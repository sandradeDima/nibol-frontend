"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, PackagePlus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { getApiErrorMessage } from "@/utils";

import {
  PRODUCTS_ROUTES,
} from "../constants";
import {
  productFormSchema,
  type ProductFormValues,
  useProducts,
} from "../hooks/useProducts";

type ProductFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      productId: string;
    };

const sectionClassName =
  "nibol-panel p-6";

export function ProductForm(props: ProductFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const { useProduct, useCreateProduct, useUpdateProduct } = useProducts();
  const editingId = props.mode === "edit" ? props.productId : "";
  const productQuery = useProduct(editingId);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const form = useForm<ProductFormValues>({
    defaultValues: {
      description: "",
      isActive: true,
      name: "",
    },
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
  });

  useEffect(() => {
    if (props.mode !== "edit" || !productQuery.data) {
      return;
    }

    form.reset({
      description: productQuery.data.description ?? "",
      isActive: productQuery.data.isActive,
      name: productQuery.data.name,
    });
  }, [form, props.mode, productQuery.data]);

  if (props.mode === "edit" && productQuery.isError) {
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

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    productQuery.isLoading;

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const record =
            props.mode === "create"
              ? await createMutation.mutateAsync(values)
              : await updateMutation.mutateAsync({
                  productId: props.productId,
                  values,
                });

          setSubmitError(null);
          setSubmitMessage(
            props.mode === "create"
              ? "Producto creado correctamente."
              : "Producto actualizado correctamente.",
          );

          router.push(PRODUCTS_ROUTES.view(record.id));
          router.refresh();
        } catch (error) {
          setSubmitMessage(null);
          setSubmitError(getApiErrorMessage(error));
        }
      })}
    >
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              {props.mode === "create" ? "Nuevo producto" : "Editar producto"}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {props.mode === "create"
                ? "Registrar producto"
                : `Actualizar ${productQuery.data?.name ?? "producto"}`}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              Mantenga el catalogo consistente con la misma validacion, trazabilidad y controles de permisos del resto del sistema.
            </p>
          </div>

          <Link
            className="nibol-btn-secondary px-4 py-2.5 text-sm"
            href={props.mode === "create" ? PRODUCTS_ROUTES.list : PRODUCTS_ROUTES.view(props.productId)}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Nombre</span>
            <input
              className="nibol-field h-auto py-3 disabled:opacity-70"
              disabled={isBusy}
              placeholder="Ingrese el nombre del producto"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <span className="text-sm text-rose-700">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </label>

          <label className="flex items-center justify-between gap-4 border border-stone-200/90 bg-white/85 px-4 py-4">
            <span className="space-y-1">
              <span className="block text-sm font-medium text-stone-700">Estado activo</span>
              <span className="block text-xs text-stone-500">
                Mantiene este producto visible en los listados operativos.
              </span>
            </span>
            <input
              className="h-5 w-5 rounded border-stone-300 text-amber-700 focus:ring-amber-300"
              disabled={isBusy}
              type="checkbox"
              {...form.register("isActive")}
            />
          </label>
        </div>

        <label className="mt-6 block space-y-2">
          <span className="text-sm font-medium text-stone-700">Descripcion</span>
          <textarea
            className="nibol-field min-h-40 h-auto py-3 disabled:opacity-70"
            disabled={isBusy}
            placeholder="Describa el uso o alcance del producto"
            {...form.register("description")}
          />
          {form.formState.errors.description ? (
            <span className="text-sm text-rose-700">
              {form.formState.errors.description.message}
            </span>
          ) : null}
        </label>
      </section>

      {submitError ? (
        <div className="rounded-[1.5rem] border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      {submitMessage ? (
        <div className="rounded-[1.5rem] border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {submitMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          className="nibol-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          type="submit"
        >
          {props.mode === "create" ? <PackagePlus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isBusy
            ? props.mode === "create"
              ? "Creando producto..."
              : "Guardando cambios..."
            : props.mode === "create"
              ? "Crear producto"
              : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
