"use client";

import type { ComponentType, FormEvent, ReactNode } from "react";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  Filter,
  ListFilter,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TriangleAlert,
  UsersRound,
} from "lucide-react";

import type {
  AuditReportTemplate,
  ReportChartItem,
  ReportFilters,
  ReportOptions,
  ReportType,
} from "@/types";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getRiskLevelColor } from "@/modules/observations/presentation";
import { cn } from "@/utils";

export const REPORT_TYPE_META: Array<{
  description: string;
  label: string;
  type: ReportType;
}> = [
  {
    description: "Listado ejecutivo con estado, riesgo, fechas y avance.",
    label: "Observaciones",
    type: "OBSERVATIONS",
  },
  {
    description: "Planes de acción, fechas límite y progreso por actividad.",
    label: "Planes de acción",
    type: "ACTION_PLANS",
  },
  {
    description: "Avances y respaldo documental asociado a cada observación.",
    label: "Avances y evidencias",
    type: "PROGRESS_EVIDENCE",
  },
  {
    description: "Solicitudes de ampliación y su situación de aprobación.",
    label: "Ampliaciones",
    type: "EXTENSIONS",
  },
  {
    description: "Comparativo de cumplimiento, vencimientos y resolución.",
    label: "Cumplimiento por área",
    type: "AREA_COMPLIANCE",
  },
  {
    description: "Carga de observaciones abiertas y vencidas por responsable.",
    label: "Responsables",
    type: "RESPONSIBLES",
  },
  {
    description: "Distribución de observaciones por nivel de riesgo.",
    label: "Riesgos",
    type: "RISKS",
  },
];

export const AUDIT_TEMPLATE_META: Array<{
  description: string;
  label: string;
  template: AuditReportTemplate;
}> = [
  {
    description: "Línea de tiempo completa de acciones y cambios del hallazgo.",
    label: "Historial de observación",
    template: "HISTORY",
  },
  {
    description: "Actividad agrupada por gerencia o área involucrada.",
    label: "Actividad por área",
    template: "ACTIVITY_AREA",
  },
  {
    description: "Actividad registrada por usuario y responsable.",
    label: "Actividad por usuario",
    template: "ACTIVITY_USER",
  },
  {
    description: "Decisiones de aprobación, rechazo y devolución.",
    label: "Aprobaciones y rechazos",
    template: "APPROVALS",
  },
  {
    description: "Cumplimiento de fechas, vencimientos y atención.",
    label: "Fechas límite",
    template: "DEADLINES",
  },
  {
    description: "Archivos y evidencias registrados durante el seguimiento.",
    label: "Evidencias",
    template: "EVIDENCE",
  },
  {
    description: "Solicitudes de ampliación y sus decisiones.",
    label: "Ampliaciones",
    template: "EXTENSIONS",
  },
  {
    description: "Observaciones que requieren atención por incumplimiento.",
    label: "Incumplimientos",
    template: "INCUMPLIMIENTOS",
  },
  {
    description: "Historial de etapas y decisiones de los procesos.",
    label: "Historial de flujos",
    template: "WORKFLOW_HISTORY",
  },
];

const dateToInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getReportDateRange = (
  months: number,
): Pick<ReportFilters, "dateFrom" | "dateTo"> => {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);
  return {
    dateFrom: dateToInputValue(start),
    dateTo: dateToInputValue(end),
  };
};

export const formatReportDate = (
  value: string | Date | null | undefined,
): string => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
};

export const formatReportNumber = (value: number): string => {
  return new Intl.NumberFormat("es-BO").format(value);
};

export const formatReportPercent = (value: number): string =>
  `${Math.round(value)}%`;

type ReportFilterBarProps = {
  compact?: boolean;
  dashboardOnly?: boolean;
  defaultCutoffDate?: string;
  description?: string;
  draft: ReportFilters;
  onApply: () => void;
  onChange: (
    key: keyof ReportFilters,
    value: string | string[] | number | boolean | undefined,
  ) => void;
  onReset: () => void;
  options?: ReportOptions;
  submitLabel?: string;
  showProgress?: boolean;
  showActiveOnly?: boolean;
};

type DashboardFilterFieldsProps = {
  allowedAreaResponsibleIds: Set<string>;
  allowedExecutorIds: Set<string>;
  allowedProcessOwnerIds: Set<string>;
  capabilities: ReportOptions["filterCapabilities"];
  defaultCutoffDate?: string;
  draft: ReportFilters;
  options?: ReportOptions;
  updateFilter: ReportFilterBarProps["onChange"];
};

