"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { QUERY_KEYS } from "@/lib/constants";
import { observationService } from "@/services/observation-service";
import type { ExtensionRequestTableRow } from "@/types";
import { cn } from "@/utils";

import { formatObservationDate, getRiskLevelClasses } from "../observations/presentation";
import {
  formatExtensionRequestDate,
  getExtensionRequestStatusClasses,
  getExtensionRequestStatusLabel,
} from "./presentation";

const extensionRequestColumns: ColumnDef<ExtensionRequestTableRow>[] = [
  {
    accessorKey: "observation.code",
    cell: ({ row }) => (
      <div className="min-w-[16rem] space-y-1">
        <p className="text-sm font-semibold tracking-[0.08em] text-stone-900">
          {row.original.observation.code}
        </p>
        <p className="text-sm text-stone-700">{row.original.observation.title}</p>
        {row.original.commitment ? (
          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
            Compromiso: {row.original.commitment.title}
          </p>
        ) : null}
      </div>
    ),
    header: "Código observación",
  },
  {
    accessorKey: "area",
    cell: ({ row }) => <span className="text-stone-700">{row.original.area.name}</span>,
    enableSorting: false,
    header: "Área",
  },
  {
    accessorKey: "requestedByUser",
    cell: ({ row }) => (
      <span className="text-stone-700">{row.original.requestedByUser.name}</span>
    ),
    enableSorting: false,
    header: "Solicitante",
  },
  {
    accessorKey: "observation.riskLevel",
    cell: ({ row }) => (
      <span
        className={cn(
          "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
          getRiskLevelClasses(row.original.observation.riskLevel.colorToken),
        )}
      >
        {row.original.observation.riskLevel.name}
      </span>
    ),
    enableSorting: false,
    header: "Riesgo",
  },
  {
    accessorKey: "currentDueDate",
    cell: ({ row }) => (
      <span
        className={cn(
          "whitespace-nowrap",
          row.original.isOverdue ? "text-rose-700" : "text-stone-700",
        )}
      >
        {formatExtensionRequestDate(row.original.currentDueDate)}
      </span>
    ),
    header: "Fecha actual",
  },
  {
    accessorKey: "requestedDueDate",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatExtensionRequestDate(row.original.requestedDueDate)}
      </span>
    ),
    header: "Nueva fecha",
  },
  {
    accessorKey: "impactDays",
    cell: ({ row }) => (
      <span className="font-semibold text-stone-800">+{row.original.impactDays} días</span>
    ),
    header: "Impacto",
  },
  {
    accessorKey: "status",
    cell: ({ row }) => (
      <span
        className={cn(
          "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
          getExtensionRequestStatusClasses(row.original.status),
        )}
      >
        {getExtensionRequestStatusLabel(row.original.status)}
      </span>
    ),
    header: "Estado",
  },
  {
    accessorKey: "updatedAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatObservationDate(row.original.updatedAt, {
          timeStyle: "short",
        })}
      </span>
    ),
    header: "Última actualización",
  },
];

const statusOptions = [
  { label: "Borrador", value: "DRAFT" },
  { label: "En revisión de Gerencia", value: "SENT_TO_MANAGER" },
  { label: "Aprobada por Gerencia", value: "MANAGER_APPROVED" },
  { label: "Rechazada por Gerencia", value: "MANAGER_REJECTED" },
  { label: "En revisión de Auditoría", value: "SENT_TO_AUDIT" },
  { label: "Aprobada", value: "AUDIT_APPROVED" },
  { label: "Rechazada por Auditoría", value: "AUDIT_REJECTED" },
  { label: "Cancelada", value: "CANCELLED" },
] as const;

export function ExtensionRequestTable() {
  const optionsQuery = useQuery({
    queryFn: observationService.getObservationOptions,
    queryKey: QUERY_KEYS.configurationBootstrap,
    staleTime: 60_000,
  });

  const tableConfig: DataTableConfig<ExtensionRequestTableRow> = {
    columns: extensionRequestColumns,
    defaultSort: {
      desc: true,
      id: "updatedAt",
    },
    emptyState: {
      description:
        "Cuando las áreas registren solicitudes de ampliación, aparecerán aquí con su trazabilidad y estado de aprobación.",
      title: "No hay ampliaciones para esta vista",
    },
    filters: [
      {
        id: "status",
        label: "Estado",
        options: [...statusOptions],
        placeholder: "Todos los estados",
        type: "select",
      },
      {
        id: "areaId",
        label: "Área",
        options: (optionsQuery.data?.areas ?? []).map((area) => ({
          label: area.name,
          value: area.id,
        })),
        placeholder: "Todas las áreas",
        type: "select",
      },
      {
        id: "requestedByUserId",
        label: "Solicitante",
        options: (optionsQuery.data?.users ?? []).map((user) => ({
          label: user.name,
          value: user.id,
        })),
        placeholder: "Todos los usuarios",
        type: "select",
      },
      {
        id: "riskLevelId",
        label: "Riesgo",
        options: (optionsQuery.data?.riskLevels ?? []).map((riskLevel) => ({
          label: riskLevel.name,
          value: riskLevel.id,
        })),
        placeholder: "Todos los niveles",
        type: "select",
      },
      {
        id: "requestedDateFrom",
        label: "Solicitada desde",
        type: "date",
      },
      {
        id: "requestedDateTo",
        label: "Solicitada hasta",
        type: "date",
      },
      {
        id: "pendingMine",
        label: "Pendientes de mi revisión",
        options: [
          { label: "Sí", value: "true" },
          { label: "No", value: "false" },
        ],
        placeholder: "Todas",
        type: "select",
      },
      {
        id: "overdue",
        label: "Vencidas",
        options: [
          { label: "Sí", value: "true" },
          { label: "No", value: "false" },
        ],
        placeholder: "Todas",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: [...QUERY_KEYS.extensionRequests, "table"],
    rowActions: [
      {
        href: (row) => `/ampliaciones-plazo/${row.id}`,
        icon: Eye,
        id: "view",
        label: "Ver detalle",
        variant: "view",
      },
    ],
    searchPlaceholder: "Buscar por código, área, solicitante o compromiso",
  };

  if (optionsQuery.isError) {
    tableConfig.filters = tableConfig.filters?.filter((filter) =>
      ["pendingMine", "requestedDateFrom", "requestedDateTo", "status", "overdue"].includes(
        filter.id,
      ),
    );
  }

  return <DataTable config={tableConfig} endpoint="/extension-requests" />;
}
