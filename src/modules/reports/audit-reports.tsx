"use client";

import { useState } from "react";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Download,
  FileSearch,
  History,
  Search,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { QUERY_KEYS } from "@/lib/constants";
import { configurationService } from "@/services/configuration-service";
import { reportService, triggerDownload } from "@/services/report-service";
import type { AuditReportQuery } from "@/types";
import { cn } from "@/utils";
import {
  AUDIT_TEMPLATE_META,
  formatReportDate,
  formatReportNumber,
  ReportDataTable,
  ReportError,
  ReportExportButtons,
  ReportLoading,
  ReportOptionSelect,
  ReportPanel,
} from "./report-ui";

type AuditReportsProps = {
  canExport: boolean;
};

const DEFAULT_QUERY: AuditReportQuery = {
  page: 1,
  perPage: 100,
  template: "HISTORY",
};

export function AuditReports({ canExport }: AuditReportsProps) {
  const [draft, setDraft] = useState<AuditReportQuery>(DEFAULT_QUERY);
  const [query, setQuery] = useState<AuditReportQuery>(DEFAULT_QUERY);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const optionsQuery = useQuery({
    queryFn: reportService.getAuditOptions,
    queryKey: [...QUERY_KEYS.reportAudit, "options"],
    staleTime: 60_000,
  });
  const observationOptionsQuery = useQuery({
    queryFn: configurationService.getBootstrap,
    queryKey: QUERY_KEYS.configurationBootstrap,
    staleTime: 60_000,
  });
  const reportQuery = useQuery({
    queryFn: () => reportService.getAuditReport(query),
    queryKey: [...QUERY_KEYS.reportAudit, query],
    staleTime: 30_000,
  });

  const updateDraft = (
    key: keyof AuditReportQuery,
    value: string | number | undefined,
  ) => {
    setDraft((current) => {
      const next = { ...current } as Record<string, unknown>;
      if (value === undefined || value === "") delete next[key];
      else next[key] = value;
      return next as AuditReportQuery;
    });
  };

  const apply = () => setQuery({ ...draft, page: 1, perPage: 100 });
  const reset = () => {
    setDraft(DEFAULT_QUERY);
    setQuery(DEFAULT_QUERY);
  };

  const handleExport = async (format: "excel" | "pdf") => {
    if (!canExport) return;
    setExporting(format);
    setExportError(null);
    try {
      const blob = await reportService.downloadAuditReport(query, format);
      triggerDownload(
        blob,
        `reporte-auditoria-${query.template?.toLowerCase() ?? "historial"}-${format === "excel" ? "nibol.xlsx" : "nibol.pdf"}`,
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
                disabled={reportQuery.isPending || exporting !== null}
                loading={exporting !== null}
                onExport={(format) => {
                  void handleExport(format);
                }}
              />
            ) : null}
          </>
        }
        description="Consulte la trazabilidad de observaciones con nombres de negocio: quién actuó, qué cambió, qué se aprobó y qué requiere atención."
        eyebrow="Gobierno y trazabilidad"
        title="Reportes de auditoría"
      />

      {exportError ? (
        <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {exportError}
        </div>
      ) : null}
      {optionsQuery.isError || observationOptionsQuery.isError ? (
        <ReportError
          onRetry={() => {
            void optionsQuery.refetch();
            void observationOptionsQuery.refetch();
          }}
        />
      ) : null}

      <ReportPanel
        description="Elija la pregunta de control que quiere responder con la trazabilidad."
        title="Plantilla de auditoría"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {AUDIT_TEMPLATE_META.map((meta) => {
            const selected = draft.template === meta.template;
            return (
              <button
                className={cn(
                  "flex items-start gap-3 border p-4 text-left transition",
                  selected
                    ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]",
                )}
                key={meta.template}
                onClick={() => {
                  updateDraft("template", meta.template);
                  setQuery((current) => ({
                    ...current,
                    template: meta.template,
                    page: 1,
                  }));
                }}
                type="button"
              >
                <span
                  className={cn(
                    "mt-0.5 p-2",
                    selected
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-soft)] text-[var(--primary)]",
                  )}
                >
                  <FileSearch className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--foreground)]">
                    {meta.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--foreground-soft)]">
                    {meta.description}
                  </span>
                </span>
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-[var(--muted)]" />
              </button>
            );
          })}
        </div>
      </ReportPanel>

      <AuditFilterBar
        draft={draft}
        onApply={apply}
        onChange={updateDraft}
        onReset={reset}
        options={optionsQuery.data}
        observationOptions={observationOptionsQuery.data}
      />

      <ReportPanel
        description="Los resultados se muestran en lenguaje de negocio y se pueden llevar a Excel o PDF."
        title={
          AUDIT_TEMPLATE_META.find((meta) => meta.template === query.template)
            ?.label ?? "Historial"
        }
      >
        {reportQuery.isError ? (
          <ReportError
            onRetry={() => {
              void reportQuery.refetch();
            }}
          />
        ) : reportQuery.isPending || !reportQuery.data ? (
          <ReportLoading label="Consultando trazabilidad y preparando la línea de tiempo…" />
        ) : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <ReportKpiLike
                icon={History}
                label="Registros"
                value={formatReportNumber(reportQuery.data.summary.total)}
              />
              {reportQuery.data.summary.overdue !== undefined ? (
                <ReportKpiLike
                  icon={ShieldCheck}
                  label="Incumplimientos"
                  value={formatReportNumber(reportQuery.data.summary.overdue)}
                />
              ) : null}
              <ReportKpiLike
                icon={CheckCircle2}
                label="Corte"
                value={query.dateFrom || query.dateTo ? "Filtrado" : "Actual"}
              />
            </div>
            {reportQuery.data.timeline?.length ? (
              <AuditTimeline rows={reportQuery.data.timeline} />
            ) : null}
            <ReportDataTable
              columns={reportQuery.data.columns}
              rows={reportQuery.data.rows}
            />
          </>
        )}
      </ReportPanel>
    </main>
  );
}

