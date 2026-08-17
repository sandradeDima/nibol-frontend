"use client";

import { useState } from "react";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  TriangleAlert,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { QUERY_KEYS } from "@/lib/constants";
import { configurationService } from "@/services/configuration-service";
import { reportService, triggerDownload } from "@/services/report-service";
import type { ReportFilters, ReportObservationRow } from "@/types";
import { cn } from "@/utils";
import {
  formatReportDate,
  formatReportNumber,
  getReportDateRange,
  ReportError,
  ReportExportButtons,
  ReportFilterBar,
  ReportKpi,
  ReportLoading,
  ReportPanel,
} from "./report-ui";

type VigentesVencidasProps = {
  canExport: boolean;
};

type AttentionView = "current" | "dueSoon" | "overdue";

const DEFAULT_FILTERS: ReportFilters = {
  periodField: "currentDueDate",
  ...getReportDateRange(12),
};

export function VigentesVencidas({ canExport }: VigentesVencidasProps) {
  const [draft, setDraft] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<AttentionView>("current");
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const optionsQuery = useQuery({
    queryFn: configurationService.getBootstrap,
    queryKey: QUERY_KEYS.configurationBootstrap,
    staleTime: 60_000,
  });
  const dashboardQuery = useQuery({
    queryFn: () => reportService.getDashboard(filters),
    queryKey: [...QUERY_KEYS.reportDashboard, "vigentes", filters],
    staleTime: 30_000,
  });
  const listFilters: ReportFilters =
    view === "overdue"
      ? { ...filters, overdue: true, dueSoon: undefined }
      : view === "dueSoon"
        ? { ...filters, dueSoon: true, overdue: undefined }
        : {
            ...filters,
            activeOnly: true,
            overdue: undefined,
            dueSoon: undefined,
          };
  const observationsQuery = useQuery({
    queryFn: () => reportService.listObservations(listFilters, 1, 100),
    queryKey: ["reports", "attention-list", view, listFilters],
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

  const reset = () => {
    setDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
  };

  const handleExport = async (format: "excel" | "pdf") => {
    if (!canExport) return;
    setExporting(format);
    setExportError(null);
    try {
      const blob = await reportService.downloadReport(listFilters, format, {
        reportName:
          view === "overdue"
            ? "Observaciones vencidas"
            : view === "dueSoon"
              ? "Observaciones próximas a vencer"
              : "Observaciones vigentes",
        type: "OBSERVATIONS",
      });
      triggerDownload(
        blob,
        `observaciones-${view}-${format === "excel" ? "nibol.xls" : "nibol.pdf"}`,
      );
    } catch {
      setExportError(
        "No fue posible preparar la descarga. Intente nuevamente.",
      );
    } finally {
      setExporting(null);
    }
  };

  const dashboard = dashboardQuery.data;
  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="nibol-btn-secondary px-4 py-2.5 text-sm"
              href="/reportes"
            >
              <ArrowLeft className="h-4 w-4" /> Volver a reportes
            </Link>
            {canExport ? (
              <ReportExportButtons
                disabled={exporting !== null || observationsQuery.isPending}
                onExport={(format) => {
                  void handleExport(format);
                }}
              />
            ) : null}
          </>
        }
        description="Una bandeja de atención para distinguir lo que sigue vigente, lo que se acerca a su fecha límite y lo que ya requiere una decisión."
        eyebrow="Reportes"
        title="Vigentes y vencidas"
      />

      <ReportFilterBar
        draft={draft}
        onApply={() => setFilters({ ...draft })}
        onChange={updateDraft}
        onReset={reset}
        options={optionsQuery.data}
      />
      {exportError ? (
        <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {exportError}
        </div>
      ) : null}

      {dashboardQuery.isError || optionsQuery.isError ? (
        <ReportError
          onRetry={() => {
            void dashboardQuery.refetch();
            void optionsQuery.refetch();
          }}
        />
      ) : dashboardQuery.isPending || !dashboard ? (
        <ReportLoading label="Calculando la situación de fechas del período…" />
      ) : (
        <section className="grid gap-3 md:grid-cols-3">
          <ReportKpi
            description="Observaciones abiertas que aún están dentro de su plazo."
            icon="total"
            label="Vigentes"
            value={formatReportNumber(
              Math.max(0, dashboard.summary.open - dashboard.summary.overdue),
            )}
          />
          <ReportKpi
            description={`Vencen dentro de los próximos ${dashboard.dueSoonDays} días.`}
            icon="dueSoon"
            label="Próximas a vencer"
            value={formatReportNumber(dashboard.summary.dueSoon)}
          />
          <ReportKpi
            description="Tienen fecha límite vencida o estado de vencimiento."
            href="/observaciones?filter.overdue=true"
            icon="overdue"
            label="Vencidas"
            tone="danger"
            value={formatReportNumber(dashboard.summary.overdue)}
          />
        </section>
      )}

      <ReportPanel
        description="Cambie de vista para priorizar la conversación operativa."
        title="Bandeja de atención"
      >
        <div className="grid gap-2 border-b border-[var(--border)] pb-5 sm:grid-cols-3">
          {(
            [
              ["current", "Vigentes", CheckCircle2],
              ["dueSoon", "Próximas a vencer", Clock3],
              ["overdue", "Vencidas", TriangleAlert],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              className={cn(
                "flex items-center gap-3 border px-4 py-3 text-left transition",
                view === key
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-soft)] hover:border-[var(--primary)]",
              )}
              key={key}
              onClick={() => setView(key)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-semibold">{label}</span>
              <ArrowUpRight className="ml-auto h-3.5 w-3.5" />
            </button>
          ))}
        </div>
        <div className="mt-5">
          {observationsQuery.isError ? (
            <ReportError
              onRetry={() => {
                void observationsQuery.refetch();
              }}
            />
          ) : observationsQuery.isPending ? (
            <ReportLoading label="Cargando observaciones de la bandeja…" />
          ) : (
            <AttentionTable
              rows={observationsQuery.data?.data ?? []}
              view={view}
            />
          )}
        </div>
      </ReportPanel>
    </main>
  );
}

