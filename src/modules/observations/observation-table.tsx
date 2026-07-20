"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { QUERY_KEYS } from "@/lib/constants";
import { observationService } from "@/services/observation-service";
import type { ObservationTableRow } from "@/types";
import { cn } from "@/utils";

import {
  formatObservationDate,
  getRiskLevelClasses,
  getStatusClasses,
} from "./presentation";

type ObservationTableProps = {
  canDelete: boolean;
  canEdit: boolean;
};

const observationColumns: ColumnDef<ObservationTableRow>[] = [
  {
    accessorKey: "code",
    cell: ({ row }) => (
      <span className="text-sm font-semibold tracking-[0.08em] text-stone-900">
        {row.original.code}
      </span>
    ),
    header: "Codigo",
  },
  {
    accessorKey: "title",
    cell: ({ row }) => (
      <div className="min-w-[20rem] space-y-1">
        <p className="font-semibold text-stone-950">{row.original.title}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          {row.original.currentStage || "Sin etapa definida"}
        </p>
      </div>
    ),
    header: "Titulo",
  },
  {
    accessorKey: "area",
    cell: ({ row }) => <span className="text-stone-700">{row.original.area.name}</span>,
    enableSorting: false,
    header: "Area",
  },
  {
    accessorKey: "responsibleUser",
    cell: ({ row }) => (
      <span className="text-stone-700">
        {row.original.responsibleUser?.name ?? "Sin asignar"}
      </span>
    ),
    enableSorting: false,
    header: "Responsable",
  },
  {
    accessorKey: "riskLevel",
    cell: ({ row }) => (
      <span
        className={cn(
          "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
          getRiskLevelClasses(row.original.riskLevel.colorToken),
        )}
      >
        {row.original.riskLevel.name}
      </span>
    ),
    enableSorting: false,
    header: "Riesgo",
  },
  {
    accessorKey: "dueDate",
    cell: ({ row }) => (
      <span className={cn("whitespace-nowrap", row.original.isOverdue ? "text-rose-700" : "text-stone-700")}>
        {formatObservationDate(row.original.dueDate)}
      </span>
    ),
    header: "Fecha limite",
  },
  {
    accessorKey: "effectiveStatus",
    cell: ({ row }) => (
      <span
        className={cn(
          "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
          getStatusClasses(row.original.effectiveStatus.key),
        )}
      >
        {row.original.effectiveStatus.name}
      </span>
    ),
    enableSorting: false,
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
    header: "Ultima actualizacion",
  },
  {
    accessorKey: "progressPercent",
    cell: ({ row }) => (
      <div className="min-w-[10rem] space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full bg-[var(--primary)] transition-[width]"
            style={{
              width: `${row.original.progressPercent}%`,
            }}
          />
        </div>
        <span className="text-xs font-semibold text-stone-700">
          {row.original.progressPercent}%
        </span>
      </div>
    ),
    header: "% Avance",
  },
];

export function ObservationTable({ canDelete, canEdit }: ObservationTableProps) {
  const searchParams = useSearchParams();
  const optionsQuery = useQuery({
    queryFn: observationService.getObservationOptions,
    queryKey: QUERY_KEYS.configurationBootstrap,
    staleTime: 60_000,
  });

  const defaultAreaId = searchParams.get("filter.areaId") ?? undefined;
  const defaultDueDateFrom = searchParams.get("filter.dueDateFrom") ?? undefined;
  const defaultDueDateTo = searchParams.get("filter.dueDateTo") ?? undefined;
  const defaultOverdue = searchParams.get("filter.overdue") ?? undefined;
  const defaultResponsibleUserId =
    searchParams.get("filter.responsibleUserId") ?? undefined;
  const defaultRiskLevelId = searchParams.get("filter.riskLevelId") ?? undefined;
  const defaultStatusId = searchParams.get("filter.statusId") ?? undefined;

  const observationTableConfig: DataTableConfig<ObservationTableRow> = {
    columns: observationColumns,
    defaultSort: {
      desc: true,
      id: "updatedAt",
    },
    emptyState: {
      description:
        "Ajuste filtros, limpie la busqueda o registre una nueva observacion para comenzar el seguimiento.",
      title: "No hay observaciones para esta vista",
    },
    filters: [
      {
        id: "responsibleUserId",
        label: "Responsable",
        defaultValue: defaultResponsibleUserId,
        options: (optionsQuery.data?.users ?? []).map((user) => ({
          label: user.name,
          value: user.id,
        })),
        placeholder: "Todos los responsables",
        type: "select",
      },
      {
        id: "riskLevelId",
        label: "Riesgo",
        defaultValue: defaultRiskLevelId,
        options: (optionsQuery.data?.riskLevels ?? []).map((riskLevel) => ({
          label: riskLevel.name,
          value: riskLevel.id,
        })),
        placeholder: "Todos los niveles",
        type: "select",
      },
      {
        id: "statusId",
        label: "Estado",
        defaultValue: defaultStatusId,
        options: (optionsQuery.data?.statuses ?? []).map((status) => ({
          label: status.name,
          value: status.id,
        })),
        placeholder: "Todos los estados",
        type: "select",
      },
      {
        id: "areaId",
        label: "Area",
        defaultValue: defaultAreaId,
        options: (optionsQuery.data?.areas ?? []).map((area) => ({
          label: area.name,
          value: area.id,
        })),
        placeholder: "Todas las areas",
        type: "select",
      },
      {
        defaultValue: defaultDueDateFrom,
        id: "dueDateFrom",
        label: "Desde",
        type: "date",
      },
      {
        defaultValue: defaultDueDateTo,
        id: "dueDateTo",
        label: "Hasta",
        type: "date",
      },
      {
        defaultValue: defaultOverdue,
        id: "overdue",
        label: "Vencidas",
        options: [
          { label: "Solo vencidas", value: "true" },
          { label: "Ocultar vencidas", value: "false" },
        ],
        placeholder: "Todas",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: ["observations", "table"],
    rowActions: [
      {
        href: (row) => `/observaciones/${row.id}`,
        icon: Eye,
        id: "view",
        label: "Ver detalle",
        variant: "view",
      },
      {
        hidden: () => !canEdit,
        href: (row) => `/observaciones/${row.id}/editar`,
        icon: Pencil,
        id: "edit",
        label: "Editar",
        variant: "edit",
      },
      {
        confirmation: {
          confirmLabel: "Eliminar observacion",
          description: (rows) =>
            `Eliminar ${rows[0]?.code ?? "esta observacion"} mediante borrado logico? La trazabilidad de auditoria permanecera disponible.`,
          title: "Eliminar observacion?",
          tone: "danger",
        },
        hidden: () => !canDelete,
        icon: Trash2,
        id: "delete",
        invalidateAfterSuccess: true,
        label: "Eliminar",
        onClick: async (row) => {
          await observationService.deleteObservation(row.id);
        },
        tone: "danger",
        variant: "delete",
      },
    ],
    searchPlaceholder: "Buscar por codigo o titulo",
  };

  if (optionsQuery.isError) {
    observationTableConfig.filters = [];
  }

  return <DataTable config={observationTableConfig} endpoint="/observations" />;
}
