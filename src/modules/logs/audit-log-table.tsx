"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { QUERY_KEYS } from "@/lib/constants";
import { userService } from "@/services/user-service";
import type { AuditLogTableRow } from "@/types";

import { formatLogDateTime, summarizeLogValue } from "./log-formatters";

const AUDIT_ACTION_OPTIONS = [
  { label: "Actualizado", value: "Updated" },
  { label: "Creado", value: "Created" },
  { label: "Eliminado", value: "Deleted" },
] as const;
const AUDIT_ENTITY_OPTIONS = [
  { label: "Configuracion", value: "setting" },
  { label: "Invitacion", value: "invitation" },
  { label: "Rol", value: "role" },
  { label: "Usuario", value: "user" },
] as const;

const auditActionLabels = new Map<string, string>(
  AUDIT_ACTION_OPTIONS.map((option) => [option.value, option.label]),
);

const auditEntityLabels = new Map<string, string>(
  AUDIT_ENTITY_OPTIONS.map((option) => [option.value, option.label]),
);

const auditLogColumns: ColumnDef<AuditLogTableRow>[] = [
  {
    accessorKey: "createdAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatLogDateTime(row.original.createdAt)}
      </span>
    ),
    header: "Fecha",
  },
  {
    accessorKey: "action",
    cell: ({ row }) => (
      <span className="inline-flex rounded-full bg-stone-950 px-3 py-1 text-xs font-semibold text-amber-100">
        {auditActionLabels.get(row.original.action) ?? row.original.action}
      </span>
    ),
    header: "Accion",
  },
  {
    accessorKey: "changedBy.name",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-stone-900">{row.original.changedBy?.name ?? "Sistema"}</p>
        <p className="text-sm text-stone-500">
          {row.original.changedBy?.email ?? "Cambio automatico"}
        </p>
      </div>
    ),
    enableSorting: false,
    header: "Responsable",
  },
  {
    accessorKey: "entityId",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-stone-900">
          {auditEntityLabels.get(row.original.entityType.toLowerCase()) ??
            row.original.entityType}
        </p>
        <p className="font-mono text-xs text-stone-500">
          {row.original.entityId ?? "Sin identificador"}
        </p>
      </div>
    ),
    header: "Entidad",
  },
  {
    accessorKey: "oldValues",
    cell: ({ row }) => (
      <p className="max-w-[18rem] text-sm leading-6 text-stone-600">
        {summarizeLogValue(row.original.oldValues)}
      </p>
    ),
    enableSorting: false,
    header: "Antes",
  },
  {
    accessorKey: "newValues",
    cell: ({ row }) => (
      <p className="max-w-[18rem] text-sm leading-6 text-stone-600">
        {summarizeLogValue(row.original.newValues)}
      </p>
    ),
    enableSorting: false,
    header: "Despues",
  },
];

export function AuditLogTable() {
  const usersQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: QUERY_KEYS.auditLogUsers,
    staleTime: 60_000,
  });

  const auditLogTableConfig: DataTableConfig<AuditLogTableRow> = {
    columns: auditLogColumns,
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "No se encontraron cambios auditados para los filtros actuales. Pruebe limpiar el rango de fechas o la accion.",
      title: "No hay auditorias para esta vista",
    },
    enableSelection: false,
    filters: [
      {
        id: "dateFrom",
        label: "Desde",
        type: "date",
      },
      {
        id: "dateTo",
        label: "Hasta",
        type: "date",
      },
      {
        id: "userId",
        label: "Usuario",
        options: (usersQuery.data ?? []).map((user) => ({
          label: `${user.name} (${user.email})`,
          value: user.id,
        })),
        placeholder: "Todos los usuarios",
        type: "select",
      },
      {
        id: "entityType",
        label: "Entidad",
        options: AUDIT_ENTITY_OPTIONS.map((entityType) => ({
          label: entityType.label,
          value: entityType.value,
        })),
        placeholder: "Todas las entidades",
        type: "select",
      },
      {
        id: "action",
        label: "Accion",
        options: AUDIT_ACTION_OPTIONS.map((action) => ({
          label: action.label,
          value: action.value,
        })),
        placeholder: "Todas las acciones",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: ["audit-logs", "table"],
    searchPlaceholder: "Buscar por entidad, registro o usuario responsable",
  };

  return <DataTable config={auditLogTableConfig} endpoint="/audit-logs" />;
}