function ReportKpiLike({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof History;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
      <span className="bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] font-semibold tracking-[0.15em] text-[var(--muted)] uppercase">
          {label}
        </p>
        <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function AuditFilterBar({
  draft,
  observationOptions,
  onApply,
  onChange,
  onReset,
  options,
}: {
  draft: AuditReportQuery;
  observationOptions?: Awaited<
    ReturnType<typeof configurationService.getBootstrap>
  >;
  onApply: () => void;
  onChange: (
    key: keyof AuditReportQuery,
    value: string | number | undefined,
  ) => void;
  onReset: () => void;
  options?: Awaited<ReturnType<typeof reportService.getAuditOptions>>;
}) {
  return (
    <form
      className="nibol-panel space-y-4 p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-[var(--primary-soft)] p-2.5 text-[var(--primary)]">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-base font-bold text-[var(--foreground)] uppercase">
              Filtros de auditoría
            </p>
            <p className="text-xs leading-5 text-[var(--muted)]">
              Acote el período, la observación, el área, el usuario o el
              resultado.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
          <Download className="h-3.5 w-3.5" />
          La exportación usa este mismo corte
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
          <ReportOptionSelect
            onChange={(value) => onChange("areaId", value || undefined)}
            options={(options?.areas ?? []).map((area) => ({
              id: area.id,
              label: area.name,
            }))}
            placeholder="Todas las áreas"
            value={draft.areaId ?? ""}
          />
        </label>
        <label className="space-y-2">
          <span className="report-field-label">Usuario</span>
          <ReportOptionSelect
            onChange={(value) => onChange("userId", value || undefined)}
            options={(options?.users ?? []).map((user) => ({
              id: user.id,
              label: user.name,
            }))}
            placeholder="Todos los usuarios"
            value={draft.userId ?? ""}
          />
        </label>
        <label className="space-y-2">
          <span className="report-field-label">Observación</span>
          <ReportOptionSelect
            onChange={(value) => onChange("observationId", value || undefined)}
            options={(options?.observations ?? []).map((observation) => ({
              id: observation.id,
              label: `${observation.code} · ${observation.title}`,
            }))}
            placeholder="Todas las observaciones"
            value={draft.observationId ?? ""}
          />
        </label>
        <label className="space-y-2">
          <span className="report-field-label">Evento</span>
          <ReportOptionSelect
            onChange={(value) => onChange("eventType", value || undefined)}
            options={(options?.eventTypes ?? []).map((eventType) => ({
              id: eventType.key,
              label: eventType.label,
            }))}
            placeholder="Todos los eventos"
            value={draft.eventType ?? ""}
          />
        </label>
        <label className="space-y-2">
          <span className="report-field-label">Resultado</span>
          <ReportOptionSelect
            onChange={(value) => onChange("result", value || undefined)}
            options={[
              { id: "Aprobado", label: "Aprobado" },
              { id: "Rechazado", label: "Rechazado" },
              {
                id: "Corrección solicitada",
                label: "Corrección solicitada",
              },
              { id: "Completado", label: "Completado" },
              { id: "Registrado", label: "Registrado" },
            ]}
            placeholder="Todos los resultados"
            value={draft.result ?? ""}
          />
        </label>
        <label className="relative space-y-2">
          <span className="report-field-label">Buscar</span>
          <Search className="pointer-events-none absolute top-[2.55rem] left-3 h-4 w-4 text-[var(--muted)]" />
          <input
            className="nibol-field h-11 pl-9 text-sm"
            onChange={(event) =>
              onChange("search", event.target.value || undefined)
            }
            placeholder="Código o descripción"
            type="search"
            value={draft.search ?? ""}
          />
        </label>
        <label className="space-y-2">
          <span className="report-field-label">Riesgo</span>
          <ReportOptionSelect
            onChange={(value) => onChange("riskLevelId", value || undefined)}
            options={(observationOptions?.riskLevels ?? []).map((risk) => ({
              id: risk.id,
              label: risk.name,
            }))}
            placeholder="Todos los riesgos"
            value={draft.riskLevelId ?? ""}
          />
        </label>
        <label className="space-y-2">
          <span className="report-field-label">Estado</span>
          <ReportOptionSelect
            onChange={(value) => onChange("status", value || undefined)}
            options={(observationOptions?.statuses ?? []).map((status) => ({
              id: status.key,
              label: status.name,
            }))}
            placeholder="Todos los estados"
            value={draft.status ?? ""}
          />
        </label>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
        <button
          className="nibol-btn-secondary px-4 py-2.5 text-sm"
          onClick={onReset}
          type="button"
        >
          Limpiar
        </button>
        <button className="nibol-btn-primary px-4 py-2.5 text-sm" type="submit">
          Aplicar filtros
        </button>
      </div>
    </form>
  );
}

function AuditTimeline({
  rows,
}: {
  rows: Array<{
    actor: string;
    area: string;
    date: string;
    description: string;
    result: string;
    title: string;
  }>;
}) {
  return (
    <div className="mb-6 border-l-2 border-[var(--border-strong)] pl-5">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
        <History className="h-4 w-4" /> Línea de tiempo
      </div>
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div className="relative" key={`${row.date}-${index}`}>
            <span className="absolute top-1.5 -left-[1.65rem] h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-[var(--primary)]" />
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {row.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--foreground-soft)]">
                  {row.description}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {row.actor} · {row.area} · {row.result}
                </p>
              </div>
              <time className="shrink-0 text-xs text-[var(--muted)]">
                {formatReportDate(row.date)}
              </time>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
