"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Eye, Send } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { QUERY_KEYS } from "@/lib/constants";
import { remediationService } from "@/services/remediation-service";
import { observationService } from "@/services/observation-service";
import type { RemediationPlanTableRow } from "@/types";
import { cn } from "@/utils";

import { getRiskLevelClasses } from "../observations/presentation";
import {
  formatRemediationDate,
  getDeadlineIndicator,
  getRemediationPlanStatusClasses,
  getRemediationPlanStatusLabel,
} from "./presentation";

const remediationPlanColumns: ColumnDef<RemediationPlanTableRow>[] = [
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
    accessorKey: "status",
    cell: ({ row }) => (
      <span
        className={cn(
          "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
          getRemediationPlanStatusClasses(row.original.status),
        )}
      >
        {getRemediationPlanStatusLabel(row.original.status)}
      </span>
    ),
    header: "Estado",
  },
  {
    accessorKey: "nextDueDate",
    cell: ({ row }) => {
      const indicator = getDeadlineIndicator(row.original.nextDueDate);

      return (
        <div className="space-y-2">
          <p className="whitespace-nowrap text-stone-700">
            {formatRemediationDate(row.original.nextDueDate)}
          </p>
          <span
            className={cn(
              "inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
              indicator.tone,
            )}
          >
            {indicator.label}
          </span>
        </div>
      );
    },
    header: "Fecha limite",
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
        <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
          <span>{row.original.progressPercent}%</span>
          <span>{row.original.commitmentCount} hitos</span>
        </div>
      </div>
    ),
    header: "Avance",
  },
];

export function RemediationPlanTable() {
  const optionsQuery = useQuery({
    queryFn: observationService.getObservationOptions,
    queryKey: QUERY_KEYS.configurationBootstrap,
    staleTime: 60_000,
  });

  const tableConfig: DataTableConfig<RemediationPlanTableRow> = {
    columns: remediationPlanColumns,
    defaultSort: {
      desc: true,
      id: "updatedAt",
    },
    emptyState: {
      description:
        "Ajuste filtros o cree planes desde el detalle de observaciones para iniciar el seguimiento.",
      title: "No hay planes de remediacion en esta vista",
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
          { label: "Cerrado", value: "CLOSED" },
        ],
        placeholder: "Todos los estados",
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
    queryKey: [...QUERY_KEYS.remediationPlans, "table"],
    rowActions: [
      {
        href: (row) => `/observaciones/${row.observation.id}`,
        icon: Eye,
        id: "view",
        label: "Ver observacion",
        variant: "view",
      },
      {
        hidden: (row) => !row.canSendToAudit || row.status === "SENT_TO_AUDIT",
        icon: Send,
        id: "send",
        invalidateAfterSuccess: true,
        label: "Enviar a Auditoria",
        onClick: async (row) => {
          await remediationService.sendPlanToAudit(row.id);
        },
      },
    ],
    searchPlaceholder: "Buscar por observacion, area o responsable",
  };

  if (optionsQuery.isError) {
    tableConfig.filters = [];
  }

  return <DataTable config={tableConfig} endpoint="/remediation-plans" />;
}

