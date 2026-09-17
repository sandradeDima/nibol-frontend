import type { ReactNode } from "react";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import type { OperationalDashboardData } from "@/types";
import { cn } from "@/utils";

import {
  formatObservationDate,
  getRiskLevelClasses,
  getRiskLevelStyle,
  getStatusClasses,
} from "../observations/presentation";

type OperationalDashboardProps = {
  canViewApprovals: boolean;
  canViewExtensions: boolean;
  data: OperationalDashboardData;
};

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

function MetricCard({
  description,
  href,
  icon,
  label,
  value,
}: {
  description: string;
  href?: string;
  icon: ReactNode;
  label: string;
  value: number;
}) {
  const content = (
    <article className="flex h-full flex-col justify-between gap-3 border border-[var(--border)] bg-white p-4 transition hover:border-[var(--primary)] hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--primary)]">
          {icon}
        </span>
      </div>
      <p className="text-xs leading-5 text-[var(--foreground-soft)]">
        {description}
      </p>
    </article>
  );

  return href ? (
    <Link className="block h-full" href={href}>
      {content}
    </Link>
  ) : (
    content
  );
}

export function OperationalDashboard({
  canViewApprovals,
  canViewExtensions,
  data,
}: OperationalDashboardProps) {
  const cards = [
    {
      description: "Dentro del alcance visible del usuario.",
      href: data.links.allObservations,
      icon: <ClipboardList className="h-5 w-5" />,
      label: "Total observaciones",
      value: data.summary.totalObservations,
    },
    {
      description: "Observaciones abiertas dentro del alcance visible.",
      href: data.links.pendingObservations,
      icon: <AlertTriangle className="h-5 w-5" />,
      label: "Pendientes",
      value: data.summary.pendingObservations,
    },
    {
      description: "Observaciones cerradas y validadas por Auditoría.",
      href: data.links.concludedObservations,
      icon: <CheckCircle2 className="h-5 w-5" />,
      label: "Concluidas",
      value: data.summary.concludedObservations,
    },
  ];

  const priorities = [
    {
      href: data.links.overdueObservations,
      icon: <AlertTriangle className="h-4 w-4" />,
      label: "Vencidas",
      value: data.summary.overdueObservations,
    },
    ...(canViewExtensions
      ? [
          {
            href: data.links.pendingExtensions,
            icon: <CalendarClock className="h-4 w-4" />,
            label: "Ampliaciones pendientes",
            value: data.summary.pendingExtensions,
          },
        ]
      : []),
    {
      href: data.links.pendingProgressReviews,
      icon: <Clock3 className="h-4 w-4" />,
      label: "Avances pendientes de revisión",
      value: data.summary.pendingProgressReviews,
    },
    ...(canViewApprovals
      ? [
          {
            href: data.links.pendingApprovals,
            icon: <ClipboardCheck className="h-4 w-4" />,
            label: "Aprobaciones pendientes",
            value: data.summary.pendingApprovals,
          },
        ]
      : []),
  ];

  return (
    <main className="space-y-3">
      <PageHeader
        actions={
          <span className="nibol-badge nibol-badge-primary">
            Actualizado: {formatDateTime(data.generatedAt)}
          </span>
        }
        description="Prioridades operativas, vencimientos y próximos pasos dentro de su alcance."
        eyebrow="Control y seguimiento"
        compact
        title="Dashboard"
      />

      <section className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>

        <section className="nibol-panel-dark p-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
                Acciones prioritarias
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Accesos rápidos según su rol y alcance.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300" />
          </div>
          <div className="mt-4 grid gap-2">
            {priorities.map((priority) => (
              <Link
                className="flex items-center justify-between gap-3 border border-white/10 bg-white/6 px-3 py-2.5 text-sm transition hover:bg-white/10"
                href={priority.href}
                key={priority.label}
              >
                <span className="flex items-center gap-2 text-slate-200">
                  {priority.icon}
                  {priority.label}
                </span>
                <span className="flex items-center gap-2 font-semibold text-white">
                  {priority.value}
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </section>

      <section className="nibol-panel overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <div>
            <p className="nibol-eyebrow">Siguiente acción</p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
              Observaciones que requieren atención
            </h2>
            <p className="mt-1 text-xs text-[var(--foreground-soft)]">
              Ordenadas por vencimiento y actividad pendiente.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
            href={data.links.allObservations}
          >
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {data.attention.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[50rem] text-left text-xs">
              <thead className="bg-[var(--surface-soft)] text-xs font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
                <tr>
                  <th className="px-4 py-2">Informe / Obs.</th>
                  <th className="px-4 py-2">Título</th>
                  <th className="px-4 py-2">Nivel</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2">Progreso</th>
                  <th className="px-4 py-2">Fecha límite</th>
                  <th className="px-4 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.attention.map((row) => (
                  <tr
                    className="align-top hover:bg-[var(--surface-soft)]"
                    key={row.id}
                  >
                    <td className="px-4 py-2.5 font-semibold whitespace-nowrap text-[var(--foreground)]">
                      {row.code}
                    </td>
                    <td className="max-w-[20rem] px-4 py-2.5">
                      <p className="truncate font-semibold text-[var(--foreground)]">
                        {row.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {row.area.name}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "inline-flex border px-2 py-1 text-xs font-semibold",
                          getRiskLevelClasses(),
                        )}
                        style={getRiskLevelStyle(row.riskLevel.colorToken)}
                      >
                        {row.riskLevel.name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "inline-flex border px-2 py-1 text-xs font-semibold",
                          getStatusClasses(row.status.key),
                        )}
                      >
                        {row.status.name}
                      </span>
                    </td>
                    <td className="min-w-32 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                          <div
                            className="h-full bg-[var(--primary)]"
                            style={{ width: `${row.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold">
                          {row.progressPercent}%
                        </span>
                      </div>
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 whitespace-nowrap",
                        row.isOverdue && "font-semibold text-[var(--accent)]",
                      )}
                    >
                      {formatObservationDate(row.dueDate)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        className="inline-flex items-center gap-1 font-semibold text-[var(--primary)] hover:underline"
                        href={row.href}
                      >
                        Ver <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-[var(--foreground-soft)]">
            No hay observaciones que requieran atención inmediata.
          </div>
        )}
      </section>
    </main>
  );
}