function DashboardFilterFields({
  allowedAreaResponsibleIds,
  allowedExecutorIds,
  allowedProcessOwnerIds,
  capabilities,
  defaultCutoffDate,
  draft,
  options,
  updateFilter,
}: DashboardFilterFieldsProps) {
  const cutoffDate = draft.cutoffDate ?? defaultCutoffDate;
  return (
    <>
      <label className="space-y-2">
        <span className="report-field-label">Fecha de corte</span>
        <input
          aria-describedby="dashboard-cutoff-description"
          className="nibol-field h-11 text-sm"
          onChange={(event) =>
            updateFilter("cutoffDate", event.target.value || undefined)
          }
          type="date"
          value={cutoffDate ?? ""}
        />
        <span
          className="block text-[11px] leading-4 text-[var(--muted)]"
          id="dashboard-cutoff-description"
        >
          Indicadores calculados con corte a {formatReportDate(cutoffDate)}.
        </span>
      </label>
      <label className="min-w-0 space-y-2">
        <span className="report-field-label">Estado de observación</span>
        <SearchableSelect
          multiple
          id="dashboard-observation-status"
          onChange={(value) =>
            updateFilter(
              "observationStatusIds",
              value.length ? value : undefined,
            )
          }
          options={(options?.observationStatuses ?? []).map((status) => ({
            id: status.id,
            label: status.name,
            search: status.key,
          }))}
          placeholder="Todos los estados"
          showSelectionActions
          showSelectedValues={false}
          value={draft.observationStatusIds ?? []}
        />
      </label>
      <label className="min-w-0 space-y-2">
        <span className="report-field-label">Estado según plazo</span>
        <SearchableSelect
          multiple
          id="dashboard-deadline-status"
          onChange={(value) =>
            updateFilter("deadlineStatuses", value.length ? value : undefined)
          }
          options={(options?.deadlineStatuses ?? []).map((status) => ({
            id: status.key,
            label: status.label,
          }))}
          placeholder="Todos los plazos"
          showSelectionActions
          showSelectedValues={false}
          value={draft.deadlineStatuses ?? []}
        />
      </label>
      {capabilities.area ? (
        <label className="space-y-2">
          <span className="report-field-label">Área</span>
          <select
            className="nibol-field h-11 text-sm"
            onChange={(event) =>
              updateFilter("areaId", event.target.value || undefined)
            }
            value={draft.areaId ?? ""}
          >
            <option value="">Todas las áreas</option>
            {options?.areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {capabilities.processOwner ? (
        <label className="min-w-0 space-y-2">
          <span className="report-field-label">Dueño de proceso</span>
          <SearchableSelect
            multiple
            id="dashboard-process-owner"
            onChange={(value) =>
              updateFilter("processOwnerId", value.length ? value : undefined)
            }
            options={(options?.processOwners ?? [])
              .filter((user) => allowedProcessOwnerIds.has(user.id))
              .map((user) => ({
                description: user.email,
                id: user.id,
                label: user.name,
                search: user.email,
              }))}
            placeholder="Todos los dueños"
            value={draft.processOwnerId ?? []}
          />
        </label>
      ) : null}
      {capabilities.areaResponsible ? (
        <label className="min-w-0 space-y-2">
          <span className="report-field-label">Responsable de área</span>
          <SearchableSelect
            multiple
            id="dashboard-area-responsible"
            onChange={(value) =>
              updateFilter(
                "areaResponsibleId",
                value.length ? value : undefined,
              )
            }
            options={(options?.areaResponsibles ?? [])
              .filter((user) => allowedAreaResponsibleIds.has(user.id))
              .map((user) => ({
                description: user.email,
                id: user.id,
                label: user.name,
                search: user.email,
              }))}
            placeholder="Todos los responsables"
            value={draft.areaResponsibleId ?? []}
          />
        </label>
      ) : null}
      {capabilities.executor ? (
        <label className="min-w-0 space-y-2">
          <span className="report-field-label">Ejecutor</span>
          <SearchableSelect
            multiple
            id="dashboard-executor"
            onChange={(value) =>
              updateFilter("executorId", value.length ? value : undefined)
            }
            options={(options?.executors ?? [])
              .filter((user) => allowedExecutorIds.has(user.id))
              .map((user) => ({
                description: user.email,
                id: user.id,
                label: user.name,
                search: user.email,
              }))}
            placeholder="Todos los ejecutores"
            value={draft.executorId ?? []}
          />
        </label>
      ) : null}
    </>
  );
}

export function ReportFilterBar({
  compact = false,
  dashboardOnly = false,
  defaultCutoffDate,
  description = "El mismo alcance alimenta los resultados y las exportaciones.",
  draft,
  onApply,
  onChange,
  onReset,
  options,
  submitLabel = "Aplicar filtros",
  showProgress = false,
  showActiveOnly = false,
}: ReportFilterBarProps) {
  const capabilities =
    options?.filterCapabilities ??
    (dashboardOnly
      ? {
          area: false,
          areaResponsible: false,
          auditReport: false,
          executor: false,
          processOwner: false,
        }
      : {
          area: true,
          areaResponsible: true,
          auditReport: true,
          executor: true,
          processOwner: true,
        });
  const hierarchyRelationships = options?.hierarchyRelationships ?? [];
  const getAllowedHierarchyIds = (nextDraft: ReportFilters) => {
    const byArea = hierarchyRelationships.filter(
      (item) => !nextDraft.areaId || item.areaId === nextDraft.areaId,
    );
    const byProcessOwner = nextDraft.processOwnerId?.length
      ? byArea.filter(
          (item) =>
            item.processOwnerId &&
            nextDraft.processOwnerId?.includes(item.processOwnerId),
        )
      : byArea;
    const byResponsible = nextDraft.areaResponsibleId?.length
      ? byProcessOwner.filter(
          (item) =>
            item.areaResponsibleId &&
            nextDraft.areaResponsibleId?.includes(item.areaResponsibleId),
        )
      : byProcessOwner;
    return {
      areaResponsibleIds: new Set(
        byProcessOwner.flatMap((item) =>
          item.areaResponsibleId ? [item.areaResponsibleId] : [],
        ),
      ),
      executorIds: new Set(
        byResponsible.flatMap((item) =>
          item.executorId ? [item.executorId] : [],
        ),
      ),
      processOwnerIds: new Set(
        byArea.flatMap((item) =>
          item.processOwnerId ? [item.processOwnerId] : [],
        ),
      ),
    };
  };
  const allowedHierarchyIds = getAllowedHierarchyIds(draft);
  const relationship = options?.areaRelationships?.find(
    (item) => item.areaId === draft.areaId,
  );
  const areaResponsibleIds = relationship
    ? new Set(relationship.areaResponsibleIds)
    : null;
  const selectedResponsibleIds = draft.areaResponsibleId ?? [];
  const responsibleExecutorIds = relationship
    ? new Set(
        relationship.responsibleExecutorIds
          .filter(({ areaResponsibleId }) =>
            selectedResponsibleIds.includes(areaResponsibleId),
          )
          .flatMap(({ executorIds }) => executorIds),
      )
    : null;
  const executorIds = relationship
    ? responsibleExecutorIds && selectedResponsibleIds.length
      ? responsibleExecutorIds
      : new Set(relationship.executorIds)
    : null;
  const processOwnerIds = relationship
    ? new Set(relationship.processOwnerIds)
    : null;
  const updateFilter = (
    key: keyof ReportFilters,
    value: string | string[] | number | boolean | undefined,
  ) => {
    if (
      dashboardOnly &&
      ["areaId", "processOwnerId", "areaResponsibleId"].includes(key)
    ) {
      const nextDraft = { ...draft, [key]: value } as ReportFilters;
      const allowed = getAllowedHierarchyIds(nextDraft);
      const keepSelected = (selected: unknown, ids: Set<string>) => {
        if (!Array.isArray(selected) || selected.length === 0) return undefined;
        const next = selected.filter(
          (item): item is string => typeof item === "string" && ids.has(item),
        );
        return next.length ? next : undefined;
      };
      onChange(
        key,
        key === "areaId"
          ? value
          : key === "processOwnerId"
            ? keepSelected(value, allowed.processOwnerIds)
            : keepSelected(value, allowed.areaResponsibleIds),
      );
      if (key !== "processOwnerId" && key !== "areaResponsibleId")
        onChange(
          "processOwnerId",
          keepSelected(nextDraft.processOwnerId, allowed.processOwnerIds),
        );
      if (key !== "areaResponsibleId")
        onChange(
          "areaResponsibleId",
          keepSelected(nextDraft.areaResponsibleId, allowed.areaResponsibleIds),
        );
      if (key !== "executorId")
        onChange(
          "executorId",
          keepSelected(nextDraft.executorId, allowed.executorIds),
        );
      return;
    }
    onChange(key, value);
    if (key === "areaResponsibleId") {
      if (!relationship) return;
      const selected = Array.isArray(value) ? value : [];
      const allowed = selected.length
        ? relationship.responsibleExecutorIds
            .filter(({ areaResponsibleId }) =>
              selected.includes(areaResponsibleId),
            )
            .flatMap(({ executorIds }) => executorIds)
        : relationship.executorIds;
      onChange(
        "executorId",
        draft.executorId?.filter((id) => allowed.includes(id)),
      );
      return;
    }
    if (key !== "areaId") return;
    const nextRelationship = options?.areaRelationships?.find(
      (item) => item.areaId === value,
    );
    const keepSelected = (
      selected: string[] | undefined,
      allowed: string[] | undefined,
    ) => {
      if (!selected?.length || !allowed) return selected;
      const allowedSet = new Set(allowed);
      const next = selected.filter((id) => allowedSet.has(id));
      return next.length ? next : undefined;
    };
    onChange(
      "areaResponsibleId",
      keepSelected(
        draft.areaResponsibleId,
        nextRelationship?.areaResponsibleIds,
      ),
    );
    onChange(
      "executorId",
      keepSelected(draft.executorId, nextRelationship?.executorIds),
    );
    onChange(
      "processOwnerId",
      keepSelected(draft.processOwnerId, nextRelationship?.processOwnerIds),
    );
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
  };

  return (
    <form
      className={cn(
        "nibol-panel space-y-4 p-4 sm:p-5",
        !dashboardOnly && "min-w-0",
        compact && "space-y-3 p-3 sm:p-4",
      )}
      onSubmit={submit}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-[var(--primary-soft)] p-2.5 text-[var(--primary)]">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-base font-bold text-[var(--foreground)] uppercase">
              {compact ? "Filtros de la vista" : "Filtros del reporte"}
            </p>
            <p className="text-xs leading-5 text-[var(--muted)]">
              {compact
                ? "El corte seleccionado actualiza KPIs, gráficos y exportaciones."
                : description}
            </p>
          </div>
        </div>
        {!compact ? (
          <div className="flex flex-wrap gap-2">
            <button
              className="nibol-btn-ghost px-3 py-2 text-xs"
              onClick={() => {
                onChange("dateFrom", getReportDateRange(1).dateFrom);
                onChange("dateTo", getReportDateRange(1).dateTo);
              }}
              type="button"
            >
              Últimos 30 días
            </button>
            <button
              className="nibol-btn-ghost px-3 py-2 text-xs"
              onClick={() => {
                const range = getReportDateRange(3);
                onChange("dateFrom", range.dateFrom);
                onChange("dateTo", range.dateTo);
              }}
              type="button"
            >
              Últimos 3 meses
            </button>
            <button
              className="nibol-btn-ghost px-3 py-2 text-xs"
              onClick={() => {
                const range = getReportDateRange(12);
                onChange("dateFrom", range.dateFrom);
                onChange("dateTo", range.dateTo);
              }}
              type="button"
            >
              Últimos 12 meses
            </button>
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "grid min-w-0 gap-3",
          dashboardOnly
            ? "sm:grid-cols-2 lg:grid-cols-6 2xl:grid-cols-7"
            : compact
              ? "sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 [&>label]:min-w-0"
              : "md:grid-cols-2 xl:grid-cols-4 [&>label]:min-w-0",
        )}
      >
        {dashboardOnly ? (
          <DashboardFilterFields
            allowedAreaResponsibleIds={allowedHierarchyIds.areaResponsibleIds}
            allowedExecutorIds={allowedHierarchyIds.executorIds}
            allowedProcessOwnerIds={allowedHierarchyIds.processOwnerIds}
            capabilities={capabilities}
            defaultCutoffDate={defaultCutoffDate}
            draft={draft}
            options={options}
            updateFilter={updateFilter}
          />
        ) : (
          <>
            <label className="space-y-2">
              <span className="report-field-label">Período de análisis</span>
              <select
                className="nibol-field h-11 text-sm"
                onChange={(event) =>
                  onChange(
                    "periodField",
                    event.target.value as ReportFilters["periodField"],
                  )
                }
                value={draft.periodField ?? "createdAt"}
              >
                <option value="createdAt">Fecha de registro</option>
                <option value="reportDate">Fecha del informe</option>
                <option value="originalDueDate">Fecha original del plan</option>
                <option value="currentDueDate">Fecha límite actual</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="report-field-label">Desde</span>
              <input
                className="nibol-field h-11 text-sm"
                onChange={(event) =>
                  onChange("dateFrom", event.target.value || undefined)
                }
                type="date"
                value={draft.dateFrom ?? ""}
              />
            </label>
            <label className="space-y-2">
              <span className="report-field-label">Hasta</span>
              <input
                className="nibol-field h-11 text-sm"
                onChange={(event) =>
                  onChange("dateTo", event.target.value || undefined)
                }
                type="date"
                value={draft.dateTo ?? ""}
              />
            </label>
            {capabilities.auditReport ? (
              <label className="min-w-0 space-y-2">
                <span className="report-field-label">Informe</span>
                <SearchableSelect
                  multiple
                  onChange={(value) =>
                    updateFilter(
                      "auditReportId",
                      value.length ? value : undefined,
                    )
                  }
                  options={
                    options?.auditReports.map((report) => ({
                      id: report.id,
                      label: report.label,
                    })) ?? []
                  }
                  placeholder="Todos los informes"
                  value={draft.auditReportId ?? []}
                />
              </label>
            ) : null}
            {capabilities.area ? (
              <label className="space-y-2">
                <span className="report-field-label">Área</span>
                <select
                  className="nibol-field h-11 text-sm"
                  onChange={(event) =>
                    updateFilter("areaId", event.target.value || undefined)
                  }
                  value={draft.areaId ?? ""}
                >
                  <option value="">Todas las áreas</option>
                  {options?.areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="space-y-2">
              <span className="report-field-label">Nivel de riesgo</span>
              <select
                className="nibol-field h-11 text-sm"
                onChange={(event) =>
                  onChange("riskLevelId", event.target.value || undefined)
                }
                value={draft.riskLevelId ?? ""}
              >
                <option value="">Todos los niveles</option>
                {options?.riskLevels.map((risk) => (
                  <option key={risk.id} value={risk.id}>
                    {risk.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="report-field-label">
                Estado del plan de acción
              </span>
              <select
                className="nibol-field h-11 text-sm"
                onChange={(event) =>
                  onChange("progressStatus", event.target.value || undefined)
                }
                value={draft.progressStatus ?? ""}
              >
                <option value="">Todos los estados</option>
                {options?.progressStatuses.map((status) => (
                  <option key={status.key} value={status.key}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="report-field-label">Estado de observación</span>
              <select
                className="nibol-field h-11 text-sm"
                onChange={(event) =>
                  updateFilter("statusId", event.target.value || undefined)
                }
                value={draft.statusId ?? ""}
              >
                <option value="">Todos los estados</option>
                {options?.observationStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </label>
            {capabilities.processOwner ? (
              <label className="min-w-0 space-y-2">
                <span className="report-field-label">Dueño del proceso</span>
                <SearchableSelect
                  multiple
                  id="report-process-owner"
                  onChange={(value) =>
                    updateFilter(
                      "processOwnerId",
                      value.length ? value : undefined,
                    )
                  }
                  options={(options?.processOwners ?? [])
                    .filter(
                      (user) =>
                        !processOwnerIds || processOwnerIds.has(user.id),
                    )
                    .map((user) => ({
                      description: user.email,
                      id: user.id,
                      label: user.name,
                      search: user.email,
                    }))}
                  placeholder="Todos los dueños"
                  value={draft.processOwnerId ?? []}
                />
              </label>
            ) : null}
            {capabilities.areaResponsible ? (
              <label className="min-w-0 space-y-2">
                <span className="report-field-label">Responsable de área</span>
                <SearchableSelect
                  multiple
                  id="report-area-responsible"
                  onChange={(value) =>
                    updateFilter(
                      "areaResponsibleId",
                      value.length ? value : undefined,
                    )
                  }
                  options={(options?.areaResponsibles ?? [])
                    .filter(
                      (user) =>
                        !areaResponsibleIds || areaResponsibleIds.has(user.id),
                    )
                    .map((user) => ({
                      description: user.email,
                      id: user.id,
                      label: user.name,
                      search: user.email,
                    }))}
                  placeholder="Todos los responsables"
                  value={draft.areaResponsibleId ?? []}
                />
              </label>
            ) : null}
            {capabilities.executor ? (
              <label className="min-w-0 space-y-2">
                <span className="report-field-label">Ejecutor</span>
                <SearchableSelect
                  multiple
                  id="report-executor"
                  onChange={(value) =>
                    updateFilter("executorId", value.length ? value : undefined)
                  }
                  options={(options?.executors ?? [])
                    .filter((user) => !executorIds || executorIds.has(user.id))
                    .map((user) => ({
                      description: user.email,
                      id: user.id,
                      label: user.name,
                      search: user.email,
                    }))}
                  placeholder="Todos los ejecutores"
                  value={draft.executorId ?? []}
                />
              </label>
            ) : null}
            <label className="space-y-2">
              <span className="report-field-label">Estado según plazo</span>
              <select
                className="nibol-field h-11 text-sm"
                onChange={(event) =>
                  onChange("deadlineStatus", event.target.value || undefined)
                }
                value={draft.deadlineStatus ?? ""}
              >
                <option value="">Todos los plazos</option>
                <option value="VIGENTE">Vigente</option>
                <option value="VENCIDO">Vencido</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="report-field-label">Reprogramado</span>
              <select
                className="nibol-field h-11 text-sm"
                onChange={(event) =>
                  onChange(
                    "reprogrammed",
                    event.target.value === ""
                      ? undefined
                      : event.target.value === "true",
                  )
                }
                value={
                  draft.reprogrammed === undefined
                    ? ""
                    : String(draft.reprogrammed)
                }
              >
                <option value="">Todos</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="relative min-w-0 space-y-2">
              <span className="report-field-label">Buscar</span>
              <input
                aria-label="Buscar por informe, observación, plan o usuario"
                className="nibol-field h-11 text-sm"
                onChange={(event) =>
                  onChange("search", event.target.value || undefined)
                }
                placeholder="Informe, plan, área o usuario"
                type="search"
                value={draft.search ?? ""}
              />
            </label>
            {showProgress ? (
              <label className="space-y-2">
                <span className="report-field-label">Avance mínimo</span>
                <input
                  className="nibol-field h-11 text-sm"
                  max={100}
                  min={0}
                  onChange={(event) =>
                    onChange(
                      "progressMin",
                      event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    )
                  }
                  placeholder="Ej. 20"
                  type="number"
                  value={draft.progressMin ?? ""}
                />
              </label>
            ) : null}
            {showProgress ? (
              <label className="space-y-2">
                <span className="report-field-label">Avance máximo</span>
                <input
                  className="nibol-field h-11 text-sm"
                  max={100}
                  min={0}
                  onChange={(event) =>
                    onChange(
                      "progressMax",
                      event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    )
                  }
                  placeholder="Ej. 80"
                  type="number"
                  value={draft.progressMax ?? ""}
                />
              </label>
            ) : null}
          </>
        )}
      </div>

      {!dashboardOnly ? (
        <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground-soft)]">
              <input
                checked={draft.dueSoon === true}
                className="h-4 w-4 accent-[var(--primary)]"
                onChange={(event) =>
                  onChange("dueSoon", event.target.checked ? true : undefined)
                }
                type="checkbox"
              />
              Solo próximos a vencer
            </label>
            {showActiveOnly ? (
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground-soft)]">
                <input
                  checked={draft.activeOnly === true}
                  className="h-4 w-4 accent-[var(--primary)]"
                  onChange={(event) =>
                    onChange(
                      "activeOnly",
                      event.target.checked ? true : undefined,
                    )
                  }
                  type="checkbox"
                />
                Solo pendientes
              </label>
            ) : null}
            <span className="text-xs leading-6 text-[var(--muted)]">
              Vencido se calcula con la fecha efectiva aprobada.
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="nibol-btn-secondary px-4 py-2.5 text-sm"
              onClick={onReset}
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar
            </button>
            <button
              className="nibol-btn-primary px-4 py-2.5 text-sm"
              type="submit"
            >
              <ListFilter className="h-4 w-4" />
              {submitLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end border-t border-[var(--border)] pt-3">
          <div className="flex flex-wrap gap-2">
            <button
              className="nibol-btn-secondary px-4 py-2 text-sm"
              onClick={onReset}
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar
            </button>
            <button
              className="nibol-btn-primary px-4 py-2 text-sm"
              type="submit"
            >
              <ListFilter className="h-4 w-4" />
              Aplicar filtros
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

export function ReportPanel({
  children,
  className,
  description,
  title,
}: {
  children: ReactNode;
  className?: string;
  description?: string;
  title: string;
}) {
  return (
    <section className={cn("nibol-panel min-w-0 p-5 sm:p-6", className)}>
      <div className="mb-5 space-y-1.5">
        <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-6 text-[var(--foreground-soft)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const KPI_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  compliance: ShieldCheck,
  overdue: TriangleAlert,
  open: CircleAlert,
  dueSoon: Clock3,
  inProcess: TimerReset,
  closed: CheckCircle2,
  progress: CheckCircle2,
  reprogrammed: CalendarDays,
  resolution: TimerReset,
  risk: TriangleAlert,
  total: ListFilter,
};

export function ReportKpi({
  active = false,
  description,
  href,
  icon = "total",
  label,
  onClick,
  tone = "default",
  value,
}: {
  active?: boolean;
  description: string;
  href?: string;
  icon?: keyof typeof KPI_ICONS;
  label: string;
  onClick?: () => void;
  tone?: "accent" | "danger" | "default";
  value: string;
}) {
  const Icon = KPI_ICONS[icon] ?? ListFilter;
  const body = (
    <article
      className={cn(
        "group flex h-full flex-col justify-between gap-4 border p-4 transition sm:p-5",
        tone === "accent"
          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[var(--shadow-panel-strong)]"
          : tone === "danger"
            ? "border-[color:color-mix(in_srgb,var(--accent)_28%,white)] bg-[var(--surface)]"
            : "border-[var(--border)] bg-[var(--surface)]",
        active &&
          (tone === "accent"
            ? "ring-2 ring-white/70 ring-offset-2"
            : "border-[var(--primary)] bg-[var(--primary-soft)] ring-1 ring-[var(--primary)]"),
        onClick &&
          "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-panel)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p
            className={cn(
              "text-[11px] font-semibold tracking-[0.18em] uppercase",
              tone === "accent" ? "text-slate-300" : "text-[var(--muted)]",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "text-3xl font-semibold tracking-tight",
              tone === "accent" ? "text-white" : "text-[var(--foreground)]",
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center border",
            tone === "accent"
              ? "border-white/15 bg-white/10 text-white"
              : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--primary)]",
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p
        className={cn(
          "text-sm leading-6",
          tone === "accent"
            ? "text-slate-300"
            : "text-[var(--foreground-soft)]",
        )}
      >
        {description}
      </p>
      {href ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold",
            tone === "accent" ? "text-white" : "text-[var(--primary)]",
          )}
        >
          Ver detalle{" "}
          <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      ) : null}
    </article>
  );
  return onClick ? (
    <button
      aria-pressed={active}
      className="block h-full w-full appearance-none border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
      onClick={onClick}
      type="button"
    >
      {body}
    </button>
  ) : href ? (
    <Link className="block h-full" href={href}>
      {body}
    </Link>
  ) : (
    body
  );
}

export const REPORT_CHART_COLORS = {
  CONCLUDED: "var(--success)",
  CON_AVANCE: "#F59E0B",
  INICIADO: "var(--info)",
  NOT_STARTED: "var(--muted)",
  STARTED: "var(--info)",
  WITH_PROGRESS: "#F59E0B",
  VIGENTE: "var(--success)",
  VENCIDO: "var(--accent)",
  SI: "#F59E0B",
  NO: "var(--muted)",
  CRITICAL: "#991B1B",
  HIGH: "var(--accent)",
  MEDIUM: "#FACC15",
  LOW: "#16A34A",
} as const;

export const getReportChartColor = (item: ReportChartItem): string => {
  const key = item.key.trim().toUpperCase();
  const label = item.label.trim().toUpperCase();
  const riskToken = item.colorToken?.trim().toUpperCase();

  if (riskToken && !riskToken.startsWith("#")) {
    if (riskToken.includes("CRIT")) return REPORT_CHART_COLORS.CRITICAL;
    if (riskToken === "VIGENTE") return REPORT_CHART_COLORS.VIGENTE;
    if (riskToken === "VENCIDO") return REPORT_CHART_COLORS.VENCIDO;
    if (riskToken === "SI") return REPORT_CHART_COLORS.SI;
    if (riskToken === "NO") return REPORT_CHART_COLORS.NO;
    if (riskToken === "HIGH" || riskToken === "ALTO")
      return REPORT_CHART_COLORS.HIGH;
    if (riskToken === "MEDIUM" || riskToken === "MEDIO")
      return REPORT_CHART_COLORS.MEDIUM;
    if (riskToken === "LOW" || riskToken === "BAJO")
      return REPORT_CHART_COLORS.LOW;
  }

  if (item.colorToken) return getRiskLevelColor(item.colorToken);

  if (key in REPORT_CHART_COLORS) {
    return REPORT_CHART_COLORS[key as keyof typeof REPORT_CHART_COLORS];
  }

  if (key.includes("CRIT") || label.includes("CRIT"))
    return REPORT_CHART_COLORS.CRITICAL;
  if (key === "HIGH" || key === "ALTO" || label === "ALTO")
    return REPORT_CHART_COLORS.HIGH;
  if (key === "MEDIUM" || key === "MEDIO" || label === "MEDIO")
    return REPORT_CHART_COLORS.MEDIUM;
  if (key === "LOW" || key === "BAJO" || label === "BAJO")
    return REPORT_CHART_COLORS.LOW;

  return "var(--primary)";
};

export function ReportBarList({
  items,
  showPercentage = false,
  suffix,
}: {
  items: ReportChartItem[];
  showPercentage?: boolean;
  suffix?: string;
}) {
  const max = Math.max(...items.map((item) => Math.max(item.value, 0)), 0);
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-8 text-center text-sm text-[var(--foreground-soft)]">
        No hay datos para este corte.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const value = Math.max(item.value, 0);
        const percentage = max > 0 && value > 0 ? (value / max) * 100 : 0;
        const row = (
          <div className="space-y-2" title={item.tooltip ?? item.label}>
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-medium text-[var(--foreground)]">
                {item.label}
              </span>
              <span className="shrink-0 text-sm font-semibold text-[var(--foreground)]">
                {formatReportNumber(value)}
                {suffix ?? ""}
                {showPercentage ? ` · ${formatReportPercent(percentage)}` : ""}
              </span>
            </div>
            <div className="h-2 w-full">
              <div
                className="h-full rounded-[1px] transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{
                  background: getReportChartColor(item),
                  minWidth: value > 0 ? "2px" : 0,
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>
        );
        return item.href ? (
          <Link
            className="block transition hover:opacity-85"
            href={item.href}
            key={`${item.key}-${item.label}`}
          >
            {row}
          </Link>
        ) : (
          <div key={`${item.key}-${item.label}`}>{row}</div>
        );
      })}
    </div>
  );
}

export function ReportDonut({ items }: { items: ReportChartItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (items.length === 0 || total === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-8 text-center text-sm text-[var(--foreground-soft)]">
        No hay datos para este corte.
      </div>
    );
  }
  let cursor = 0;
  const segments = items.map((item) => {
    const start = cursor;
    cursor += total === 0 ? 0 : (item.value / total) * 100;
    return `${getReportChartColor(item)} ${start}% ${cursor}%`;
  });
  return (
    <div className="grid gap-5 sm:grid-cols-[11rem_1fr] sm:items-center">
      <div
        className="relative mx-auto h-40 w-40 rounded-full border border-[var(--border)]"
        style={{
          background:
            total === 0
              ? "var(--surface-muted)"
              : `conic-gradient(${segments.join(", ")})`,
        }}
      >
        <div className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full bg-[var(--surface)] text-center">
          <span className="text-[10px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
            Total
          </span>
          <strong className="mt-1 text-3xl text-[var(--foreground)]">
            {formatReportNumber(total)}
          </strong>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const row = (
            <div className="flex items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2 text-sm text-[var(--foreground)]">
                <span
                  className="h-2.5 w-2.5 shrink-0"
                  style={{
                    background: getReportChartColor(item),
                  }}
                />
                {item.label}
              </span>
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {formatReportNumber(item.value)}
              </span>
            </div>
          );

          return item.href ? (
            <Link
              className="block transition hover:opacity-85"
              href={item.href}
              key={`${item.key}-${item.label}`}
            >
              {row}
            </Link>
          ) : (
            <div key={`${item.key}-${item.label}`}>{row}</div>
          );
        })}
      </div>
    </div>
  );
}

export function ReportTrend({
  points,
}: {
  points: Array<{
    closed: number;
    created: number;
    label: string;
    monthKey: string;
  }>;
}) {
  const max =
    Math.max(...points.flatMap((point) => [point.created, point.closed]), 0) ||
    1;
  if (points.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-8 text-center text-sm text-[var(--foreground-soft)]">
        No hay actividad suficiente para construir la tendencia.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-5 bg-[var(--primary)]" />
          Registradas
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-5 bg-[var(--success)]" />
          Cerradas
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
        {points.map((point) => (
          <div className="space-y-2 text-center" key={point.monthKey}>
            <div className="flex h-36 items-end justify-center gap-1 border border-[var(--border)] bg-[var(--surface-soft)] px-1.5 py-2 sm:h-44 sm:gap-2 sm:px-2">
              <div
                className="w-3 bg-[var(--primary)] sm:w-5"
                style={{
                  height: `${point.created > 0 ? (point.created / max) * 100 : 0}%`,
                  minHeight: point.created > 0 ? "2px" : 0,
                }}
              />
              <div
                className="w-3 bg-[var(--success)] sm:w-5"
                style={{
                  height: `${point.closed > 0 ? (point.closed / max) * 100 : 0}%`,
                  minHeight: point.closed > 0 ? "2px" : 0,
                }}
              />
            </div>
            <p className="truncate text-[10px] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase sm:text-xs">
              {point.label}
            </p>
            <p className="text-xs text-[var(--foreground-soft)]">
              {point.created} / {point.closed}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportFilterSummary({ filters }: { filters: ReportFilters }) {
  const progressLabels = {
    CONCLUDED: "Concluido",
    NOT_STARTED: "No iniciado",
    STARTED: "Iniciado",
    WITH_PROGRESS: "Con avance",
  } as const;
  const periodLabels = {
    createdAt: "Fecha de registro",
    currentDueDate: "Fecha límite efectiva",
    originalDueDate: "Fecha límite original",
    reportDate: "Fecha del informe",
  } as const;
  const entries = [
    [
      "Periodo",
      filters.dateFrom || filters.dateTo
        ? `${filters.dateFrom ?? "Inicio"} – ${filters.dateTo ?? "Hoy"}`
        : "Actual",
    ],
    ["Fecha", periodLabels[filters.periodField ?? "createdAt"]],
    [
      "Dueño del proceso",
      filters.processOwnerId ? "Dueño seleccionado" : "Todos",
    ],
    ["Área", filters.areaId ? "Área seleccionada" : "Todas"],
    [
      "Responsable de área",
      filters.areaResponsibleId ? "Responsable seleccionado" : "Todos",
    ],
    ["Riesgo", filters.riskLevelId ? "Nivel seleccionado" : "Todos"],
    [
      "Estado de observación",
      filters.observationStatusIds?.length
        ? `${filters.observationStatusIds.length} seleccionados`
        : filters.statusId
          ? "Estado seleccionado"
          : "Todos",
    ],
    [
      "Estado del plan de acción",
      filters.progressStatus ? progressLabels[filters.progressStatus] : "Todos",
    ],
    [
      "Estado según plazo",
      filters.deadlineStatuses?.length
        ? filters.deadlineStatuses.join(", ")
        : (filters.deadlineStatus ?? "Todos"),
    ],
    [
      "Reprogramado",
      filters.reprogrammed === undefined
        ? "Todos"
        : filters.reprogrammed
          ? "Sí"
          : "No",
    ],
    ["Atención", filters.activeOnly ? "Solo pendientes" : "Todos"],
    ["Ejecutor", filters.executorId ? "Ejecutor seleccionado" : "Todos"],
  ];
  return (
    <div className="grid min-w-0 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] gap-2">
      {entries.map(([label, value]) => (
        <div
          className="min-w-0 border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5"
          key={label}
        >
          <p className="text-[10px] font-semibold tracking-[0.15em] text-[var(--muted)] uppercase">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold break-words text-[var(--foreground)]">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ReportDataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Record<string, unknown>>;
}) {
  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-10 text-center text-sm text-[var(--foreground-soft)]">
        No hay registros para mostrar con los filtros actuales.
      </div>
    );
  }
  return (
    <div className="report-table-wrapper -mx-2 w-full max-w-full min-w-0 overflow-x-auto px-2">
      <table className="w-max min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-strong)]">
            {columns.map((column) => (
              <th
                className="px-3 py-3 text-[10px] font-semibold tracking-[0.15em] whitespace-nowrap text-[var(--muted)] uppercase"
                key={column}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-soft)]"
              key={index}
            >
              {columns.map((column) => (
                <td
                  className="max-w-[22rem] px-3 py-3 align-top text-[var(--foreground-soft)]"
                  key={`${index}-${column}`}
                >
                  {formatCellValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const formatCellValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return formatReportNumber(value);
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))
    return formatReportDate(value);
  return String(value);
};

export function ReportExportButtons({
  disabled = false,
  loading = false,
  onExport,
}: {
  disabled?: boolean;
  loading?: boolean;
  onExport: (format: "excel" | "pdf") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="nibol-btn-secondary px-3 py-2.5 text-sm"
        disabled={disabled}
        onClick={() => onExport("excel")}
        type="button"
      >
        <Download className="h-4 w-4" /> {loading ? "Preparando…" : "Excel"}
      </button>
      <button
        className="nibol-btn-secondary px-3 py-2.5 text-sm"
        disabled={disabled}
        onClick={() => onExport("pdf")}
        type="button"
      >
        <Download className="h-4 w-4" /> {loading ? "Preparando…" : "PDF"}
      </button>
    </div>
  );
}

export function ReportLoading({
  label = "Preparando información del reporte…",
}: {
  label?: string;
}) {
  return (
    <div className="nibol-panel flex items-center gap-3 px-5 py-8 text-sm text-[var(--foreground-soft)]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--primary)]" />
      {label}
    </div>
  );
}

export function ReportError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="nibol-panel flex flex-col items-start gap-4 border-[color-mix(in_srgb,var(--accent)_32%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_4%,var(--surface))] px-5 py-6">
      <div>
        <p className="font-semibold text-[var(--foreground)]">
          No fue posible cargar el reporte.
        </p>
        <p className="mt-1 text-sm text-[var(--foreground-soft)]">
          Revise los filtros o intente nuevamente.
        </p>
      </div>
      <button
        className="nibol-btn-secondary px-3 py-2 text-sm"
        onClick={onRetry}
        type="button"
      >
        Reintentar
      </button>
    </div>
  );
}

export function ReportShortcut({
  href,
  icon: Icon,
  label,
  description,
}: {
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      className="group flex items-start gap-3 border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]"
      href={href}
    >
      <div className="bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-[var(--foreground)]">{label}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--foreground-soft)]">
          {description}
        </p>
      </div>
      <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-[var(--muted)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--primary)]" />
    </Link>
  );
}

export const reportUtilityIcons = {
  calendar: CalendarDays,
  download: Download,
  people: UsersRound,
  sparkles: Sparkles,
};
