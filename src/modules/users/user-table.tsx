"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Copy,
  Eye,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { QUERY_KEYS } from "@/lib/constants";
import { userService } from "@/services/user-service";
import type { UserTableRow } from "@/types";

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Nunca";
  }

  return format(new Date(value), "MMM d, yyyy");
};

const userColumns: ColumnDef<UserTableRow>[] = [
  {
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="min-w-[14rem] space-y-1">
        <p className="font-semibold text-stone-950">{row.original.name}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          {row.original.roles.join(" • ") || "Sin roles asignados"}
        </p>
      </div>
    ),
    header: "Nombre",
  },
  {
    accessorKey: "email",
    cell: ({ row }) => <span className="text-stone-700">{row.original.email}</span>,
    header: "Email",
  },
  {
    accessorKey: "roles",
    cell: ({ row }) => (
      <span className="text-stone-700">{row.original.roles.join(", ") || "None"}</span>
    ),
    enableSorting: false,
    header: "Rol",
  },
  {
    accessorKey: "isActive",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
          row.original.isActive
            ? "border-[color:color-mix(in_srgb,var(--success)_18%,white)] bg-[var(--success-soft)] text-[var(--success)]"
            : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground-soft)]"
        }`}
      >
        {row.original.isActive ? "Activo" : "Inactivo"}
      </span>
    ),
    header: "Estado",
  },
  {
    accessorKey: "lastLoginAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatDate(row.original.lastLoginAt)}
      </span>
    ),
    header: "Ultimo acceso",
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

export function UserTable() {
  const rolesQuery = useQuery({
    queryFn: userService.getRoleOptions,
    queryKey: QUERY_KEYS.roleOptions,
    staleTime: 60_000,
  });

  const userTableConfig: DataTableConfig<UserTableRow> = {
    bulkActions: [
      {
        confirmation: {
          confirmLabel: "Eliminar seleccionados",
          description: (rows) =>
            `Se eliminaran logicamente ${rows.length} usuario${
              rows.length === 1 ? "" : "s"
            } seleccionado${rows.length === 1 ? "" : "s"}. Estos registros saldran de las vistas activas de inmediato.`,
          title: "Eliminar usuarios seleccionados?",
          tone: "danger",
        },
        icon: Trash2,
        id: "delete-selected",
        invalidateAfterSuccess: true,
        label: "Eliminar seleccionados",
        onClick: async (rows) => {
          await userService.bulkDeleteUsers(rows.map((row) => row.id));
        },
        tone: "danger",
        variant: "delete",
      },
    ],
    columns: userColumns,
    csv: {
      columns: [
        {
          header: "Nombre",
          key: "name",
          value: (row) => row.name,
        },
        {
          header: "Email",
          key: "email",
          value: (row) => row.email,
        },
        {
          header: "Roles",
          key: "roles",
          value: (row) => row.roles.join(", "),
        },
        {
          header: "Estado",
          key: "status",
          value: (row) => (row.isActive ? "Activo" : "Inactivo"),
        },
        {
          header: "Ultimo acceso",
          key: "lastLoginAt",
          value: (row) => row.lastLoginAt ?? "",
        },
        {
          header: "Creado",
          key: "createdAt",
          value: (row) => row.createdAt,
        },
      ],
      fileName: "usuarios.csv",
    },
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "Pruebe ampliar la busqueda, limpiar filtros o registrar un usuario para este modulo.",
      title: "No hay usuarios para esta vista",
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
      {
        id: "roles",
        label: "Rol",
        options: (rolesQuery.data ?? []).map((role) => ({
          label: role.name,
          value: role.name,
        })),
        placeholder: "Todos los roles",
        type: "multi-select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: ["users", "table"],
    rowActions: [
      {
        href: (row) => `/users/${row.id}`,
        icon: Eye,
        id: "view",
        label: "Ver",
        variant: "view",
      },
      {
        href: (row) => `/users/${row.id}/edit`,
        icon: Pencil,
        id: "edit",
        label: "Editar",
        variant: "edit",
      },
      {
        confirmation: {
          confirmLabel: "Guardar estado",
          description: (rows) =>
            rows[0]?.isActive
              ? `Deshabilitar a ${rows[0]?.name ?? "este usuario"} y retirar su acceso activo hasta que un administrador lo rehabilite.`
              : `Habilitar a ${rows[0]?.name ?? "este usuario"} y restaurar su acceso operativo de inmediato.`,
          title: "Cambiar estado del usuario?",
        },
        icon: Power,
        id: "toggle-active",
        invalidateAfterSuccess: true,
        label: "Cambiar estado",
        onClick: async (row) => {
          if (row.isActive) {
            await userService.disableUser(row.id);
            return;
          }

          await userService.enableUser(row.id);
        },
        variant: "custom",
      },
      {
        confirmation: {
          confirmLabel: "Eliminar usuario",
          description: (rows) =>
            `Eliminar a ${rows[0]?.name ?? "este usuario"} de los registros activos? La trazabilidad quedara preservada mediante borrado logico.`,
          title: "Eliminar usuario?",
          tone: "danger",
        },
        icon: Trash2,
        id: "delete",
        invalidateAfterSuccess: true,
        label: "Eliminar",
        onClick: async (row) => {
          await userService.deleteUser(row.id);
        },
        tone: "danger",
        variant: "delete",
      },
      {
        icon: Copy,
        id: "copy-email",
        label: "Copiar correo",
        onClick: async (row) => {
          await navigator.clipboard.writeText(row.email);
        },
        variant: "custom",
      },
    ],
    searchPlaceholder: "Buscar por nombre o correo",
  };

  if (rolesQuery.isError) {
    userTableConfig.filters = userTableConfig.filters?.filter((filter) => filter.id !== "roles");
  }

  return <DataTable config={userTableConfig} endpoint="/users" />;
}
