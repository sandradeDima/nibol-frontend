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
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TriangleAlert,
  UsersRound,
} from "lucide-react";

import type {
  AuditReportTemplate,
  ConfigurationBootstrap,
  ReportChartItem,
  ReportFilters,
  ReportType,
} from "@/types";
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
    year: "numeric",
  }).format(date);
};

export const formatReportNumber = (value: number): string => {
  return new Intl.NumberFormat("es-BO").format(value);
};

export const formatReportPercent = (value: number): string =>
  `${Math.round(value)}%`;

type ReportFilterBarProps = {
  draft: ReportFilters;
  onApply: () => void;
  onChange: (
    key: keyof ReportFilters,
    value: string | number | boolean | undefined,
  ) => void;
  onReset: () => void;
  options?: ConfigurationBootstrap;
  showProgress?: boolean;
};

export function ReportFilterBar({
  draft,
  onApply,
  onChange,
  onReset,
  options,
  showProgress = false,
}: ReportFilterBarProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
  };

  return (
    <form className="nibol-panel space-y-4 p-4 sm:p-5" onSubmit={submit}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-[var(--primary-soft)] p-2.5 text-[var(--primary)]">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-base font-bold text-[var(--foreground)] uppercase">
              Filtros del reporte
            </p>
            <p className="text-xs leading-5 text-[var(--muted)]">
              Combine período, área, riesgo y responsables para leer el mismo
              corte operativo.
            </p>
          </div>
        </div>
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
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
        <label className="space-y-2">
          <span className="report-field-label">Área</span>
          <select
            className="nibol-field h-11 text-sm"
            onChange={(event) =>
              onChange("areaId", event.target.value || undefined)
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
        <label className="space-y-2">
          <span className="report-field-label">Riesgo</span>
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
          <span className="report-field-label">Estado</span>
          <select
            className="nibol-field h-11 text-sm"
            onChange={(event) =>
              onChange("statusId", event.target.value || undefined)
            }
            value={draft.statusId ?? ""}
          >
            <option value="">Todos los estados</option>
            {options?.statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="report-field-label">Responsable</span>
          <select
            className="nibol-field h-11 text-sm"
            onChange={(event) =>
              onChange("responsibleUserId", event.target.value || undefined)
            }
            value={draft.responsibleUserId ?? ""}
          >
            <option value="">Todos los responsables</option>
            {options?.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
        <label className="relative space-y-2">
          <span className="report-field-label">Buscar</span>
          <Search className="pointer-events-none absolute top-[2.55rem] left-3 h-4 w-4 text-[var(--muted)]" />
          <input
            className="nibol-field h-11 pl-9 text-sm"
            onChange={(event) =>
              onChange("search", event.target.value || undefined)
            }
            placeholder="Código, título o área"
            type="search"
            value={draft.search ?? ""}
          />
        </label>
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
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              placeholder="Ej. 80"
              type="number"
              value={draft.progressMax ?? ""}
            />
          </label>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground-soft)]">
            <input
              checked={draft.overdue === true}
              className="h-4 w-4 accent-[var(--primary)]"
              onChange={(event) =>
                onChange("overdue", event.target.checked ? true : undefined)
              }
              type="checkbox"
            />
            Solo vencidas
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground-soft)]">
            <input
              checked={draft.dueSoon === true}
              className="h-4 w-4 accent-[var(--primary)]"
              onChange={(event) =>
                onChange("dueSoon", event.target.checked ? true : undefined)
              }
              type="checkbox"
            />
            Solo próximas a vencer
          </label>
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
            Aplicar filtros
          </button>
        </div>
      </div>
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
  resolution: TimerReset,
  risk: TriangleAlert,
  total: ListFilter,
};

export function ReportKpi({
  description,
  href,
  icon = "total",
  label,
  tone = "default",
  value,
}: {
  description: string;
  href?: string;
  icon?: keyof typeof KPI_ICONS;
  label: string;
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
          Ver observaciones{" "}
          <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      ) : null}
    </article>
  );
  return href ? (
    <Link className="block h-full" href={href}>
      {body}
    </Link>
  ) : (
    body
  );
}

const chartColor = (index: number): string => {
  return [
    "var(--primary)",
    "var(--accent)",
    "var(--info)",
    "var(--success)",
    "#64748b",
    "#b45309",
  ][index % 6];
};

export function ReportBarList({
  items,
  suffix,
}: {
  items: ReportChartItem[];
  suffix?: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 0) || 1;
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-8 text-center text-sm text-[var(--foreground-soft)]">
        No hay datos para este corte.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const row = (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-medium text-[var(--foreground)]">
                {item.label}
              </span>
              <span className="shrink-0 text-sm font-semibold text-[var(--foreground)]">
                {formatReportNumber(item.value)}
                {suffix ?? ""}
              </span>
            </div>
            <div className="h-2 overflow-hidden bg-[var(--surface-muted)]">
              <div
                className="h-full transition-[width]"
                style={{
                  background: item.colorToken || chartColor(index),
                  width: `${Math.max(6, (item.value / max) * 100)}%`,
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
  let cursor = 0;
  const segments = items.map((item, index) => {
    const start = cursor;
    cursor += total === 0 ? 0 : (item.value / total) * 100;
    return `${item.colorToken || chartColor(index)} ${start}% ${cursor}%`;
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
        {items.map((item, index) => {
          const row = (
            <div className="flex items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2 text-sm text-[var(--foreground)]">
                <span
                  className="h-2.5 w-2.5 shrink-0"
                  style={{ background: item.colorToken || chartColor(index) }}
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
          <span className="h-2.5 w-5 bg-slate-400" />
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
                  height: `${Math.max(7, (point.created / max) * 100)}%`,
                }}
              />
              <div
                className="w-3 bg-slate-400 sm:w-5"
                style={{
                  height: `${Math.max(7, (point.closed / max) * 100)}%`,
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
  const entries = [
    [
      "Periodo",
      filters.dateFrom || filters.dateTo
        ? `${filters.dateFrom ?? "Inicio"} – ${filters.dateTo ?? "Hoy"}`
        : "Actual",
    ],
    [
      "Fecha",
      filters.periodField === "currentDueDate"
        ? "Fecha límite actual"
        : "Registro",
    ],
    ["Área", filters.areaId ? "Área seleccionada" : "Todas"],
    ["Riesgo", filters.riskLevelId ? "Nivel seleccionado" : "Todos"],
    [
      "Vencimiento",
      filters.overdue
        ? "Solo vencidas"
        : filters.dueSoon
          ? "Próximas a vencer"
          : "Todos",
    ],
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {entries.map(([label, value]) => (
        <div
          className="border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5"
          key={label}
        >
          <p className="text-[10px] font-semibold tracking-[0.15em] text-[var(--muted)] uppercase">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
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
    <div className="-mx-2 overflow-x-auto px-2">
      <table className="min-w-full border-collapse text-left text-sm">
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
  onExport,
}: {
  disabled?: boolean;
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
        <Download className="h-4 w-4" /> Excel
      </button>
      <button
        className="nibol-btn-secondary px-3 py-2.5 text-sm"
        disabled={disabled}
        onClick={() => onExport("pdf")}
        type="button"
      >
        <Download className="h-4 w-4" /> PDF
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
    <div className="nibol-panel flex flex-col items-start gap-4 border-l-4 border-l-[var(--accent)] px-5 py-6">
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
