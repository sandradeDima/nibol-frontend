"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { DashboardRefreshButton } from "@/modules/dashboard/dashboard-refresh-button";
import {
  buildReportQuery,
  parseReportFilters,
  reportService,
  triggerDownload,
} from "@/services/report-service";
import type {
  ReportActionPlanRow,
  ReportChartItem,
  ReportDashboardData,
  ReportFilters,
} from "@/types";
import { cn } from "@/utils";

import {
  formatReportDate,
  formatReportNumber,
  getReportChartColor,
  ReportBarList,
  ReportError,
  ReportExportButtons,
  ReportFilterBar,
  ReportKpi,
  ReportLoading,
  ReportTrend,
} from "../reports/report-ui";

type ReportingDashboardProps = {
  canExport: boolean;
};

const DEFAULT_FILTERS: ReportFilters = {};

const DASHBOARD_FILTER_KEYS = [
  "cutoffDate",
  "areaId",
  "areaResponsibleId",
  "executorId",
  "processOwnerId",
  "statusId",
] as const satisfies ReadonlyArray<keyof ReportFilters>;

const pickDashboardFilters = (filters: ReportFilters): ReportFilters =>
  Object.fromEntries(
    DASHBOARD_FILTER_KEYS.flatMap((key) =>
      filters[key] === undefined ? [] : [[key, filters[key]]],
    ),
  ) as ReportFilters;

const buildObservationDistribution = (
  rows: ReportActionPlanRow[],
  getDimension: (row: ReportActionPlanRow) => {
    colorToken?: string | null;
    key: string;
    label: string;
  },
): ReportChartItem[] => {
  const groups = new Map<
    string,
    { colorToken?: string | null; ids: Set<string>; label: string }
  >();
  const seen = new Set<string>();

  rows.forEach((row) => {
    const dimension = getDimension(row);
    const observationDimension = `${row.observationId}:${dimension.key}`;
    if (seen.has(observationDimension)) return;
    seen.add(observationDimension);

    const group = groups.get(dimension.key) ?? {
      colorToken: dimension.colorToken,
      ids: new Set<string>(),
      label: dimension.label,
    };
    group.ids.add(row.observationId);
    groups.set(dimension.key, group);
  });

  return [...groups.entries()]
    .map(([key, group]) => ({
      colorToken: group.colorToken,
      key,
      label: group.label,
      value: group.ids.size,
    }))
    .sort(
      (left, right) =>
        right.value - left.value || left.label.localeCompare(right.label, "es"),
    );
};