function AttentionTable({
  rows,
  view,
}: {
  rows: ReportObservationRow[];
  view: AttentionView;
}) {
  return rows.length === 0 ? (
    <div className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-10 text-center text-sm text-[var(--foreground-soft)]">
      No hay observaciones en esta bandeja con los filtros actuales.
    </div>
  ) : (
    <div className="-mx-2 overflow-x-auto px-2">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-strong)]">
            {[
              "Atención",
              "Observación",
              "Área",
              "Responsable",
              "Riesgo",
              "Fecha límite",
              "Estado",
              "Avance",
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
              className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-soft)]"
              key={row.id}
            >
              <td className="px-3 py-3 align-top">
                <AttentionBadge row={row} view={view} />
              </td>
              <td className="min-w-[18rem] px-3 py-3 align-top">
                <Link
                  className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)] hover:underline"
                  href={`/observaciones/${row.id}`}
                >
                  {row.code}
                </Link>
                <p className="mt-1 text-xs leading-5 text-[var(--foreground-soft)]">
                  {row.title}
                </p>
              </td>
              <td className="px-3 py-3 align-top whitespace-nowrap text-[var(--foreground-soft)]">
                {row.area.name}
              </td>
              <td className="px-3 py-3 align-top whitespace-nowrap text-[var(--foreground-soft)]">
                {row.responsibleUser?.name ?? "Sin asignar"}
              </td>
              <td className="px-3 py-3 align-top whitespace-nowrap text-[var(--foreground-soft)]">
                {row.riskLevel.name}
              </td>
              <td
                className={cn(
                  "px-3 py-3 align-top whitespace-nowrap",
                  row.isOverdue
                    ? "font-semibold text-[var(--accent)]"
                    : "text-[var(--foreground-soft)]",
                )}
              >
                {formatReportDate(row.dueDate)}
              </td>
              <td className="px-3 py-3 align-top whitespace-nowrap text-[var(--foreground-soft)]">
                {row.effectiveStatus.name}
              </td>
              <td className="min-w-[8rem] px-3 py-3 align-top">
                <div className="space-y-1.5">
                  <div className="h-2 overflow-hidden bg-[var(--surface-muted)]">
                    <div
                      className="h-full bg-[var(--primary)]"
                      style={{ width: `${row.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[var(--foreground-soft)]">
                    {row.progressPercent}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AttentionBadge({
  row,
  view,
}: {
  row: ReportObservationRow;
  view: AttentionView;
}) {
  const summary = row.actionSummary;
  const label =
    view === "overdue"
      ? "Prioridad"
      : summary?.count
        ? `${summary.count} pendientes`
        : "En plazo";
  return (
    <span
      className={cn(
        "inline-flex border px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] whitespace-nowrap uppercase",
        row.isOverdue || view === "overdue"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : summary?.count
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {label}
    </span>
  );
}
