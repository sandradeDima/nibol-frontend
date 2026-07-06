"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";

import {
  PRODUCTS_API_ENDPOINT,
  PRODUCTS_QUERY_KEYS,
  PRODUCTS_ROUTES,
} from "../constants";
import { useProducts } from "../hooks/useProducts";
import type { ProductRecord } from "../types";

const formatDate = (value: string): string => {
  return format(new Date(value), "MMM d, yyyy");
};

const productColumns: ColumnDef<ProductRecord>[] = [
  {
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="min-w-[14rem] space-y-1">
        <p className="font-semibold text-stone-950">{row.original.name}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          {row.original.isActive ? "Registro activo" : "Registro inactivo"}
        </p>
      </div>
    ),
    header: "Nombre",
  },
  {
    accessorKey: "description",
    cell: ({ row }) => (
      <span className="text-sm text-stone-700">
        {row.original.description || "Sin descripcion registrada."}
      </span>
    ),
    enableSorting: false,
    header: "Descripcion",
  },
  {
    accessorKey: "isActive",
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          row.original.isActive
            ? "bg-emerald-100 text-emerald-800"
            : "bg-stone-200 text-stone-700"
        }`}
      >
        {row.original.isActive ? "Activo" : "Inactivo"}
      </span>
    ),
    header: "Estado",
  },
  {
    accessorKey: "updatedAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatDate(row.original.updatedAt)}
      </span>
    ),
    header: "Actualizado",
  },
  {
    accessorKey: "createdAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatDate(row.original.createdAt)}
      </span>
    ),
    header: "Creado",
  },
];

export function ProductTable() {
  const { useDeleteProduct } = useProducts();
  const deleteMutation = useDeleteProduct();

  const tableConfig: DataTableConfig<ProductRecord> = {
    columns: productColumns,
    csv: {
      columns: [
        {
          header: "Nombre",
          key: "name",
          value: (row) => row.name,
        },
        {
          header: "Descripcion",
          key: "description",
          value: (row) => row.description ?? "",
        },
        {
          header: "Estado",
          key: "status",
          value: (row) => (row.isActive ? "Activo" : "Inactivo"),
        },
        {
          header: "Actualizado",
          key: "updatedAt",
          value: (row) => row.updatedAt,
        },
      ],
      fileName: "productos.csv",
    },
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "Pruebe ampliar la busqueda, limpiar filtros o registrar el primer producto del catalogo.",
      title: "No hay registros para esta vista",
    },
    filters: [
      {
        id: "isActive",
        label: "Estado",
        options: [
          {
            label: "Activo",
            value: "true",
          },
          {
            label: "Inactivo",
            value: "false",
          },
        ],
        placeholder: "Todos los estados",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: PRODUCTS_QUERY_KEYS.table,
    rowActions: [
      {
        href: (row) => PRODUCTS_ROUTES.view(row.id),
        icon: Eye,
        id: "view",
        label: "Ver",
        variant: "view",
      },
      {
        href: (row) => PRODUCTS_ROUTES.edit(row.id),
        icon: Pencil,
        id: "edit",
        label: "Editar",
        variant: "edit",
      },
      {
        confirmation: {
          confirmLabel: "Eliminar registro",
          description: (rows) =>
            `Eliminar ${rows[0]?.name ?? "este registro"} de las vistas activas? La trazabilidad quedara preservada mediante borrado logico.`,
          title: "Eliminar registro?",
          tone: "danger",
        },
        icon: Trash2,
        id: "delete",
        invalidateAfterSuccess: true,
        label: "Eliminar",
        onClick: async (row) => {
          await deleteMutation.mutateAsync(row.id);
        },
        tone: "danger",
        variant: "delete",
      },
    ],
    searchPlaceholder: "Buscar por nombre o descripcion",
  };

  return <DataTable config={tableConfig} endpoint={PRODUCTS_API_ENDPOINT} />;
}
