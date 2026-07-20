"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download, List, Search, Table2 } from "lucide-react";

import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { entityActivityService, type EntityActivityFilters } from "@/services/entity-activity-service";
import { configurationService } from "@/services/configuration-service";
import { userService } from "@/services/user-service";
import type { EntityActivity } from "@/types";

import { activityTypeLabels } from "./entity-activity-timeline";

const entityLabels: Record<string, string> = {
  COMMENT: "Comentario",
  COMMITMENT: "Compromiso",
  EVIDENCE: "Evidencia",
  EXTENSION_REQUEST: "Ampliacion",
  NOTIFICATION: "Notificacion",
  OBSERVATION: "Observacion",
  PROGRESS_UPDATE: "Avance",
  REMEDIATION_PLAN: "Plan de remediacion",
};

const dateLabel = (value: string) => new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const actorLabel = (activity: EntityActivity) => activity.actor?.name ?? (activity.actorType === "CRON" ? "Proceso programado" : "Sistema");

export function ActivityPage({ canExport, canViewTechnical }: { canExport: boolean; canViewTechnical: boolean }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [view, setView] = useState<"timeline" | "table">("timeline");
  const [filters, setFilters] = useState<EntityActivityFilters>({ search: "" });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const usersQuery = useQuery({ queryFn: userService.getUserOptions, queryKey: QUERY_KEYS.userOptions, staleTime: 60_000 });
  const configurationQuery = useQuery({ queryFn: configurationService.getBootstrap, queryKey: QUERY_KEYS.configurationBootstrap, staleTime: 60_000 });
  const queryFilters = useMemo(() => ({ ...filters, includeTechnicalDetails: canViewTechnical, page, pageSize }), [canViewTechnical, filters, page, pageSize]);
  const activityQuery = useQuery({ queryFn: () => entityActivityService.list(queryFilters), queryKey: [...QUERY_KEYS.entityActivity, queryFilters] });

  const updateFilter = (key: keyof EntityActivityFilters, value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value || undefined }));
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await entityActivityService.export({ ...filters, includeTechnicalDetails: canViewTechnical });
    } catch {
      setExportError("No fue posible exportar la actividad con estos filtros.");
    } finally {
      setExporting(false);
    }
  };

  if (activityQuery.isError) return <ErrorState description="No fue posible cargar la actividad consolidada." title="Actividad no disponible" />;
  const activities = activityQuery.data?.data ?? [];
  const pagination = activityQuery.data?.pagination ?? { page, perPage: pageSize, total: 0 };

  return (
    <div className="space-y-5">
      <section className="nibol-panel border-t-4 border-t-[var(--primary)] p-5 sm:p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="md:col-span-2 xl:col-span-2">
            <span className="nibol-field-label">Buscar en actividad</span>
            <span className="relative block"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" /><input className="nibol-field w-full pl-9" onChange={(event) => updateFilter("search", event.target.value)} placeholder="Código, título, acción o responsable" value={filters.search ?? ""} /></span>
          </label>
          <label><span className="nibol-field-label">Tipo de actividad</span><select className="nibol-field w-full" onChange={(event) => updateFilter("activityType", event.target.value)} value={filters.activityType ?? ""}><option value="">Todos</option>{Object.entries(activityTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span className="nibol-field-label">Entidad</span><select className="nibol-field w-full" onChange={(event) => updateFilter("entityType", event.target.value)} value={filters.entityType ?? ""}><option value="">Todas</option>{Object.entries(entityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span className="nibol-field-label">Origen</span><select className="nibol-field w-full" onChange={(event) => updateFilter("origin", event.target.value)} value={filters.origin ?? ""}><option value="">Todos</option><option value="USER">Usuario</option><option value="SYSTEM">Sistema / cron</option></select></label>
          <label><span className="nibol-field-label">Usuario</span><select className="nibol-field w-full" onChange={(event) => updateFilter("actorUserId", event.target.value)} value={filters.actorUserId ?? ""}><option value="">Todos</option>{(usersQuery.data ?? []).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
          <label><span className="nibol-field-label">Área</span><select className="nibol-field w-full" onChange={(event) => updateFilter("areaId", event.target.value)} value={filters.areaId ?? ""}><option value="">Todas</option>{(configurationQuery.data?.areas ?? []).map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label>
          <label><span className="nibol-field-label">Desde</span><input className="nibol-field w-full" onChange={(event) => updateFilter("dateFrom", event.target.value)} type="date" value={filters.dateFrom ?? ""} /></label>
          <label><span className="nibol-field-label">Hasta</span><input className="nibol-field w-full" onChange={(event) => updateFilter("dateTo", event.target.value)} type="date" value={filters.dateTo ?? ""} /></label>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
          <p className="text-sm text-stone-600">{pagination.total} eventos visibles según su alcance de autorización.</p>
          <div className="flex flex-wrap gap-2">
            <button className={view === "timeline" ? "nibol-btn-primary px-3 py-2 text-sm" : "nibol-btn-secondary px-3 py-2 text-sm"} onClick={() => setView("timeline")} type="button"><List className="h-4 w-4" /> Línea de tiempo</button>
            <button className={view === "table" ? "nibol-btn-primary px-3 py-2 text-sm" : "nibol-btn-secondary px-3 py-2 text-sm"} onClick={() => setView("table")} type="button"><Table2 className="h-4 w-4" /> Tabla</button>
            {canExport ? <button className="nibol-btn-secondary px-3 py-2 text-sm" disabled={exporting} onClick={() => { void handleExport(); }} type="button"><Download className="h-4 w-4" /> {exporting ? "Exportando…" : "Exportar CSV"}</button> : null}
          </div>
        </div>
        {exportError ? <p className="mt-3 text-sm text-rose-700">{exportError}</p> : null}
      </section>

      <section className="nibol-panel p-5 sm:p-6">
        {activityQuery.isPending ? <p className="py-8 text-sm text-stone-500">Cargando actividad…</p> : activities.length === 0 ? <p className="py-8 text-sm text-stone-600">No hay actividad para los filtros seleccionados.</p> : view === "timeline" ? <ol className="space-y-5">{activities.map((activity) => <li className="border-b border-stone-200 pb-5 last:border-0 last:pb-0" key={activity.id ?? `${activity.createdAt}-${activity.title}`}><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-stone-950">{activityTypeLabels[activity.activityType] ?? activity.title}</p><p className="mt-1 text-sm text-stone-600">{activity.description ?? activity.title}</p><p className="mt-2 text-xs text-stone-500">{actorLabel(activity)} · {entityLabels[activity.entityType] ?? activity.entityType}{activity.observation ? ` · ${activity.observation.code}` : ""}{activity.area ? ` · ${activity.area.name}` : ""}</p>{activity.targetUrl ? <Link className="mt-2 inline-block text-xs font-semibold text-[var(--primary)] hover:underline" href={activity.targetUrl}>Abrir referencia →</Link> : null}</div><time className="shrink-0 text-xs text-stone-500">{dateLabel(activity.createdAt)}</time></div></li>)}</ol> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-stone-200 text-xs uppercase tracking-[0.14em] text-stone-500"><th className="px-3 py-3">Fecha</th><th className="px-3 py-3">Actividad</th><th className="px-3 py-3">Observación</th><th className="px-3 py-3">Responsable</th><th className="px-3 py-3">Origen</th><th className="px-3 py-3">Referencia</th></tr></thead><tbody>{activities.map((activity) => <tr className="border-b border-stone-100 align-top" key={activity.id ?? `${activity.createdAt}-${activity.title}`}><td className="whitespace-nowrap px-3 py-4 text-stone-600">{dateLabel(activity.createdAt)}</td><td className="px-3 py-4"><p className="font-semibold text-stone-950">{activityTypeLabels[activity.activityType] ?? activity.title}</p><p className="mt-1 text-xs text-stone-500">{entityLabels[activity.entityType] ?? activity.entityType}</p><p className="mt-1 text-xs text-stone-500">{activity.action}</p></td><td className="px-3 py-4 text-stone-700">{activity.observation ? `${activity.observation.code} — ${activity.observation.title}` : "—"}</td><td className="px-3 py-4 text-stone-700">{actorLabel(activity)}{activity.area ? <span className="block text-xs text-stone-500">{activity.area.name}</span> : null}</td><td className="px-3 py-4 text-stone-600">{activity.actorType === "USER" ? "Usuario" : "Sistema"}</td><td className="px-3 py-4">{activity.targetUrl ? <Link className="text-xs font-semibold text-[var(--primary)] hover:underline" href={activity.targetUrl}>Abrir →</Link> : "—"}</td></tr>)}</tbody></table></div>}
      </section>
      <DataTablePagination isLoading={activityQuery.isFetching} onPageChange={setPage} onPageSizeChange={(value) => { setPage(1); setPageSize(value); }} page={pagination.page} pageSize={pagination.perPage} pageSizeOptions={[10, 20, 50]} total={pagination.total} />
    </div>
  );
}
