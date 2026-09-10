"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileBarChart,
  FileSearch,
  Gauge,
  ShieldAlert,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import {
  buildReportQuery,
  parseReportFilters,
  reportService,
  triggerDownload,
} from "@/services/report-service";
import type { ReportActionPlanRow, ReportFilters } from "@/types";
import {
  formatReportDate,
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
} from "./report-ui";

type ReportsDashboardProps = {
  canExport: boolean;
  canViewAudit: boolean;
};

const DEFAULT_FILTERS: ReportFilters = {
  periodField: "createdAt",
  ...getReportDateRange(12),
};

const withFilter = (
  filters: ReportFilters,
  key: keyof ReportFilters,
  value: string | boolean,
) => `/reportes${buildReportQuery({ ...filters, [key]: value })}`;

export function ReportsDashboard({
  canExport,
  canViewAudit,
}: ReportsDashboardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.toString();
  const urlFilters = useMemo(
    () => parseReportFilters(new URLSearchParams(searchQuery)),
    [searchQuery],
  );
  const initialFilters = useMemo(
    () => ({ ...DEFAULT_FILTERS, ...urlFilters }),
    [urlFilters],
  );
  const [draft, setDraft] = useState<ReportFilters>(initialFilters);
  const filters = initialFilters;
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const optionsQuery = useQuery({
    queryFn: reportService.getOptions,
    queryKey: ["reports", "options"],
    staleTime: 60_000,
  });
  const dashboardQuery = useQuery({
    queryFn: () => reportService.getDashboard(filters),
    queryKey: ["reports", "dashboard", filters],
    staleTime: 30_000,
  });

  const updateDraft = (
    key: keyof ReportFilters,
    value: string | number | boolean | undefined,
  ) => {
    setDraft((current) => {
      const next = { ...current } as Record<string, unknown>;
      if (value === undefined || value === "") delete next[key];
      else next[key] = value;
      return next as ReportFilters;
    });
  };

  const applyFilters = (next: ReportFilters) => {
    setDraft(next);
    router.replace(`${pathname}${buildReportQuery(next)}`);
  };

  const resetFilters = () => {
    setDraft(DEFAULT_FILTERS);
    applyFilters(DEFAULT_FILTERS);
  };

  const handleExport = async (format: "excel" | "pdf") => {
    if (!canExport) return;
    setExporting(format);
    setExportError(null);
    try {
      const blob = await reportService.downloadReport(filters, format, {
        reportName: "Planes de acción NIBOL",
        type: "ACTION_PLANS",
      });
      triggerDownload(
        blob,
        `planes-de-accion-${format === "excel" ? "nibol.xls" : "nibol.pdf"}`,
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
  const filterLabel = useMemo(
    () =>
      filters.dateFrom || filters.dateTo
        ? `${filters.dateFrom ?? "Inicio"} – ${filters.dateTo ?? "Hoy"}`
        : "Corte actual",
    [filters.dateFrom, filters.dateTo],
  );

  return (
    <main className="min-w-0 space-y-6">
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
                onExport={(format) => void handleExport(format)}
              />
            ) : null}
          </>
        }
        description="Indicadores y seguimiento de planes de acción. El estado de avance y el estado de plazo son dimensiones independientes."
        eyebrow="Control y seguimiento"
        title="Reportes"
      />

      <ReportFilterBar
        draft={draft}
        onApply={() => applyFilters({ ...draft })}
        onChange={updateDraft}
        onReset={resetFilters}
        options={optionsQuery.data}
        showProgress
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
      ) : dashboardQuery.isPending || !data ? (
        <ReportLoading label="Calculando indicadores y distribución del corte seleccionado…" />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ReportKpi
              description={`${filterLabel}. Planes incluidos en el alcance.`}
              href="/reportes"
              icon="total"
              label="Total de planes"
              tone="accent"
              value={formatReportNumber(data.summary.total)}
            />
            <ReportKpi
              description="Planes sin avance oficial aprobado."
              href={withFilter(filters, "progressStatus", "NOT_STARTED")}
              icon="open"
              label="No iniciado"
              value={formatReportNumber(data.summary.noIniciado)}
            />
            <ReportKpi
              description="Planes con ejecución iniciada."
              href={withFilter(filters, "progressStatus", "STARTED")}
              icon="inProcess"
              label="Iniciado"
              value={formatReportNumber(data.summary.iniciado)}
            />
            <ReportKpi
              description="Planes con avance oficial del 60%."
              href={withFilter(filters, "progressStatus", "WITH_PROGRESS")}
              icon="progress"
              label="Con avance"
              value={formatReportNumber(data.summary.conAvance)}
            />
            <ReportKpi
              description="Planes con cierre oficial al 100%."
              href={withFilter(filters, "progressStatus", "CONCLUDED")}
              icon="closed"
              label="Concluido"
              value={formatReportNumber(data.summary.concluido)}
            />
            <ReportKpi
              description="No vencidos; incluye concluidos no atrasados."
              href={withFilter(filters, "deadlineStatus", "VIGENTE")}
              icon="dueSoon"
              label="Vigentes"
              value={formatReportNumber(data.summary.vigentes)}
            />
            <ReportKpi
              description="Planes no concluidos cuya fecha efectiva ya pasó."
              href={withFilter(filters, "deadlineStatus", "VENCIDO")}
              icon="overdue"
              label="Vencidos"
              tone="danger"
              value={formatReportNumber(data.summary.vencidos)}
            />
            <ReportKpi
              description="Tienen una ampliación aprobada y fecha efectiva distinta."
              href={withFilter(filters, "reprogrammed", true)}
              icon="reprogrammed"
              label="Reprogramados"
              value={formatReportNumber(data.summary.reprogramados)}
            />
          </section>

          <section className="grid min-w-0 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <ReportPanel
              description="La fecha efectiva se toma de la ampliación aprobada cuando existe."
              title="Lectura del corte"
            >
              <ReportFilterSummary filters={filters} />
              <div className="mt-4 space-y-2 text-sm text-[var(--foreground-soft)]">
                {data.insights.map((insight) => (
                  <p key={insight}>{insight}</p>
                ))}
                {!data.insights.length ? (
                  <p>No hay planes dentro del corte.</p>
                ) : null}
              </div>
            </ReportPanel>
            <ReportPanel
              description="Cierres registrados dentro de la fecha efectiva del plan."
              title="Cumplimiento del corte"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-semibold text-[var(--foreground)]">
                    {formatReportPercent(data.summary.compliancePercent)}
                  </p>
                  <p className="mt-2 text-sm text-[var(--foreground-soft)]">
                    Planes concluidos dentro de plazo
                  </p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-[var(--success)]" />
              </div>
            </ReportPanel>
          </section>

          <section className="grid min-w-0 gap-6 xl:grid-cols-2">
            <ReportPanel
              description="Clasificación oficial del plan; no se reemplaza por el avance reportado."
              title="Distribución por estado de avance"
            >
              <ReportBarList items={data.charts.progressDistribution} />
            </ReportPanel>
            <ReportPanel
              description="Vigente o vencido según la fecha actual efectiva."
              title="Distribución por estado de plazo"
            >
              <ReportBarList items={data.charts.deadlineDistribution} />
            </ReportPanel>
            <ReportPanel
              description="Catálogo dinámico de niveles de riesgo."
              title="Distribución por riesgo"
            >
              <ReportDonut items={data.charts.riskDistribution} />
            </ReportPanel>
            <ReportPanel
              description="Indicador independiente del estado y del vencimiento."
              title="Reprogramación"
            >
              <ReportBarList items={data.charts.reprogrammedDistribution} />
            </ReportPanel>
            <ReportPanel
              description="Carga de planes por área responsable."
              title="Planes por área"
            >
              <ReportBarList items={data.charts.areaDistribution} />
            </ReportPanel>
            <ReportPanel
              description="Carga de planes por dueño del proceso."
              title="Planes por dueño del proceso"
            >
              <ReportBarList items={data.charts.processOwnerDistribution} />
            </ReportPanel>
            <ReportPanel
              className="xl:col-span-2"
              description="Carga asignada a cada ejecutor."
              title="Planes por ejecutor"
            >
              <ReportBarList items={data.charts.executorDistribution} />
            </ReportPanel>
          </section>

          <ReportPanel
            description={`${data.rows.length} plan${data.rows.length === 1 ? "" : "es"} dentro del mismo alcance de los indicadores.`}
            title="Planes de acción"
          >
            <ActionPlanTable rows={data.rows} />
          </ReportPanel>

          <ReportPanel
            description="Accesos rápidos a los flujos relacionados."
            title="Siguientes acciones"
          >
            <section className="grid gap-3 md:grid-cols-3">
              <ReportShortcut
                description="Elija columnas y descargue el resultado filtrado."
                href="/reportes/generador"
                icon={BarChart3}
                label="Generar reporte"
              />
              <ReportShortcut
                description="Revise por separado los planes vigentes y vencidos."
                href="/reportes/vigentes-vencidas"
                icon={ShieldAlert}
                label="Vigentes y vencidas"
              />
              {canViewAudit ? (
                <ReportShortcut
                  description="Consulte la trazabilidad del ciclo de control."
                  href="/reportes/auditoria"
                  icon={FileSearch}
                  label="Reportes de auditoría"
                />
              ) : null}
            </section>
          </ReportPanel>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-2 text-xs text-[var(--muted)]">
            <span>
              Los filtros se conservan en la URL y se aplican al mismo tiempo a
              KPIs, gráficos, filas y exportaciones.
            </span>
            <Link
              className="inline-flex items-center gap-1 font-semibold text-[var(--primary)] hover:underline"
              href="/planes-accion"
            >
              Abrir planes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </>
      )}
    </main>
  );
}

