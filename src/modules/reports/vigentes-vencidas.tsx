"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  TriangleAlert,
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
  const view: AttentionView = urlFilters.dueSoon
    ? "dueSoon"
    : urlFilters.deadlineStatus === "VENCIDO"
      ? "overdue"
      : "current";
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const filters = initialFilters;
  const optionsQuery = useQuery({
    queryFn: reportService.getOptions,
    queryKey: ["reports", "options"],
    staleTime: 60_000,
  });
  const dashboardQuery = useQuery({
    queryFn: () => reportService.getDashboard(filters),
    queryKey: ["reports", "dashboard", "attention", filters],
    staleTime: 30_000,
  });
  const listFilters: ReportFilters =
    view === "overdue"
      ? { ...filters, deadlineStatus: "VENCIDO", dueSoon: undefined }
      : view === "dueSoon"
        ? {
            ...filters,
            deadlineStatus: "VIGENTE",
            dueSoon: true,
          }
        : {
            ...filters,
            deadlineStatus: filters.deadlineStatus ?? "VIGENTE",
            dueSoon: undefined,
          };
  const plansQuery = useQuery({
    queryFn: () => reportService.listActionPlans(listFilters, 1, 100),
    queryKey: ["reports", "attention-list", view, listFilters],
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
      return next as ReportFilters;
    });
  };

  const applyFilters = (next: ReportFilters) => {
    setDraft(next);
    router.replace(`${pathname}${buildReportQuery(next)}`);
  };

  const reset = () => {
    setDraft(DEFAULT_FILTERS);
    applyFilters(DEFAULT_FILTERS);
  };

  const handleExport = async (format: "excel" | "pdf") => {
    if (!canExport) return;
    setExporting(format);
    setExportError(null);
    try {
      const blob = await reportService.downloadReport(listFilters, format, {
        reportName:
          view === "overdue"
            ? "Planes de acción vencidos"
            : view === "dueSoon"
              ? "Planes de acción próximos a vencer"
              : "Planes de acción vigentes",
        type: "ACTION_PLANS",
      });
      triggerDownload(
        blob,
        `planes-${view}-${format === "excel" ? "nibol.xlsx" : "nibol.pdf"}`,
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
    <main className="min-w-0 space-y-6">
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
                disabled={exporting !== null || plansQuery.isPending}
                loading={exporting !== null}
                onExport={(format) => void handleExport(format)}
              />
            ) : null}
          </>
        }
        description="Bandeja de planes de acción para distinguir lo vigente, lo próximo a vencer y lo vencido. El estado de avance permanece visible por separado."
        eyebrow="Reportes"
        title="Vigentes y vencidas"
      />

      <ReportFilterBar
        draft={draft}
        onApply={() => applyFilters({ ...draft })}
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
            description="Planes no vencidos, incluidos los concluidos."
            icon="total"
            label="Vigentes"
            value={formatReportNumber(dashboard.summary.vigentes)}
          />
          <ReportKpi
            description={`Dentro de los próximos ${dashboard.dueSoonDays} días.`}
            icon="dueSoon"
            label="Próximas a vencer"
            value={formatReportNumber(dashboard.summary.dueSoon)}
          />
          <ReportKpi
            description="Planes no concluidos con fecha efectiva pasada."
            icon="overdue"
            label="Vencidos"
            tone="danger"
            value={formatReportNumber(dashboard.summary.vencidos)}
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
              ["overdue", "Vencidos", TriangleAlert],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              className={`flex items-center gap-3 border px-4 py-3 text-left transition ${view === key ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-soft)] hover:border-[var(--primary)]"}`}
              key={key}
              onClick={() => {
                const nextFilters: ReportFilters =
                  key === "overdue"
                    ? {
                        ...filters,
                        deadlineStatus: "VENCIDO",
                        dueSoon: undefined,
                      }
                    : key === "dueSoon"
                      ? { ...filters, deadlineStatus: "VIGENTE", dueSoon: true }
                      : {
                          ...filters,
                          deadlineStatus: "VIGENTE",
                          dueSoon: undefined,
                        };
                applyFilters(nextFilters);
              }}
              type="button"
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-semibold">{label}</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5" />
            </button>
          ))}
        </div>
        <div className="mt-5">
          {plansQuery.isError ? (
            <ReportError onRetry={() => void plansQuery.refetch()} />
          ) : plansQuery.isPending ? (
            <ReportLoading label="Cargando planes de acción de la bandeja…" />
          ) : (
            <AttentionTable rows={plansQuery.data?.data ?? []} view={view} />
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
  rows: ReportActionPlanRow[];
  view: AttentionView;
}) {
  if (!rows.length) {
    return (
      <div className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-10 text-center text-sm text-[var(--foreground-soft)]">
        No hay planes de acción en esta bandeja con los filtros actuales.
      </div>
    );
  }
  return (
    <div className="-mx-2 overflow-x-auto px-2">
      <table className="min-w-[950px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-strong)]">
            {[
              "Atención",
              "Informe / observación",
              "Plan",
              "Área",
              "Ejecutor",
              "Estado de avance",
              "Avance oficial",
              "Avance reportado",
              "Fecha original",
              "Fecha actual",
              "Estado de plazo",
              "Reprogramado",
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
              <td className="px-3 py-3">
                <span
                  className={`inline-flex border px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] whitespace-nowrap uppercase ${row.deadlineStatus === "VENCIDO" ? "border-rose-200 bg-rose-50 text-rose-700" : view === "dueSoon" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                >
                  {row.deadlineStatus === "VENCIDO"
                    ? "Prioridad"
                    : view === "dueSoon"
                      ? "Próximo"
                      : "En plazo"}
                </span>
              </td>
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
              <td className="max-w-[18rem] px-3 py-3 text-[var(--foreground-soft)]">
                {row.title}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {row.area.name}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {row.executor?.name ?? "Sin asignar"}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {row.officialProgress.label}
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
              <td className="px-3 py-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {row.deadlineStatus === "VENCIDO" ? "Vencido" : "Vigente"}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-[var(--foreground-soft)]">
                {row.reprogrammed ? "Sí" : "No"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
