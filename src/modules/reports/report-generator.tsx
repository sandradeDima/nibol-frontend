"use client";

import { useState } from "react";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ClipboardList,
  FileBarChart,
  FileText,
  Layers3,
  ListChecks,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { QUERY_KEYS } from "@/lib/constants";
import { configurationService } from "@/services/configuration-service";
import { reportService, triggerDownload } from "@/services/report-service";
import type { ReportFilters, ReportPreviewData, ReportType } from "@/types";
import {
  REPORT_TYPE_META,
  ReportDataTable,
  ReportError,
  ReportExportButtons,
  ReportFilterBar,
  ReportFilterSummary,
  ReportKpi,
  ReportLoading,
  ReportPanel,
} from "./report-ui";

type ReportGeneratorProps = {
  canExport: boolean;
};

const DEFAULT_FILTERS: ReportFilters = {
  periodField: "createdAt",
};

const TYPE_ICONS = [
  ClipboardList,
  ListChecks,
  Layers3,
  FileText,
  FileBarChart,
  ShieldCheck,
  ListChecks,
  ShieldCheck,
];

export function ReportGenerator({ canExport }: ReportGeneratorProps) {
  const [draft, setDraft] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [reportName, setReportName] = useState("Reporte operativo NIBOL");
  const [type, setType] = useState<ReportType>("OBSERVATIONS");
  const [submitted, setSubmitted] = useState<{
    filters: ReportFilters;
    reportName: string;
    type: ReportType;
  } | null>(null);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const optionsQuery = useQuery({
    queryFn: configurationService.getBootstrap,
    queryKey: QUERY_KEYS.configurationBootstrap,
    staleTime: 60_000,
  });
  const previewMutation = useMutation<
    ReportPreviewData,
    Error,
    { filters: ReportFilters; reportName: string; type: ReportType }
  >({
    mutationFn: (input) =>
      reportService.getPreview(input.filters, {
        reportName: input.reportName,
        type: input.type,
      }),
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
    setSubmitted(null);
    previewMutation.reset();
  };

  const preview = () => {
    const input = {
      filters: { ...draft },
      reportName: reportName.trim() || "Reporte operativo NIBOL",
      type,
    };
    setSubmitted(input);
    previewMutation.mutate(input);
  };

  const handleExport = async (format: "excel" | "pdf") => {
    if (!canExport || !submitted) return;
    setExporting(format);
    setExportError(null);
    try {
      const blob = await reportService.downloadReport(
        submitted.filters,
        format,
        {
          reportName: submitted.reportName,
          type: submitted.type,
        },
      );
      triggerDownload(
        blob,
        `reporte-${submitted.type.toLowerCase()}-${format === "excel" ? "nibol.xls" : "nibol.pdf"}`,
      );
    } catch {
      setExportError(
        "No fue posible preparar la descarga. Intente nuevamente.",
      );
    } finally {
      setExporting(null);
    }
  };

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
                disabled={
                  !submitted || previewMutation.isPending || exporting !== null
                }
                onExport={(format) => {
                  void handleExport(format);
                }}
              />
            ) : null}
          </>
        }
        description="Construya un reporte de negocio con filtros claros, revise el resultado y descargue la versión que necesita compartir."
        eyebrow="Reportes"
        title="Generador de reportes"
      />

      {optionsQuery.isError ? (
        <ReportError
          onRetry={() => {
            void optionsQuery.refetch();
          }}
        />
      ) : null}
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <ReportPanel
            description="Seleccione el resultado que quiere preparar para seguimiento o comité."
            title="Tipo de reporte"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {REPORT_TYPE_META.map((meta, index) => {
                const Icon = TYPE_ICONS[index] ?? FileBarChart;
                const selected = meta.type === type;
                return (
                  <button
                    className={`flex items-start gap-3 border p-4 text-left transition ${selected ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[var(--shadow-panel)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]"}`}
                    key={meta.type}
                    onClick={() => setType(meta.type)}
                    type="button"
                  >
                    <span
                      className={`mt-0.5 p-2 ${selected ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-soft)] text-[var(--primary)]"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--foreground)]">
                        {meta.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[var(--foreground-soft)]">
                        {meta.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </ReportPanel>
          <ReportPanel
            description="El nombre ayuda a identificar el archivo cuando se comparte fuera del sistema."
            title="Identificación"
          >
            <label className="block space-y-2">
              <span className="report-field-label">Nombre del reporte</span>
              <input
                className="nibol-field text-sm"
                onChange={(event) => setReportName(event.target.value)}
                value={reportName}
              />
            </label>
          </ReportPanel>
          <ReportFilterBar
            draft={draft}
            onApply={preview}
            onChange={updateDraft}
            onReset={reset}
            options={optionsQuery.data}
            showProgress
          />
          <button
            className="nibol-btn-primary w-full justify-center px-4 py-3 text-sm"
            disabled={previewMutation.isPending}
            onClick={preview}
            type="button"
          >
            <FileBarChart className="h-4 w-4" />
            {previewMutation.isPending
              ? "Preparando vista previa…"
              : "Previsualizar reporte"}
          </button>
        </div>

        <div className="space-y-6">
          <ReportPanel
            description="La vista previa usa el mismo servicio que las exportaciones y respeta su alcance."
            title="Resumen del resultado"
          >
            {!previewMutation.data && !previewMutation.isPending ? (
              <div className="space-y-4">
                <div className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-5 py-10 text-center">
                  <FileBarChart className="mx-auto h-8 w-8 text-[var(--muted)]" />
                  <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
                    Aún no hay una vista previa
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--foreground-soft)]">
                    Elija el tipo, ajuste los filtros y presione “Previsualizar
                    reporte”.
                  </p>
                </div>
                <ReportFilterSummary filters={draft} />
              </div>
            ) : null}
            {previewMutation.isPending ? (
              <ReportLoading label="Consultando datos y armando la vista previa…" />
            ) : null}
            {previewMutation.isError ? (
              <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                No fue posible preparar la vista previa. Revise el rango o los
                filtros.
              </div>
            ) : null}
            {previewMutation.data ? (
              <ReportPreviewSummary
                data={previewMutation.data}
                filters={submitted?.filters ?? {}}
              />
            ) : null}
          </ReportPanel>
          {previewMutation.data ? (
            <ReportPanel
              description={`${previewMutation.data.total} registro${previewMutation.data.total === 1 ? "" : "s"} encontrados.`}
              title="Registros del reporte"
            >
              <ReportDataTable
                columns={previewMutation.data.columns}
                rows={previewMutation.data.rows}
              />
            </ReportPanel>
          ) : null}
        </div>
      </section>
      {exportError ? (
        <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {exportError}
        </div>
      ) : null}
    </main>
  );
}

function ReportPreviewSummary({
  data,
  filters,
}: {
  data: ReportPreviewData;
  filters: ReportFilters;
}) {
  const typeLabel =
    REPORT_TYPE_META.find((meta) => meta.type === data.reportType)?.label ??
    "Reporte operativo";
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <ReportKpi
          description="Registros que cumplen los filtros del reporte."
          icon="total"
          label="Registros"
          value={new Intl.NumberFormat("es-BO").format(data.total)}
        />
        <ReportKpi
          description="Cumplimiento del corte base de observaciones."
          icon="compliance"
          label="Cumplimiento"
          value={`${Math.round(data.summary.compliancePercent)}%`}
        />
      </div>
      <div className="border-t border-[var(--border)] pt-4">
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
          Reporte preparado
        </p>
        <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
          {data.reportName}
        </p>
        <p className="mt-1 text-sm text-[var(--foreground-soft)]">
          {typeLabel}
        </p>
      </div>
      <ReportFilterSummary filters={filters} />
    </div>
  );
}
