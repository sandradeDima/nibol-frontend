"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { QUERY_KEYS } from "@/lib/constants";
import { userService } from "@/services/user-service";
import type { ActivityLogTableRow } from "@/types";

import { formatLogDateTime, summarizeLogValue } from "./log-formatters";

const ACTIVITY_ACTION_OPTIONS = [
  { label: "Asignacion de rol", value: "Role assigned" },
  { label: "Cambio de permisos", value: "Permission changed" },
  { label: "Cierre de sesion exitoso", value: "Logout success" },
  { label: "Configuracion actualizada", value: "Settings updated" },
  { label: "Fallo de inicio de sesion", value: "Login failure" },
  { label: "Inicio de sesion exitoso", value: "Login success" },
  { label: "Invitacion aceptada", value: "Invitation accepted" },
  { label: "Invitacion enviada", value: "Invitation sent" },
  { label: "Invitacion reenviada", value: "Invitation resent" },
  { label: "Invitacion revocada", value: "Invitation revoked" },
  { label: "Rol actualizado", value: "Role updated" },
  { label: "Rol cambiado", value: "Role changed" },
  { label: "Rol creado", value: "Role created" },
  { label: "Rol eliminado", value: "Role deleted" },
  { label: "Usuario actualizado", value: "User updated" },
  { label: "Usuario creado", value: "User created" },
  { label: "Usuario deshabilitado", value: "User disabled" },
  { label: "Usuario eliminado", value: "User deleted" },
  { label: "Usuario habilitado", value: "User enabled" },
] as const;

const ACTIVITY_ENTITY_OPTIONS = [
  { label: "Autenticacion", value: "authentication" },
  { label: "Configuracion", value: "setting" },
  { label: "Invitacion", value: "invitation" },
  { label: "Rol", value: "role" },
  { label: "Usuario", value: "user" },
] as const;

const activityActionLabels = new Map<string, string>(
  ACTIVITY_ACTION_OPTIONS.map((option) => [option.value, option.label]),
);

const activityEntityLabels = new Map<string, string>(
  ACTIVITY_ENTITY_OPTIONS.map((option) => [option.value, option.label]),
);

const activityLogColumns: ColumnDef<ActivityLogTableRow>[] = [
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
      <div className="min-w-[12rem] space-y-1">
        <p className="font-semibold text-stone-950">
          {activityActionLabels.get(row.original.action) ?? row.original.action}
        </p>
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          {activityEntityLabels.get(row.original.entityType.toLowerCase()) ??
            row.original.entityType}
        </p>
      </div>
    ),
    header: "Accion",
  },
  {
    accessorKey: "user.name",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-stone-900">{row.original.user?.name ?? "Sistema"}</p>
        <p className="text-sm text-stone-500">
          {row.original.user?.email ?? "Evento automatico"}
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
          {activityEntityLabels.get(row.original.entityType.toLowerCase()) ??
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
    accessorKey: "metadata",
    cell: ({ row }) => (
      <p className="max-w-[28rem] text-sm leading-6 text-stone-600">
        {summarizeLogValue(row.original.metadata)}
      </p>
    ),
    enableSorting: false,
    header: "Detalle",
  },
  {
    accessorKey: "ipAddress",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-stone-600">
        {row.original.ipAddress ?? "Desconocida"}
      </span>
    ),
    header: "Direccion IP",
  },
];

export function ActivityLogTable() {
  const usersQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: QUERY_KEYS.activityLogUsers,
    staleTime: 60_000,
  });

  const activityLogTableConfig: DataTableConfig<ActivityLogTableRow> = {
    columns: activityLogColumns,
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "No se encontraron eventos para los filtros actuales. Pruebe ampliar el rango de fechas o limpiar algun filtro.",
      title: "No hay actividad para esta vista",
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
        options: ACTIVITY_ENTITY_OPTIONS.map((entityType) => ({
          label: entityType.label,
          value: entityType.value,
        })),
        placeholder: "Todas las entidades",
        type: "select",
      },
      {
        id: "action",
        label: "Accion",
        options: ACTIVITY_ACTION_OPTIONS.map((action) => ({
          label: action.label,
          value: action.value,
        })),
        placeholder: "Todas las acciones",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: ["activity-logs", "table"],
    searchPlaceholder: "Buscar por accion, usuario, entidad o direccion IP",
  };

  return <DataTable config={activityLogTableConfig} endpoint="/activity-logs" />;
}
