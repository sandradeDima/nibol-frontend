"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Eye, Send } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { QUERY_KEYS } from "@/lib/constants";
import { observationService } from "@/services/observation-service";
import { progressService } from "@/services/progress-service";
import type { ProgressUpdateTableRow } from "@/types";
import { cn } from "@/utils";

import { getRiskLevelClasses } from "../observations/presentation";
import {
  formatProgressDate,
  getProgressStatusClasses,
  getProgressStatusLabel,
  getProgressTypeClasses,
  getProgressTypeLabel,
} from "./presentation";

const progressUpdateColumns: ColumnDef<ProgressUpdateTableRow>[] = [
  {
    accessorKey: "observation",
    cell: ({ row }) => (
      <div className="min-w-[18rem] space-y-1">
        <p className="font-semibold text-stone-950">{row.original.observation.title}</p>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          {row.original.observation.code}
        </p>
      </div>
    ),
    header: "Observacion",
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
        {row.original.responsibleUser?.name ?? "Sin responsable"}
      </span>
    ),
    enableSorting: false,
    header: "Responsable",
  },
  {
    accessorKey: "type",
    cell: ({ row }) => (
      <span
        className={cn(
          "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
          getProgressTypeClasses(row.original.type),
        )}
      >
        {getProgressTypeLabel(row.original.type)}
      </span>
    ),
    header: "Tipo",
  },
  {
    accessorKey: "status",
    cell: ({ row }) => (
      <span
        className={cn(
          "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
          getProgressStatusClasses(row.original.status),
        )}
      >
        {getProgressStatusLabel(row.original.status)}
      </span>
    ),
    header: "Estado",
  },
  {
    accessorKey: "progressPercent",
    cell: ({ row }) => (
      <div className="min-w-[10rem] space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full bg-[var(--primary)] transition-[width]"
            style={{
              width: `${row.original.progressPercent ?? 0}%`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
          <span>{row.original.progressPercent ?? 0}%</span>
          <span>{row.original.evidenceCount} archivos</span>
        </div>
      </div>
    ),
    header: "Avance",
  },
  {
    accessorKey: "sentToAuditAt",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="whitespace-nowrap text-sm text-stone-700">
          {formatProgressDate(row.original.sentToAuditAt ?? row.original.createdAt)}
        </p>
        <p className="text-xs text-stone-500">
          {row.original.evidencePending ? "Con evidencia pendiente" : "Con respaldo adjunto"}
        </p>
      </div>
    ),
    header: "Fecha envio",
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
];

export function ProgressUpdatesTable() {
  const optionsQuery = useQuery({
    queryFn: observationService.getObservationOptions,
    queryKey: QUERY_KEYS.configurationBootstrap,
    staleTime: 60_000,
  });

  const tableConfig: DataTableConfig<ProgressUpdateTableRow> = {
    columns: progressUpdateColumns,
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "Cuando las areas registren avances o cierres, esta bandeja consolidara el seguimiento documental y su estado frente a Auditoria.",
      title: "No hay avances para esta vista",
    },
    filters: [
      {
        id: "status",
        label: "Estado",
        options: [
          { label: "Borrador", value: "DRAFT" },
          { label: "Enviado a Auditoria", value: "SENT_TO_AUDIT" },
          { label: "Aprobado", value: "APPROVED" },
          { label: "Devuelto", value: "RETURNED" },
          { label: "Rechazado", value: "REJECTED" },
        ],
        placeholder: "Todos los estados",
        type: "select",
      },
      {
        id: "type",
        label: "Tipo",
        options: [
          { label: "Avance", value: "ADVANCE" },
          { label: "Finalizacion", value: "FINALIZATION" },
          { label: "Correccion", value: "CORRECTION" },
        ],
        placeholder: "Todos los tipos",
        type: "select",
      },
      {
        id: "areaId",
        label: "Area",
        options: (optionsQuery.data?.areas ?? []).map((area) => ({
          label: area.name,
          value: area.id,
        })),
        placeholder: "Todas las areas",
        type: "select",
      },
      {
        id: "responsibleUserId",
        label: "Responsable",
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
        options: (optionsQuery.data?.riskLevels ?? []).map((riskLevel) => ({
          label: riskLevel.name,
          value: riskLevel.id,
        })),
        placeholder: "Todos los niveles",
        type: "select",
      },
      {
        id: "evidencePending",
        label: "Evidencia pendiente",
        options: [
          { label: "Solo sin evidencia", value: "true" },
          { label: "Solo con evidencia", value: "false" },
        ],
        placeholder: "Todas",
        type: "select",
      },
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
    ],
    getRowId: (row) => row.id,
    queryKey: [...QUERY_KEYS.progressUpdates, "table"],
    rowActions: [
      {
        href: (row) => `/observaciones/${row.observation.id}`,
        icon: Eye,
        id: "view",
        label: "Ver detalle",
        variant: "view",
      },
      {
        hidden: (row) => !row.canSendToAudit || row.status === "SENT_TO_AUDIT",
        icon: Send,
        id: "send",
        invalidateAfterSuccess: true,
        label: "Enviar a Auditoria",
        onClick: async (row) => {
          await progressService.sendProgressUpdateToAudit(row.id);
        },
      },
    ],
    searchPlaceholder: "Buscar por observacion, area, compromiso o contexto",
  };

  if (optionsQuery.isError) {
    tableConfig.filters = [];
  }

  return <DataTable config={tableConfig} endpoint="/progress-updates" />;
}
