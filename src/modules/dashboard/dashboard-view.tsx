import type { CSSProperties, ReactNode } from "react";

import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  ClipboardList,
  FolderKanban,
  Gauge,
  GitPullRequestArrow,
  ShieldAlert,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import type {
  AreaDashboardData,
  AuditDashboardData,
  DashboardActivityRow,
  DashboardCommitmentRow,
  DashboardDistributionItem,
  DashboardObservationRow,
  DashboardRankingItem,
  DashboardReviewQueueRow,
} from "@/types";
import { cn } from "@/utils";

import { DashboardRefreshButton } from "./dashboard-refresh-button";

import {
  formatObservationDate,
  getRiskLevelClasses,
  getStatusClasses,
} from "../observations/presentation";
import { getProgressStatusClasses } from "../progress/presentation";
import { getCommitmentStatusClasses } from "../remediation/presentation";
import { getExtensionRequestStatusClasses } from "../extension-requests/presentation";

type DashboardViewProps = {
  data: AreaDashboardData | AuditDashboardData;
};

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const startOfDay = (value: Date): Date => {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
};

const addDays = (value: Date, days: number): Date => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDateFilter = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getSegmentColor = (item: DashboardDistributionItem): string => {
  switch (item.colorToken) {
    case "critical":
      return "#b42318";
    case "high":
      return "#475569";
    case "medium":
      return "#64748b";
    case "low":
      return "#cbd5e1";
    case "primary":
      return "var(--primary)";
    default:
      return "#94a3b8";
  }
};

const getReviewStatusClasses = (
  row: DashboardReviewQueueRow,
): string => {
  if (row.kind === "PROGRESS") {
    return getProgressStatusClasses(row.status.key as never);
  }

  return getExtensionRequestStatusClasses(row.status.key as never);
};

const getActivityKindLabel = (kind: DashboardActivityRow["kind"]): string => {
  switch (kind) {
    case "EXTENSION":
      return "Ampliación";
    case "PROGRESS":
      return "Avance";
    case "OBSERVATION":
    default:
      return "Observación";
  }
};

const getReviewKindLabel = (kind: DashboardReviewQueueRow["kind"]): string => {
  return kind === "PROGRESS" ? "Avance" : "Ampliación";
};

function DashboardSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("nibol-panel px-5 py-5", className)}>{children}</section>;
}

function DashboardPanelHeader({
  description,
  title,
}: {
  description?: string;
  title: string;
}) {
  return (
    <div className="space-y-1.5">
      <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">{title}</h2>
      {description ? (
        <p className="text-sm leading-6 text-[var(--foreground-soft)]">{description}</p>
      ) : null}
    </div>
  );
}

