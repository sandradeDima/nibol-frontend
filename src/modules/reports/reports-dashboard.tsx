"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  FileBarChart,
  FileSearch,
  Gauge,
  ShieldAlert,
  Sparkles,
  TableProperties,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { QUERY_KEYS } from "@/lib/constants";
import { configurationService } from "@/services/configuration-service";
import { reportService, triggerDownload } from "@/services/report-service";
import type { ReportFilters } from "@/types";
import {
  formatReportNumber,
  formatReportPercent,
  getReportDateRange,
  ReportBarList,
  ReportDonut,
  ReportError,
  ReportExportButtons,
  ReportFilterBar,
  ReportFilterSummary,
  ReportKpi,
  ReportLoading,
  ReportPanel,
  ReportShortcut,
  ReportTrend,
} from "./report-ui";

type ReportsDashboardProps = {
  canExport: boolean;
  canViewAudit: boolean;
};

const DEFAULT_FILTERS: ReportFilters = {
  periodField: "createdAt",
  ...getReportDateRange(12),
};

export function ReportsDashboard({
  canExport,
  canViewAudit,
}: ReportsDashboardProps) {
  const [draft, setDraft] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const optionsQuery = useQuery({
    queryFn: configurationService.getBootstrap,
    queryKey: QUERY_KEYS.configurationBootstrap,
    staleTime: 60_000,
  });
  const dashboardQuery = useQuery({
    queryFn: () => reportService.getDashboard(filters),
    queryKey: [...QUERY_KEYS.reportDashboard, filters],
    staleTime: 30_000,
  });

  const updateDraft = (
    key: keyof ReportFilters,
    value: string | number | boolean | undefined,
  ) => {
    setDraft((current) => {
      const next = { ...current } as Record<string, unknown>;
      if (value === undefined || value === "") {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next as ReportFilters;
    });
  };

  const resetFilters = () => {
    setDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
  };

  const handleExport = async (format: "excel" | "pdf") => {
    if (!canExport) return;
    setExporting(format);
    setExportError(null);
    try {
      const blob = await reportService.downloadReport(filters, format, {
        reportName: "Dashboard de reportes NIBOL",
        type: "OBSERVATIONS",
      });
      triggerDownload(
        blob,
        `reporte-nibol-${format === "excel" ? "operativo.xls" : "operativo.pdf"}`,
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
  const filterLabel = useMemo(() => {
    if (!filters.dateFrom && !filters.dateTo) return "Corte actual";
    return `${filters.dateFrom ?? "Inicio"} – ${filters.dateTo ?? "Hoy"}`;
  }, [filters.dateFrom, filters.dateTo]);

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="nibol-btn-secondary px-4 py-2.5 text-sm"
              href="/reportes/generador"
            >
              <FileBarChart className="h-4 w-4" /> Generar reporte
            </Link>
            <Link
              className="nibol-btn-secondary px-4 py-2.5 text-sm"
              href="/reportes/vigentes-vencidas"
            >
              <Gauge className="h-4 w-4" /> Vigentes y vencidas
            </Link>
            {canViewAudit ? (
              <Link
                className="nibol-btn-secondary px-4 py-2.5 text-sm"
                href="/reportes/auditoria"
              >
                <FileSearch className="h-4 w-4" /> Auditoría
              </Link>
            ) : null}
            {canExport ? (
              <ReportExportButtons
                disabled={exporting !== null}
                onExport={(format) => {
                  void handleExport(format);
                }}
              />
            ) : null}
          </>
        }
        description="Lectura ejecutiva y operativa del cumplimiento, los vencimientos y la capacidad de respuesta por área."
        eyebrow="Control y seguimiento"
        title="Reportes"
      />

      <ReportFilterBar
        draft={draft}
        onApply={() => setFilters({ ...draft })}
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
            void dashboardQuery.refetch();
            void optionsQuery.refetch();
          }}
        />
      ) : dashboardQuery.isPending || !data ? (
        <ReportLoading label="Calculando indicadores y distribución del corte seleccionado…" />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ReportKpi
              description={`${filterLabel}. Cierre dentro de plazo.`}
              icon="compliance"
              label="Cumplimiento"
              tone="accent"
              value={formatReportPercent(data.summary.compliancePercent)}
            />
            <ReportKpi
              description="Total de observaciones visibles para su alcance."
              href="/observaciones"
              icon="total"
              label="Total"
              value={formatReportNumber(data.summary.total)}
            />
            <ReportKpi
              description="Observaciones todavía abiertas o pendientes."
              href="/observaciones?filter.attention=HAS_PENDING"
              icon="open"
              label="Abiertas"
              value={formatReportNumber(data.summary.open)}
            />
            <ReportKpi
              description="Requieren decisión o intervención prioritaria."
              href="/observaciones?filter.overdue=true"
              icon="overdue"
              label="Vencidas"
              tone="danger"
              value={formatReportNumber(data.summary.overdue)}
            />
            <ReportKpi
              description={`Vencen dentro de los próximos ${data.dueSoonDays} días.`}
              href="/observaciones?filter.dueSoon=true"
              icon="dueSoon"
              label="Próximas a vencer"
              value={formatReportNumber(data.summary.dueSoon)}
            />
            <ReportKpi
              description="Observaciones actualmente en atención activa."
              icon="inProcess"
              label="En proceso"
              value={formatReportNumber(data.summary.inProcess)}
            />
            <ReportKpi
              description="Observaciones con estado final registrado."
              icon="closed"
              label="Cerradas"
              value={formatReportNumber(data.summary.closed)}
            />
            <ReportKpi
              description="Promedio desde el registro hasta el cierre."
              icon="resolution"
              label="Resolución promedio"
              value={`${formatReportNumber(data.summary.averageResolutionDays)} días`}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <ReportPanel
              description="Lectura automática de los puntos que merecen atención en el corte actual."
              title="Hallazgos del corte"
            >
              <div className="space-y-3">
                {data.insights.length > 0 ? (
                  data.insights.map((insight) => (
                    <div
                      className="flex items-start gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
                      key={insight}
                    >
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                      <p className="text-sm leading-6 text-[var(--foreground-soft)]">
                        {insight}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--foreground-soft)]">
                    No hay observaciones suficientes para sugerir un foco.
                  </p>
                )}
              </div>
            </ReportPanel>
            <ReportPanel
              description="Los filtros y el alcance aplicado a este resumen."
              title="Corte consultado"
            >
              <ReportFilterSummary filters={filters} />
              <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
                <TableProperties className="h-4 w-4" />
                Actualizado{" "}
                {new Intl.DateTimeFormat("es-BO", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(data.generatedAt))}
              </div>
            </ReportPanel>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ReportPanel
              description="Distribución del universo según el nivel de riesgo configurado."
              title="Distribución por riesgo"
            >
              <ReportDonut items={data.charts.riskDistribution} />
            </ReportPanel>
            <ReportPanel
              description="Estado operativo, con vencidas separadas como prioridad."
              title="Distribución por estado"
            >
              <ReportBarList items={data.charts.statusDistribution} />
            </ReportPanel>
            <ReportPanel
              description="Vigentes, próximas a vencer y vencidas en el mismo corte."
              title="Vigentes versus vencidas"
            >
              <ReportBarList items={data.charts.currentVsOverdue} />
            </ReportPanel>
            <ReportPanel
              description="Tendencia mensual de registros y cierres del período."
              title="Tendencia mensual"
            >
              <ReportTrend points={data.charts.trend} />
            </ReportPanel>
          </section>

          <ReportPanel
            description="Comparación de carga, vencimientos, cierres y tiempo medio de resolución."
            title="Desempeño por área"
          >
            {data.areaSummary.length === 0 ? (
              <div className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-10 text-center text-sm text-[var(--foreground-soft)]">
                No hay áreas con observaciones en el período.
              </div>
            ) : (
              <div className="-mx-2 overflow-x-auto px-2">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-strong)]">
                      {[
                        "Área",
                        "Total",
                        "Abiertas",
                        "En proceso",
                        "Vencidas",
                        "Cerradas",
                        "Cumplimiento",
                        "Resolución",
                      ].map((label) => (
                        <th
                          className="px-3 py-3 text-[10px] font-semibold tracking-[0.15em] whitespace-nowrap text-[var(--muted)] uppercase"
                          key={label}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.areaSummary.map((area) => (
                      <tr
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-soft)]"
                        key={area.area.id}
                      >
                        <td className="px-3 py-3 font-semibold text-[var(--foreground)]">
                          <Link
                            className="hover:text-[var(--accent)] hover:underline"
                            href={area.href}
                          >
                            {area.area.name}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-[var(--foreground-soft)]">
                          {formatReportNumber(area.total)}
                        </td>
                        <td className="px-3 py-3 text-[var(--foreground-soft)]">
                          {formatReportNumber(area.open)}
                        </td>
                        <td className="px-3 py-3 text-[var(--foreground-soft)]">
                          {formatReportNumber(area.inProcess)}
                        </td>
                        <td className="px-3 py-3 font-semibold text-[var(--accent)]">
                          {formatReportNumber(area.overdue)}
                        </td>
                        <td className="px-3 py-3 text-[var(--foreground-soft)]">
                          {formatReportNumber(area.closed)}
                        </td>
                        <td className="px-3 py-3 font-semibold text-[var(--foreground)]">
                          {formatReportPercent(area.compliancePercent)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-[var(--foreground-soft)]">
                          {formatReportNumber(area.averageResolutionDays)} días
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ReportPanel>

          <section className="grid gap-3 md:grid-cols-3">
            <ReportShortcut
              description="Elija un tipo de reporte y descargue el resultado en Excel o PDF."
              href="/reportes/generador"
              icon={BarChart3}
              label="Generador de reportes"
            />
            <ReportShortcut
              description="Vea primero lo que está vigente, próximo a vencer o vencido."
              href="/reportes/vigentes-vencidas"
              icon={ShieldAlert}
              label="Vigentes y vencidas"
            />
            {canViewAudit ? (
              <ReportShortcut
                description="Consulte la trazabilidad con lenguaje de negocio y filtros de auditoría."
                href="/reportes/auditoria"
                icon={FileSearch}
                label="Reportes de auditoría"
              />
            ) : null}
          </section>

          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-2 text-xs text-[var(--muted)]">
            <span>
              El cumplimiento se calcula con cierres registrados dentro de su
              fecha límite.
            </span>
            <Link
              className="inline-flex items-center gap-1 font-semibold text-[var(--primary)] hover:underline"
              href="/observaciones"
            >
              Abrir observaciones <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