function DashboardPanel({
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
    <section className={cn("nibol-panel min-w-0 p-4", className)}>
      <div className="mb-4 space-y-1">
        <h2 className="font-display text-base font-bold tracking-tight text-[var(--foreground)] uppercase">
          {title}
        </h2>
        {description ? (
          <p className="text-xs leading-5 text-[var(--foreground-soft)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function CompactDonut({ items }: { items: ReportChartItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const segments = items.map((item, index) => {
    const start = cursor;
    cursor += total ? (item.value / total) * 100 : 0;
    return `${getReportChartColor(item, index)} ${start}% ${cursor}%`;
  });
  const style = {
    background: total
      ? `conic-gradient(${segments.join(", ")})`
      : "var(--surface-muted)",
  } satisfies CSSProperties;

  if (!total) {
    return (
      <p className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-3 py-6 text-center text-xs text-[var(--foreground-soft)]">
        No hay datos para este corte.
      </p>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        aria-label={`Distribución: ${total} observaciones`}
        className="relative h-24 w-24 shrink-0 rounded-full border border-[var(--border)]"
        role="img"
        style={style}
      >
        <div className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full bg-[var(--surface)] text-center">
          <span className="text-[9px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
            Total
          </span>
          <strong className="text-2xl leading-none text-[var(--foreground)]">
            {formatReportNumber(total)}
          </strong>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {items.map((item, index) => (
          <div
            className="flex min-w-0 items-center justify-between gap-2 text-xs"
            key={`${item.key}-${item.label}`}
          >
            <span className="flex min-w-0 items-center gap-2 text-[var(--foreground-soft)]">
              <span
                className="h-2 w-2 shrink-0"
                style={{ background: getReportChartColor(item, index) }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <strong className="shrink-0 text-[var(--foreground)]">
              {formatReportNumber(item.value)}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

const ADVANCE_META = [
  { code: "NI", key: "NOT_STARTED", label: "No iniciado" },
  { code: "I", key: "STARTED", label: "Iniciado" },
  { code: "CA", key: "WITH_PROGRESS", label: "Con avance" },
  { code: "CO", key: "CONCLUDED", label: "Concluido" },
] as const;

function AdvancePanel({ items }: { items: ReportChartItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="space-y-3">
      <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
        02 · Avance
      </p>
      <DashboardPanel
        description="Estados oficiales de avance dentro del alcance visible."
        title="Avance"
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {ADVANCE_META.map((meta, index) => {
            const item = items.find((entry) => entry.key === meta.key) ?? {
              key: meta.key,
              label: meta.label,
              value: 0,
            };
            const percentage = total
              ? Math.round((item.value / total) * 100)
              : 0;
            const color = getReportChartColor(item, index);
            return (
              <div
                className="flex items-center gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3"
                key={meta.key}
              >
                <div
                  className="relative h-12 w-12 shrink-0 rounded-full"
                  style={{
                    background: `conic-gradient(${color} ${percentage}%, var(--surface-muted) 0)`,
                  }}
                >
                  <div className="absolute inset-1 flex items-center justify-center rounded-full bg-[var(--surface)] text-[10px] font-bold text-[var(--foreground)]">
                    {percentage}%
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--accent)] uppercase">
                    {meta.code}
                  </p>
                  <p className="truncate text-xs text-[var(--foreground-soft)]">
                    {meta.label}
                  </p>
                  <p className="text-xl leading-none font-semibold text-[var(--foreground)]">
                    {formatReportNumber(item.value)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </DashboardPanel>
    </section>
  );
}

function DistributionPanel({
  description,
  items,
  title,
}: {
  description: string;
  items: ReportChartItem[];
  title: string;
}) {
  return (
    <DashboardPanel description={description} title={title}>
      <ReportBarList items={items.slice(0, 6)} />
      {items.length > 6 ? (
        <p className="mt-3 text-[11px] text-[var(--muted)]">
          +{formatReportNumber(items.length - 6)} categorías adicionales
        </p>
      ) : null}
    </DashboardPanel>
  );
}

function OperationalObservations({
  items,
}: {
  items: ReportDashboardData["operational"]["criticalOrOverdueObservations"];
}) {
  if (!items.length) {
    return (
      <p className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-3 py-6 text-center text-xs text-[var(--foreground-soft)]">
        No hay observaciones críticas o vencidas.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="border-b border-[var(--border)] text-[10px] tracking-[0.12em] text-[var(--muted)] uppercase">
          <tr>
            <th className="pr-3 pb-2 font-semibold">Observación</th>
            <th className="pr-3 pb-2 font-semibold">Área</th>
            <th className="pr-3 pb-2 font-semibold">Riesgo</th>
            <th className="pr-3 pb-2 font-semibold">Estado</th>
            <th className="pr-3 pb-2 font-semibold">Fecha límite</th>
            <th className="pb-2 text-right font-semibold">Avance</th>
            <th className="sticky right-0 border-l border-[var(--border)] bg-[var(--surface)] pb-2 pl-3 text-right font-semibold">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="max-w-[260px] py-2.5 pr-3">
                <Link
                  className="font-semibold text-[var(--primary)] hover:underline"
                  href={item.href}
                >
                  {item.title}
                </Link>
              </td>
              <td className="py-2.5 pr-3 text-[var(--foreground-soft)]">
                {item.area.name}
              </td>
              <td className="py-2.5 pr-3 text-[var(--foreground-soft)]">
                {item.riskLevel.name}
              </td>
              <td className="py-2.5 pr-3 text-[var(--foreground-soft)]">
                {item.status.name}
              </td>
              <td className="py-2.5 pr-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {formatReportDate(item.dueDate)}
              </td>
              <td className="py-2.5 text-right font-semibold text-[var(--foreground)]">
                {item.progressPercent}%
              </td>
              <td className="sticky right-0 border-l border-[var(--border)] bg-[var(--surface)] py-2.5 pl-3 text-right">
                <Link
                  aria-label={`Ver detalle de ${item.title}`}
                  className="font-semibold whitespace-nowrap text-[var(--primary)] hover:underline"
                  href={item.href}
                >
                  Ver detalle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UpcomingActionPlans({
  items,
}: {
  items: ReportDashboardData["operational"]["upcomingActionPlans"];
}) {
  if (!items.length) {
    return (
      <p className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-3 py-6 text-center text-xs text-[var(--foreground-soft)]">
        No hay planes próximos a vencer.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-xs">
        <thead className="border-b border-[var(--border)] text-[10px] tracking-[0.12em] text-[var(--muted)] uppercase">
          <tr>
            <th className="pr-3 pb-2 font-semibold">Plan de acción</th>
            <th className="pr-3 pb-2 font-semibold">Observación</th>
            <th className="pr-3 pb-2 font-semibold">Ejecutor</th>
            <th className="pr-3 pb-2 font-semibold">Avance</th>
            <th className="pb-2 font-semibold">Fecha efectiva</th>
            <th className="sticky right-0 border-l border-[var(--border)] bg-[var(--surface)] pb-2 pl-3 text-right font-semibold">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((item) => (
            <tr key={item.actionPlanId}>
              <td className="max-w-[190px] py-2.5 pr-3">
                <Link
                  className="font-semibold text-[var(--primary)] hover:underline"
                  href={item.href}
                >
                  {item.title}
                </Link>
              </td>
              <td className="py-2.5 pr-3 text-[var(--foreground-soft)]">
                {item.observationCode}
              </td>
              <td className="py-2.5 pr-3 text-[var(--foreground-soft)]">
                {item.executorName}
              </td>
              <td className="py-2.5 pr-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {item.progress.code} · {item.progress.percent}%
              </td>
              <td className="py-2.5 whitespace-nowrap text-[var(--foreground-soft)]">
                {formatReportDate(item.effectiveDueDate)}
              </td>
              <td className="sticky right-0 border-l border-[var(--border)] bg-[var(--surface)] py-2.5 pl-3 text-right">
                <Link
                  aria-label={`Ver detalle de ${item.title}`}
                  className="font-semibold whitespace-nowrap text-[var(--primary)] hover:underline"
                  href={item.href}
                >
                  Ver detalle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const getObservationCharts = (data: ReportDashboardData) => ({
  byArea: buildObservationDistribution(data.rows, (row) => ({
    key: row.area.id,
    label: row.area.name,
  })),
  byExecutor: buildObservationDistribution(data.rows, (row) => ({
    key: row.executor?.id ?? "unassigned",
    label: row.executor?.name ?? "Sin asignar",
  })),
  byProcessOwner: buildObservationDistribution(data.rows, (row) => ({
    key: row.processOwner?.id ?? "unassigned",
    label: row.processOwner?.name ?? "Sin asignar",
  })),
  byResponsible: buildObservationDistribution(data.rows, (row) => ({
    key: row.areaResponsible?.id ?? "unassigned",
    label: row.areaResponsible?.name ?? "Sin asignar",
  })),
  byRisk: buildObservationDistribution(data.rows, (row) => ({
    colorToken: row.riskLevel.colorToken,
    key: row.riskLevel.key,
    label: row.riskLevel.name,
  })),
});

export function ReportingDashboard({ canExport }: ReportingDashboardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.toString();
  const urlFilters = useMemo(
    () =>
      pickDashboardFilters(
        parseReportFilters(new URLSearchParams(searchQuery)),
      ),
    [searchQuery],
  );
  const filters = useMemo(
    () => ({ ...DEFAULT_FILTERS, ...urlFilters }),
    [urlFilters],
  );
  const [draft, setDraft] = useState<ReportFilters>(filters);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const optionsQuery = useQuery({
    queryFn: reportService.getOptions,
    queryKey: ["reports", "options"],
    staleTime: 60_000,
  });
  const dashboardQuery = useQuery({
    queryFn: () => reportService.getDashboard(filters),
    queryKey: ["dashboard-reporteria", "dashboard", filters],
    staleTime: 30_000,
  });

  const updateDraft = (
    key: keyof ReportFilters,
    value: string | string[] | number | boolean | undefined,
  ) => {
    setDraft((current) => {
      const next = { ...current } as Record<string, unknown>;
      if (value === undefined || value === "") delete next[key];
      else next[key] = value;
      return pickDashboardFilters(next as ReportFilters);
    });
  };

  const applyFilters = (next: ReportFilters) => {
    const clean = pickDashboardFilters({
      ...next,
      cutoffDate: next.cutoffDate ?? optionsQuery.data?.defaultCutoffDate,
    });
    setDraft(clean);
    router.replace(`${pathname}${buildReportQuery(clean)}`);
  };

  const resetFilters = () => applyFilters(DEFAULT_FILTERS);

  const handleExport = async (format: "excel" | "pdf") => {
    if (!canExport) return;
    setExporting(format);
    setExportError(null);
    try {
      const blob = await reportService.downloadReport(filters, format, {
        reportName: "Dashboard de reportería NIBOL",
        type: "ACTION_PLANS",
      });
      triggerDownload(
        blob,
        `dashboard-reporteria-${format === "excel" ? "nibol.xlsx" : "nibol.pdf"}`,
      );
    } catch {
      setExportError(
        "No fue posible preparar la descarga. Intente nuevamente.",
      );
    } finally {
      setExporting(null);
    }
  };

  const data = dashboardQuery.data;
  const observationCharts = useMemo(
    () => (data ? getObservationCharts(data) : null),
    [data],
  );

  return (
    <main className="min-w-0 space-y-4 pb-8">
      <PageHeader
        actions={
          <>
            <DashboardRefreshButton />
            {canExport ? (
              <ReportExportButtons
                disabled={exporting !== null}
                loading={exporting !== null}
                onExport={(format) => void handleExport(format)}
              />
            ) : null}
          </>
        }
        compact
        description="Resumen y seguimiento de observaciones de auditoría."
        eyebrow="Dashboard de reportería"
        title="Observaciones"
      />

      <ReportFilterBar
        compact
        dashboardOnly
        defaultCutoffDate={
          data?.cutoffDate ?? optionsQuery.data?.defaultCutoffDate
        }
        draft={draft}
        onApply={() => applyFilters(draft)}
        onChange={updateDraft}
        onReset={resetFilters}
        options={optionsQuery.data}
      />

      {exportError ? (
        <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {exportError}
        </div>
      ) : null}

      {optionsQuery.isError || dashboardQuery.isError ? (
        <ReportError
          onRetry={() => {
            void optionsQuery.refetch();
            void dashboardQuery.refetch();
          }}
        />
      ) : dashboardQuery.isPending || !data || !observationCharts ? (
        <ReportLoading label="Calculando indicadores y distribución del alcance visible…" />
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                  01 · Resumen de observaciones
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-soft)]">
                  Indicadores calculados con corte a{" "}
                  {formatReportDate(data.cutoffDate)}. Cada observación se
                  cuenta una sola vez dentro del alcance autorizado.
                </p>
              </div>
              <span className="hidden text-xs text-[var(--muted)] sm:block">
                {formatReportNumber(data.summary.totalObservations)} registros
              </span>
            </div>
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <ReportKpi
                description="Observaciones dentro del alcance autorizado."
                icon="total"
                label="Total observaciones"
                tone="accent"
                value={formatReportNumber(data.summary.totalObservations)}
              />
              <ReportKpi
                description="Observaciones cuyo estado todavía no es final."
                icon="open"
                label="Pendientes"
                value={formatReportNumber(data.summary.pendingObservations)}
              />
              <ReportKpi
                description="Observaciones con estado final registrado."
                icon="closed"
                label="Cerradas"
                value={formatReportNumber(data.summary.closedObservations)}
              />
              <DashboardPanel
                className="h-full"
                description="Distribución según el catálogo canónico de riesgo."
                title="Nivel de riesgo"
              >
                <CompactDonut items={observationCharts.byRisk} />
              </DashboardPanel>
            </section>
          </section>

          <AdvancePanel items={data.charts.progressDistribution} />

          <section className="space-y-3">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                03 · Observaciones por…
              </p>
              <p className="mt-1 text-sm text-[var(--foreground-soft)]">
                Distribución de observaciones visibles por cada relación del
                dominio.
              </p>
            </div>
            <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <DistributionPanel
                description="Cantidad de observaciones del alcance filtrado."
                items={observationCharts.byArea}
                title="Observaciones por área"
              />
              <DistributionPanel
                description="Cantidad de observaciones del alcance filtrado."
                items={observationCharts.byResponsible}
                title="Observaciones por Responsable de Área"
              />
              <DistributionPanel
                description="Cantidad de observaciones del alcance filtrado."
                items={observationCharts.byProcessOwner}
                title="Observaciones por Dueño del Proceso"
              />
              <DistributionPanel
                description="Cantidad de observaciones del alcance filtrado."
                items={observationCharts.byExecutor}
                title="Observaciones por Ejecutor"
              />
            </section>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                  04 · Planes por…
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-soft)]">
                  Planes de acción agrupados por sus relaciones canónicas.
                </p>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--muted)]">
                <span>Total {formatReportNumber(data.summary.total)}</span>
                <span>
                  Vigentes {formatReportNumber(data.summary.vigentes)}
                </span>
                <span>
                  Vencidos {formatReportNumber(data.summary.vencidos)}
                </span>
                <span>
                  Reprogramados {formatReportNumber(data.summary.reprogramados)}
                </span>
              </div>
            </div>
            <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <DistributionPanel
                description="Planes ligados al área de la observación."
                items={data.charts.areaDistribution}
                title="Planes por área"
              />
              <DistributionPanel
                description="Planes ligados al responsable del área."
                items={data.charts.areaResponsibleDistribution}
                title="Planes por Responsable de Área"
              />
              <DistributionPanel
                description="Planes ligados al dueño del proceso."
                items={data.charts.processOwnerDistribution}
                title="Planes por Dueño del Proceso"
              />
              <DistributionPanel
                description="Planes agrupados por el ejecutor asignado."
                items={data.charts.executorDistribution}
                title="Planes por Ejecutor"
              />
            </section>
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                05 · Analítica complementaria
              </p>
            </div>
            <section className="grid gap-3 xl:grid-cols-3">
              <DashboardPanel
                description="Planes creados y concluidos por mes dentro del alcance."
                title="Tendencia mensual"
              >
                <ReportTrend points={data.charts.trend} />
              </DashboardPanel>
              <DistributionPanel
                description="Responsables de área con mayor carga abierta."
                items={data.charts.topResponsibleWorkload ?? []}
                title="Top responsables con mayor carga"
              />
              <DistributionPanel
                description="Áreas ordenadas por planes vencidos."
                items={data.charts.topOverdueAreas ?? []}
                title="Top áreas con más vencimientos"
              />
            </section>
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                06 · Operación
              </p>
            </div>
            <section className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
              <DashboardPanel
                description="Observaciones de riesgo alto/crítico o con vencimiento detectado."
                title="Observaciones críticas o vencidas"
              >
                <OperationalObservations
                  items={data.operational.criticalOrOverdueObservations}
                />
              </DashboardPanel>
              <DashboardPanel
                description="Planes no concluidos dentro de la ventana de atención próxima."
                title="Próximos planes de acción"
              >
                <UpcomingActionPlans
                  items={data.operational.upcomingActionPlans}
                />
              </DashboardPanel>
            </section>
          </section>
        </>
      )}
    </main>
  );
}