function DashboardMetricCard({
  description,
  href,
  icon,
  label,
  tone = "default",
  value,
}: {
  description: string;
  href?: string;
  icon: ReactNode;
  label: string;
  tone?: "default" | "danger";
  value: string;
}) {
  const content = (
    <article
      className={cn(
        "flex h-full flex-col justify-between gap-4 border px-4 py-4 transition sm:px-5",
        tone === "danger"
          ? "border-[color:color-mix(in_srgb,var(--accent)_20%,white)] bg-[var(--surface)]"
          : "border-[var(--border)] bg-[var(--surface)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {label}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--primary)]">
          {icon}
        </div>
      </div>

      <p className="text-sm leading-6 text-[var(--foreground-soft)]">{description}</p>
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <Link className="block h-full" href={href}>
      {content}
    </Link>
  );
}

function SecondaryMetric({
  description,
  href,
  label,
  value,
}: {
  description: string;
  href?: string;
  label: string;
  value: string;
}) {
  const body = (
    <div className="flex items-start justify-between gap-4 border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          {label}
        </p>
        <p className="text-2xl font-semibold text-[var(--foreground)]">{value}</p>
        <p className="text-sm leading-6 text-[var(--foreground-soft)]">{description}</p>
      </div>
    </div>
  );

  if (!href) {
    return body;
  }

  return (
    <Link className="block" href={href}>
      {body}
    </Link>
  );
}

function MiniEmpty({
  description,
}: {
  description: string;
}) {
  return (
    <div className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-8 text-center text-sm text-[var(--foreground-soft)]">
      {description}
    </div>
  );
}

function DistributionPanel({
  description,
  items,
  title,
}: {
  description?: string;
  items: DashboardDistributionItem[];
  title: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 0) || 1;

  return (
    <DashboardSurface className="space-y-4">
      <DashboardPanelHeader description={description} title={title} />

      {items.length === 0 ? (
        <MiniEmpty description="No hay datos disponibles para este corte." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const content = (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {item.label}
                  </p>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {item.value}
                  </span>
                </div>
                <div className="h-2 overflow-hidden bg-[var(--surface-muted)]">
                  <div
                    className="h-full"
                    style={{
                      background: getSegmentColor(item),
                      width: `${Math.max(8, (item.value / maxValue) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            );

            if (!item.href) {
              return <div key={`${item.key}-${item.label}`}>{content}</div>;
            }

            return (
              <Link
                key={`${item.key}-${item.label}`}
                className="block transition hover:opacity-90"
                href={item.href}
              >
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </DashboardSurface>
  );
}

function SplitSummaryPanel({
  description,
  items,
  title,
}: {
  description?: string;
  items: DashboardDistributionItem[];
  title: string;
}) {
  const total = items.reduce((accumulator, item) => accumulator + item.value, 0);
  const segments = items.reduce<Array<{ color: string; end: number; start: number }>>(
    (accumulator, item) => {
      const start = accumulator.at(-1)?.end ?? 0;
      const share = total === 0 ? 0 : (item.value / total) * 100;
      const end = start + share;

      accumulator.push({
        color: getSegmentColor(item),
        end,
        start,
      });

      return accumulator;
    },
    [],
  );
  const donutStyle = {
    background:
      total === 0
        ? "var(--surface-muted)"
        : `conic-gradient(${segments
            .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
            .join(", ")})`,
  } satisfies CSSProperties;

  return (
    <DashboardSurface className="space-y-4">
      <DashboardPanelHeader description={description} title={title} />

      {items.length === 0 ? (
        <MiniEmpty description="No hay observaciones para resumir en esta vista." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-[10rem_1fr] sm:items-center">
          <div
            className="relative mx-auto h-40 w-40 rounded-full border border-[var(--border)]"
            style={donutStyle}
          >
            <div className="absolute inset-[24%] flex items-center justify-center rounded-full bg-[var(--surface)] text-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Total
                </p>
                <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{total}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const row = (
                <div className="flex items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3"
                      style={{
                        background: getSegmentColor(item),
                      }}
                    />
                    <span className="text-sm text-[var(--foreground)]">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {item.value}
                  </span>
                </div>
              );

              if (!item.href) {
                return <div key={`${item.key}-${item.label}`}>{row}</div>;
              }

              return (
                <Link key={`${item.key}-${item.label}`} href={item.href}>
                  {row}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </DashboardSurface>
  );
}

function TrendPanel({
  points,
}: {
  points: AuditDashboardData["charts"]["monthlyTrend"];
}) {
  const maxValue = Math.max(...points.flatMap((point) => [point.created, point.closed]), 0) || 1;

  return (
    <DashboardSurface className="space-y-4">
      <DashboardPanelHeader
        description="Observaciones creadas frente a observaciones cerradas durante los últimos seis meses."
        title="Tendencia mensual"
      />

      {points.length === 0 ? (
        <MiniEmpty description="No hay actividad suficiente para construir la tendencia." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-5 bg-[var(--primary)]" />
              Creadas
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-5 bg-slate-400" />
              Cerradas
            </span>
          </div>

          <div className="grid grid-cols-6 gap-3">
            {points.map((point) => (
              <div key={point.monthKey} className="space-y-3 text-center">
                <div className="flex h-44 items-end justify-center gap-2 border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-3">
                  <div
                    className="w-5 bg-[var(--primary)]"
                    style={{
                      height: `${Math.max(8, (point.created / maxValue) * 100)}%`,
                    }}
                  />
                  <div
                    className="w-5 bg-slate-400"
                    style={{
                      height: `${Math.max(8, (point.closed / maxValue) * 100)}%`,
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {point.monthLabel}
                  </p>
                  <p className="text-xs text-[var(--foreground-soft)]">
                    {point.created} / {point.closed}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardSurface>
  );
}

function RankingPanel({
  description,
  items,
  title,
}: {
  description?: string;
  items: DashboardRankingItem[];
  title: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 0) || 1;

  return (
    <DashboardSurface className="space-y-4">
      <DashboardPanelHeader description={description} title={title} />

      {items.length === 0 ? (
        <MiniEmpty description="No hay registros destacados para esta vista." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const row = (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {item.label}
                  </p>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {item.value}
                  </span>
                </div>
                <div className="h-2 overflow-hidden bg-[var(--surface-muted)]">
                  <div
                    className="h-full bg-[var(--primary)]"
                    style={{
                      width: `${Math.max(10, (item.value / maxValue) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            );

            if (!item.href) {
              return <div key={`${item.id ?? item.label}`}>{row}</div>;
            }

            return (
              <Link key={`${item.id ?? item.label}`} href={item.href}>
                {row}
              </Link>
            );
          })}
        </div>
      )}
    </DashboardSurface>
  );
}

function TableShell({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <DashboardSurface className="space-y-4 px-0 py-0">
      <div className="px-5 pt-5">
        <DashboardPanelHeader description={description} title={title} />
      </div>
      {children}
    </DashboardSurface>
  );
}

function ObservationsTable({
  rows,
}: {
  rows: DashboardObservationRow[];
}) {
  if (rows.length === 0) {
    return <MiniEmpty description="No hay observaciones críticas ni vencidas en esta vista." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left">
        <thead className="bg-[var(--surface-soft)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          <tr>
            <th className="px-5 py-3">Observación</th>
            <th className="px-5 py-3">Área</th>
            <th className="px-5 py-3">Riesgo</th>
            <th className="px-5 py-3">Estado</th>
            <th className="px-5 py-3">Fecha límite</th>
            <th className="px-5 py-3">Avance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--border)] align-top">
              <td className="px-5 py-4">
                <div className="min-w-[18rem] space-y-1.5">
                  <Link className="font-semibold text-[var(--foreground)]" href={row.href}>
                    {row.title}
                  </Link>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {row.code}
                  </p>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--foreground-soft)]">{row.area.name}</td>
              <td className="px-5 py-4">
                <span
                  className={cn(
                    "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                    getRiskLevelClasses(row.riskLevel.colorToken),
                  )}
                >
                  {row.riskLevel.name}
                </span>
              </td>
              <td className="px-5 py-4">
                <span
                  className={cn(
                    "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                    getStatusClasses(row.status.key),
                  )}
                >
                  {row.status.name}
                </span>
              </td>
              <td className="px-5 py-4 text-sm">
                <span className={cn(row.isOverdue && "font-semibold text-rose-700")}>
                  {formatObservationDate(row.dueDate)}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="min-w-[9rem] space-y-2">
                  <div className="h-2 overflow-hidden bg-[var(--surface-muted)]">
                    <div
                      className="h-full bg-[var(--primary)]"
                      style={{
                        width: `${row.progressPercent}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-[var(--foreground-soft)]">
                    {row.progressPercent}%
                  </p>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CommitmentsTable({
  rows,
}: {
  rows: DashboardCommitmentRow[];
}) {
  if (rows.length === 0) {
    return <MiniEmpty description="No hay compromisos próximos a vencer en esta vista." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left">
        <thead className="bg-[var(--surface-soft)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          <tr>
            <th className="px-5 py-3">Compromiso</th>
            <th className="px-5 py-3">Observación</th>
            <th className="px-5 py-3">Responsable</th>
            <th className="px-5 py-3">Fecha límite</th>
            <th className="px-5 py-3">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--border)] align-top">
              <td className="px-5 py-4">
                <div className="min-w-[15rem] space-y-1.5">
                  <Link className="font-semibold text-[var(--foreground)]" href={row.href}>
                    {row.title}
                  </Link>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    {row.area.name}
                  </p>
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {row.observation.title}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {row.observation.code}
                  </p>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--foreground-soft)]">
                {row.responsibleUser?.name ?? "Sin responsable"}
              </td>
              <td className="px-5 py-4 text-sm">
                <span className={cn(row.isOverdue && "font-semibold text-rose-700")}>
                  {formatObservationDate(row.dueDate)}
                </span>
              </td>
              <td className="px-5 py-4">
                <span
                  className={cn(
                    "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                    getCommitmentStatusClasses(row.status.key as never),
                  )}
                >
                  {row.status.name}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewQueueTable({
  rows,
}: {
  rows: DashboardReviewQueueRow[];
}) {
  if (rows.length === 0) {
    return <MiniEmpty description="No hay elementos pendientes en esta bandeja." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left">
        <thead className="bg-[var(--surface-soft)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          <tr>
            <th className="px-5 py-3">Tipo</th>
            <th className="px-5 py-3">Detalle</th>
            <th className="px-5 py-3">Responsable</th>
            <th className="px-5 py-3">Estado</th>
            <th className="px-5 py-3">Actualizado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.kind}-${row.id}`} className="border-t border-[var(--border)] align-top">
              <td className="px-5 py-4">
                <span className="nibol-badge">{getReviewKindLabel(row.kind)}</span>
              </td>
              <td className="px-5 py-4">
                <div className="min-w-[18rem] space-y-1.5">
                  <Link className="font-semibold text-[var(--foreground)]" href={row.href}>
                    {row.title}
                  </Link>
                  <p className="text-sm text-[var(--foreground-soft)]">{row.subtitle}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    {row.areaName}
                  </p>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--foreground-soft)]">
                {row.responsibleName ?? "Sin responsable"}
              </td>
              <td className="px-5 py-4">
                <span
                  className={cn(
                    "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                    getReviewStatusClasses(row),
                  )}
                >
                  {row.status.name}
                </span>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--foreground-soft)]">
                {formatDateTime(row.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityTable({
  rows,
}: {
  rows: DashboardActivityRow[];
}) {
  if (rows.length === 0) {
    return <MiniEmpty description="No hay actualizaciones recientes para mostrar." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left">
        <thead className="bg-[var(--surface-soft)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          <tr>
            <th className="px-5 py-3">Tipo</th>
            <th className="px-5 py-3">Detalle</th>
            <th className="px-5 py-3">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.kind}-${row.id}`} className="border-t border-[var(--border)] align-top">
              <td className="px-5 py-4">
                <span className="nibol-badge">{getActivityKindLabel(row.kind)}</span>
              </td>
              <td className="px-5 py-4">
                <div className="min-w-[18rem] space-y-1.5">
                  <Link className="font-semibold text-[var(--foreground)]" href={row.href}>
                    {row.title}
                  </Link>
                  <p className="text-sm text-[var(--foreground-soft)]">{row.description}</p>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--foreground-soft)]">
                {formatDateTime(row.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const buildAuditMetricCards = (
  data: AuditDashboardData,
  referenceDate: Date,
) => {
  const dueThreshold = addDays(startOfDay(referenceDate), data.reminderDaysBeforeDue);

  return [
    {
      description: "Observaciones registradas dentro del universo corporativo visible.",
      href: "/observaciones",
      icon: <ClipboardList className="h-5 w-5" />,
      label: "Total observaciones",
      value: String(data.summary.totalObservations),
    },
    {
      description: "Observaciones activas que aún no se encuentran en estado final.",
      href: "/observaciones",
      icon: <FolderKanban className="h-5 w-5" />,
      label: "Abiertas",
      value: String(data.summary.openObservations),
    },
    {
      description: "Observaciones fuera de plazo según fecha límite y estado vigente.",
      href: "/observaciones?filter.overdue=true",
      icon: <AlertTriangle className="h-5 w-5" />,
      label: "Vencidas",
      tone: "danger" as const,
      value: String(data.summary.overdueObservations),
    },
    {
      description: `Observaciones que vencerán dentro de ${data.reminderDaysBeforeDue} días.`,
      href: `/observaciones?filter.dueDateFrom=${formatDateFilter(startOfDay(referenceDate))}&filter.dueDateTo=${formatDateFilter(dueThreshold)}`,
      icon: <CalendarClock className="h-5 w-5" />,
      label: "Próximas a vencer",
      value: String(data.summary.upcomingObservations),
    },
    {
      description: "Solicitudes de revisión pendientes entre avances y ampliaciones.",
      href: "/aprobaciones/pendientes",
      icon: <BadgeCheck className="h-5 w-5" />,
      label: "Pendientes de revisión",
      value: String(data.summary.pendingReviews),
    },
    {
      description: "Promedio de avance declarado sobre las observaciones visibles.",
      href: "/avances-evidencias",
      icon: <Gauge className="h-5 w-5" />,
      label: "Avance promedio",
      value: `${data.summary.averageProgress}%`,
    },
  ];
};

const buildAreaMetricCards = (
  data: AreaDashboardData,
  referenceDate: Date,
) => {
  const dueThreshold = addDays(startOfDay(referenceDate), data.reminderDaysBeforeDue);

  return [
    {
      description: "Observaciones asociadas directamente a su usuario o carga operativa.",
      href: "/observaciones",
      icon: <ClipboardList className="h-5 w-5" />,
      label: "Mis observaciones asignadas",
      value: String(data.summary.assignedObservations),
    },
    {
      description: "Observaciones bajo el alcance de su área o sus responsabilidades actuales.",
      href: "/observaciones",
      icon: <FolderKanban className="h-5 w-5" />,
      label: "Observaciones de mi área",
      value: String(data.summary.areaObservations),
    },
    {
      description: "Compromisos aún activos dentro del cronograma operativo visible.",
      href: "/cronograma",
      icon: <GitPullRequestArrow className="h-5 w-5" />,
      label: "Compromisos pendientes",
      value: String(data.summary.pendingCommitments),
    },
    {
      description: "Compromisos que ya superaron su fecha comprometida.",
      href: "/cronograma?filter.overdue=true",
      icon: <ShieldAlert className="h-5 w-5" />,
      label: "Compromisos vencidos",
      tone: "danger" as const,
      value: String(data.summary.overdueCommitments),
    },
    {
      description: `Compromisos que vencerán dentro de ${data.reminderDaysBeforeDue} días.`,
      href: `/cronograma?filter.dueDateFrom=${formatDateFilter(startOfDay(referenceDate))}&filter.dueDateTo=${formatDateFilter(dueThreshold)}`,
      icon: <CalendarClock className="h-5 w-5" />,
      label: "Compromisos próximos",
      value: String(data.summary.upcomingCommitments),
    },
    {
      description: "Promedio de avance consolidado sobre las observaciones visibles.",
      href: "/avances-evidencias",
      icon: <Gauge className="h-5 w-5" />,
      label: "Avance promedio",
      value: `${data.summary.averageProgress}%`,
    },
  ];
};

const buildSecondaryMetrics = (
  data: AreaDashboardData | AuditDashboardData,
) => {
  if (data.scope === "auditoria") {
    return [
      {
        description: "Observaciones en estado final dentro del periodo consultado.",
        label: "Observaciones cerradas",
        value: String(data.summary.closedObservations),
      },
      {
        description: "Solicitudes de ampliación aún dentro del flujo de aprobación.",
        href: "/ampliaciones-plazo",
        label: "Ampliaciones pendientes",
        value: String(data.summary.pendingExtensions),
      },
      {
        description: "Avances y evidencias enviados a Auditoría para dictamen.",
        href: "/avances-evidencias?filter.status=SENT_TO_AUDIT",
        label: "Avances pendientes de revisión",
        value: String(data.summary.pendingProgressReviews),
      },
    ];
  }

  return [
    {
      description: "Avances devueltos por Auditoría que requieren ajuste o corrección.",
      href: "/avances-evidencias?filter.status=RETURNED",
      label: "Avances devueltos por Auditoría",
      value: String(data.summary.returnedProgressUpdates),
    },
    {
      description: "Solicitudes de ampliación activas dentro de su flujo de aprobación.",
      href: "/ampliaciones-plazo",
      label: "Ampliaciones en proceso",
      value: String(data.summary.extensionsInProcess),
    },
  ];
};

export function DashboardView({ data }: DashboardViewProps) {
  const referenceDate = new Date(data.generatedAt);
  const metricCards =
    data.scope === "auditoria"
      ? buildAuditMetricCards(data, referenceDate)
      : buildAreaMetricCards(data, referenceDate);
  const secondaryMetrics = buildSecondaryMetrics(data);

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <span className="nibol-badge nibol-badge-primary">
              Actualizado: {formatDateTime(data.generatedAt)}
            </span>
            <DashboardRefreshButton />
          </>
        }
        description={data.subtitle}
        eyebrow={data.scope === "auditoria" ? "Auditoría" : "Área y gerencia"}
        title="Dashboard de Seguimiento"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {metricCards.map((card) => (
          <DashboardMetricCard key={card.label} {...card} />
        ))}
      </section>

      <section
        className={cn(
          "grid gap-4",
          data.scope === "auditoria" ? "xl:grid-cols-3" : "xl:grid-cols-2",
        )}
      >
        {secondaryMetrics.map((metric) => (
          <SecondaryMetric key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        <DistributionPanel
          description="Distribución actual de observaciones por criticidad."
          items={data.charts.observationsByRisk}
          title="Observaciones por nivel de riesgo"
        />
        <DistributionPanel
          description="Estados registrados según la clasificación vigente de cada observación."
          items={data.charts.observationsByStatus}
          title="Observaciones por estado"
        />
        <SplitSummaryPanel
          description="Comparativo entre observaciones vigentes y observaciones fuera de plazo."
          items={data.charts.currentVsOverdue}
          title="Vigentes vs. vencidas"
        />
        <DistributionPanel
          description="Carga distribuida por área o gerencia principal de la observación."
          items={data.charts.observationsByArea}
          title="Observaciones por área"
        />
      </section>

      {data.scope === "auditoria" ? (
        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <TrendPanel points={data.charts.monthlyTrend} />
          <RankingPanel
            description="Usuarios con mayor volumen de observaciones abiertas asignadas."
            items={data.charts.topResponsibles}
            title="Top responsables con mayor carga"
          />
          <RankingPanel
            description="Áreas con mayor cantidad de observaciones actualmente vencidas."
            items={data.charts.topOverdueAreas}
            title="Top áreas con más vencimientos"
          />
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <TableShell
          description="Observaciones prioritarias para seguimiento inmediato."
          title="Observaciones críticas o vencidas"
        >
          <ObservationsTable rows={data.tables.criticalObservations} />
        </TableShell>

        <TableShell
          description="Compromisos próximos a vencer dentro del umbral de alerta vigente."
          title="Próximos compromisos"
        >
          <CommitmentsTable rows={data.tables.upcomingCommitments} />
        </TableShell>

        <TableShell
          description={
            data.scope === "auditoria"
              ? "Bandeja consolidada de revisiones para Auditoría y control corporativo."
              : "Avances devueltos y ampliaciones activas dentro del alcance del usuario."
          }
          title={
            data.scope === "auditoria"
              ? "Pendientes de revisión"
              : "Pendientes del área"
          }
        >
          <ReviewQueueTable
            rows={
              data.scope === "auditoria"
                ? data.tables.pendingReviews
                : data.tables.reviewQueue
            }
          />
        </TableShell>

        <TableShell
          description="Últimos movimientos registrados sobre observaciones, avances y ampliaciones."
          title="Últimas actualizaciones"
        >
          <ActivityTable rows={data.tables.latestUpdates} />
        </TableShell>
      </section>

      {metricCards.length === 0 ? (
        <EmptyState
          description="No se encontraron métricas para el rol actual."
          title="Sin datos de dashboard"
        />
      ) : null}
    </main>
  );
}
