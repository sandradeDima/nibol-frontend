"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCheck, Eye, Send } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { QUERY_KEYS } from "@/lib/constants";
import { observationService } from "@/services/observation-service";
import { remediationService } from "@/services/remediation-service";
import type { CommitmentScheduleRow } from "@/types";
import { cn } from "@/utils";

import {
  formatRemediationDate,
  getCommitmentStatusClasses,
  getCommitmentStatusLabel,
  getDeadlineIndicator,
} from "./presentation";

const commitmentColumns: ColumnDef<CommitmentScheduleRow>[] = [
  {
    accessorKey: "title",
    cell: ({ row }) => (
      <div className="min-w-[18rem] space-y-1">
        <p className="font-semibold text-stone-950">{row.original.title}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          {row.original.area.name}
        </p>
      </div>
    ),
    header: "Compromiso",
  },
  {
    accessorKey: "observation",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="font-medium text-stone-900">{row.original.observation.title}</p>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          {row.original.observation.code}
        </p>
      </div>
    ),
    enableSorting: false,
    header: "Observacion",
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
    accessorKey: "dueDate",
    cell: ({ row }) => {
      const indicator = getDeadlineIndicator(row.original.dueDate);

      return (
        <div className="space-y-2">
          <p className="whitespace-nowrap text-stone-700">
            {formatRemediationDate(row.original.dueDate)}
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
    accessorKey: "status",
    cell: ({ row }) => (
      <span
        className={cn(
          "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
          getCommitmentStatusClasses(row.original.effectiveStatus.key as never),
        )}
      >
        {row.original.effectiveStatus.name ||
          getCommitmentStatusLabel(row.original.status)}
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
              width: `${row.original.progressPercent}%`,
            }}
          />
        </div>
        <span className="text-xs font-semibold text-stone-700">
          {row.original.progressPercent}%
        </span>
      </div>
    ),
    header: "Avance",
  },
];

export function CommitmentScheduleTable() {
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
  const defaultStatus = searchParams.get("filter.status") ?? undefined;

  const tableConfig: DataTableConfig<CommitmentScheduleRow> = {
    columns: commitmentColumns,
    defaultSort: {
      desc: false,
      id: "dueDate",
    },
    emptyState: {
      description:
        "Los compromisos apareceran aqui a medida que las areas definan sus planes de remediacion.",
      title: "No hay compromisos para este cronograma",
    },
    filters: [
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
        defaultValue: defaultStatus,
        id: "status",
        label: "Estado",
        options: [
          { label: "Pendiente", value: "PENDING" },
          { label: "En progreso", value: "IN_PROGRESS" },
          { label: "Enviado a Auditoria", value: "SENT_TO_AUDIT" },
          { label: "Aprobado", value: "APPROVED" },
          { label: "Devuelto", value: "RETURNED" },
          { label: "Completado", value: "COMPLETED" },
          { label: "Vencido", value: "OVERDUE" },
        ],
        placeholder: "Todos los estados",
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
        label: "Vencidos",
        options: [
          { label: "Solo vencidos", value: "true" },
          { label: "Ocultar vencidos", value: "false" },
        ],
        placeholder: "Todos",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: [...QUERY_KEYS.commitmentSchedule, "table"],
    rowActions: [
      {
        href: (row) => `/observaciones/${row.observation.id}`,
        icon: Eye,
        id: "view",
        label: "Ver observacion",
        variant: "view",
      },
      {
        hidden: (row) => !row.canMarkComplete || row.progressPercent >= 100,
        icon: CheckCheck,
        id: "complete",
        invalidateAfterSuccess: true,
        label: "Marcar completo",
        onClick: async (row) => {
          await remediationService.markCommitmentComplete(row.id);
        },
      },
      {
        hidden: (row) => !row.canSendToAudit || row.status === "SENT_TO_AUDIT",
        icon: Send,
        id: "send",
        invalidateAfterSuccess: true,
        label: "Enviar a Auditoria",
        onClick: async (row) => {
          await remediationService.sendCommitmentToAudit(row.id);
        },
      },
    ],
    searchPlaceholder: "Buscar por compromiso u observacion",
  };

  if (optionsQuery.isError) {
    tableConfig.filters = [];
  }

  return <DataTable config={tableConfig} endpoint="/commitments" />;
}