function statusClasses(key: ReportActionPlanRow["officialProgress"]["key"]) {
  return {
    CONCLUDED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    NOT_STARTED: "border-stone-200 bg-stone-100 text-stone-700",
    STARTED: "border-sky-200 bg-sky-50 text-sky-700",
    WITH_PROGRESS: "border-violet-200 bg-violet-50 text-violet-700",
  }[key];
}

function ActionPlanTable({ rows }: { rows: ReportActionPlanRow[] }) {
  if (!rows.length) {
    return (
      <div className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-10 text-center text-sm text-[var(--foreground-soft)]">
        No se encontraron planes de acción con los filtros actuales. Limpie los
        filtros para volver al universo completo.
      </div>
    );
  }
  return (
    <div className="-mx-2 overflow-x-auto px-2">
      <table className="min-w-[1060px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-strong)]">
            {[
              "Informe / observación",
              "Plan",
              "Área",
              "Nivel de riesgo",
              "Dueño del proceso",
              "Ejecutor",
              "Estado de avance",
              "Avance oficial",
              "Avance reportado",
              "Fecha original",
              "Fecha actual",
              "Estado de plazo",
              "Reprogramado",
              "Acción",
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
          {rows.map((row) => (
            <tr
              className="border-b border-[var(--border)] align-top last:border-0 hover:bg-[var(--surface-soft)]"
              key={row.actionPlanId}
            >
              <td className="min-w-[17rem] px-3 py-3">
                <Link
                  className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)] hover:underline"
                  href={row.href}
                >
                  {row.observation.code}
                </Link>
                <p className="mt-1 text-xs leading-5 text-[var(--foreground-soft)]">
                  {row.observation.title}
                </p>
              </td>
              <td className="max-w-[20rem] px-3 py-3 text-[var(--foreground-soft)]">
                {row.title}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {row.area.name}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {row.riskLevel.name}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {row.processOwner?.name ?? "Sin asignar"}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {row.executor?.name ?? "Sin asignar"}
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${statusClasses(row.officialProgress.key)}`}
                >
                  {row.officialProgress.label}
                </span>
              </td>
              <td className="px-3 py-3 font-semibold whitespace-nowrap text-[var(--foreground)]">
                {row.officialProgress.percent}%
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {row.reportedProgressPercent !== null
                  ? `${row.reportedProgressPercent}%`
                  : "—"}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {formatReportDate(row.originalDueDate)}
              </td>
              <td
                className={`px-3 py-3 font-semibold whitespace-nowrap ${row.deadlineStatus === "VENCIDO" ? "text-[var(--accent)]" : "text-[var(--foreground-soft)]"}`}
              >
                {formatReportDate(row.effectiveDueDate)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${row.deadlineStatus === "VENCIDO" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                >
                  {row.deadlineStatus === "VENCIDO" ? "Vencido" : "Vigente"}
                </span>
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {row.reprogrammed ? "Sí" : "No"}
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                <Link
                  className="inline-flex items-center gap-1 font-semibold text-[var(--primary)] hover:underline"
                  href={row.href}
                >
                  Ver plan <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
