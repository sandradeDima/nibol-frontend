"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Eye,
  FileCheck2,
  FileUp,
  ListFilter,
  Pencil,
  RefreshCw,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { SearchableSelect } from "@/components/ui/searchable-select";
import { SearchField } from "@/components/ui/search-field";
import type {
  RoleDashboardData,
  RoleDashboardExecutorNode,
  RoleDashboardNodeStatus,
  RoleDashboardObservationRow,
  RoleDashboardPriority,
  RoleDashboardQuickAction,
  RoleDashboardResponsibleNode,
} from "@/types";
import {
  dashboardService,
  type RoleDashboardQuery,
} from "@/services/dashboard-service";
import { cn } from "@/utils";

import {
  formatObservationDate,
  getRiskLevelClasses,
  getRiskLevelStyle,
  getStatusClasses,
} from "../observations/presentation";

const roleLabels = {
  AREA_RESPONSIBLE: "Responsable de área",
  EXECUTOR: "Ejecutor",
  PROCESS_OWNER: "Dueño de proceso",
} as const;

const formatUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const statusClasses: Record<RoleDashboardNodeStatus["key"], string> = {
  CONCLUDED: "bg-[var(--success-soft)] text-[var(--success)]",
  MIXED: "bg-[var(--warning-soft)] text-[var(--foreground-soft)]",
  PENDING: "bg-[var(--accent-soft)] text-[var(--accent)]",
};

const statusIcon = {
  CONCLUDED: CheckCircle2,
  MIXED: ClipboardList,
  PENDING: AlertTriangle,
} as const;

const quickActionIcons = {
  REQUEST_EXTENSION: CalendarClock,
  SEND_PROGRESS: ArrowUpRight,
  UPDATE_PLAN: Pencil,
  UPLOAD_EVIDENCE: FileUp,
  VIEW_TIMELINE: CalendarClock,
} as const;

const optionList = (options: RoleDashboardData["areas"]) =>
  options.map((option) => ({ id: option.id, label: option.name }));

type RoleDashboardCard = "CLOSED" | "OVERDUE" | "PENDING" | "TOTAL";

const buildObservationHref = (
  roleCode: RoleDashboardData["roleCode"],
  areaId: string,
  status: RoleDashboardNodeStatus,
  responsibleId?: string,
  executorId?: string,
  search?: string,
) => {
  const params = new URLSearchParams({ "filter.areaId": areaId });
  if (roleCode === "PROCESS_OWNER" && responsibleId)
    params.set("filter.areaResponsibleUserId", responsibleId);
  if (executorId) params.set("filter.actionPlanResponsibleUserId", executorId);
  if (status.key !== "MIXED")
    params.set(
      "filter.observationState",
      status.key === "CONCLUDED" ? "CONCLUDED" : "PENDING",
    );
  if (search) params.set("search", search);
  return `/observaciones?${params.toString()}`;
};

function StatusBadge({ status }: { status: RoleDashboardNodeStatus }) {
  const Icon = statusIcon[status.key];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 text-[0.68rem] font-bold tracking-[0.08em] uppercase",
        statusClasses[status.key],
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {status.name}
    </span>
  );
}

function MetricCard({
  active,
  detail,
  icon: Icon,
  label,
  onClick,
  value,
}: {
  active?: boolean;
  detail: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  value: number;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "nibol-panel flex min-h-[132px] items-center gap-4 px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-panel)]",
        active &&
          "border-[color-mix(in_srgb,var(--primary)_42%,var(--border))] bg-[var(--info-soft)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_10%,transparent)]",
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--info-soft)] text-[var(--info)]">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-bold tracking-[0.16em] text-[var(--muted)] uppercase">
          {label}
        </p>
        <p className="font-display mt-1 text-4xl leading-none font-bold tracking-[-0.04em] text-[var(--foreground)]">
          {value}
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">{detail}</p>
      </div>
    </button>
  );
}

function PriorityList({ items }: { items: RoleDashboardPriority[] }) {
  return (
    <div className="mt-4 divide-y divide-white/10 border border-white/10">
      {items.map((item) => (
        <Link
          className="flex items-center gap-3 px-3.5 py-3 transition hover:bg-white/10"
          href={item.href}
          key={item.code}
        >
          <span className="flex h-7 min-w-7 items-center justify-center bg-white/10 px-2 text-xs font-bold text-white">
            {item.count}
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold text-white/90">
            {item.label}
          </span>
          <ChevronRight aria-hidden="true" className="h-4 w-4 text-white/55" />
        </Link>
      ))}
    </div>
  );
}

function QuickActionList({ items }: { items: RoleDashboardQuickAction[] }) {
  return (
    <div className="mt-4 grid gap-2">
      {items.map((item) => {
        const Icon = quickActionIcons[item.code];
        return (
          <Link
            className="group flex items-center gap-3 border border-white/10 bg-white/5 px-3.5 py-2.5 transition hover:bg-white/10"
            href={item.href}
            key={item.code}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-white/10 text-white/85">
              <Icon aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white">
                {item.label}
              </span>
              <span className="mt-0.5 block truncate text-xs text-white/55">
                {item.description}
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="h-4 w-4 text-white/45 transition group-hover:translate-x-0.5 group-hover:text-white"
            />
          </Link>
        );
      })}
    </div>
  );
}

function HierarchyAction({ href }: { href: string }) {
  return (
    <Link
      className="inline-flex items-center justify-end gap-1.5 text-xs font-bold text-[var(--info)] transition hover:text-[var(--primary)] hover:underline"
      href={href}
    >
      <Eye aria-hidden="true" className="h-3.5 w-3.5" />
      Ver detalle
      <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
    </Link>
  );
}

function HierarchySummary({
  status,
  total,
}: {
  status: RoleDashboardNodeStatus;
  total: number;
}) {
  return (
    <div className="flex items-center gap-3 lg:justify-end">
      <span className="text-sm font-semibold text-[var(--foreground)]">
        {total}
      </span>
      <StatusBadge status={status} />
    </div>
  );
}

function HierarchyRow({
  expand,
  icon: Icon,
  label,
  meta,
  summary,
  href,
  level,
}: {
  expand?: { label: string; onToggle: () => void; open: boolean };
  href: string;
  icon: typeof Building2;
  label: string;
  level: number;
  meta: string;
  summary: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-x-4 gap-y-2 border-t border-[var(--border)] px-4 py-3.5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_150px_120px] lg:items-center lg:gap-y-0",
        level > 0 && "bg-[var(--surface-soft)]",
      )}
    >
      <div
        className="flex min-w-0 items-center gap-2.5"
        style={{ paddingLeft: `${level * 1.25}rem` }}
      >
        {expand ? (
          <button
            aria-label={`${expand.open ? "Contraer" : "Expandir"} ${expand.label}`}
            aria-expanded={expand.open}
            className="flex h-7 w-7 shrink-0 items-center justify-center text-[var(--info)]"
            onClick={expand.onToggle}
            type="button"
          >
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "h-4 w-4 transition-transform",
                !expand.open && "-rotate-90",
              )}
            />
          </button>
        ) : null}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[var(--info)]">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
            {label}
          </p>
          <p className="mt-0.5 text-[0.68rem] tracking-[0.12em] text-[var(--muted)] uppercase">
            {meta}
          </p>
        </div>
      </div>
      <div>{summary}</div>
      <div className="col-span-2 lg:col-span-1">
        <HierarchyAction href={href} />
      </div>
    </div>
  );
}

export function RoleDashboard({ data }: { data: RoleDashboardData }) {
  const [areaId, setAreaId] = useState(data.selectedAreaId ?? "");
  const [areaResponsibleUserIds, setAreaResponsibleUserIds] = useState(
    data.selectedResponsibleIds ??
      (data.selectedResponsibleId ? [data.selectedResponsibleId] : []),
  );
  const [executorIds, setExecutorIds] = useState(
    data.selectedExecutorIds ??
      (data.selectedExecutorId ? [data.selectedExecutorId] : []),
  );
  const [observationState, setObservationState] = useState<
    "" | "PENDING" | "CONCLUDED"
  >(data.selectedObservationState ?? "");
  const [search, setSearch] = useState("");
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(
    () => new Set(data.hierarchy.map((area) => area.id)),
  );
  const [collapsedResponsibles, setCollapsedResponsibles] = useState<
    Set<string>
  >(
    () =>
      new Set(
        data.hierarchy.flatMap((area) =>
          (area.responsibles ?? []).map(
            (responsible) => `${area.id}:${responsible.id}`,
          ),
        ),
      ),
  );
  const resultsRef = useRef<HTMLElement | null>(null);
  const [activeCard, setActiveCard] = useState<RoleDashboardCard | null>(null);

  const params = useMemo<RoleDashboardQuery>(
    () => ({
      areaId: areaId || undefined,
      areaResponsibleUserId: areaResponsibleUserIds.length
        ? areaResponsibleUserIds
        : undefined,
      executorId: executorIds.length ? executorIds : undefined,
      observationState: observationState || undefined,
      search: search.trim() || undefined,
    }),
    [areaId, areaResponsibleUserIds, executorIds, observationState, search],
  );
  const paramsKey = JSON.stringify(params);
  const initialParamsKey = useMemo(
    () =>
      JSON.stringify({
        areaId: data.selectedAreaId ?? undefined,
        areaResponsibleUserId: data.selectedResponsibleIds?.length
          ? data.selectedResponsibleIds
          : data.selectedResponsibleId
            ? [data.selectedResponsibleId]
            : undefined,
        executorId: data.selectedExecutorIds?.length
          ? data.selectedExecutorIds
          : data.selectedExecutorId
            ? [data.selectedExecutorId]
            : undefined,
        observationState: data.selectedObservationState ?? undefined,
      }),
    [
      data.selectedAreaId,
      data.selectedExecutorId,
      data.selectedExecutorIds,
      data.selectedObservationState,
      data.selectedResponsibleId,
      data.selectedResponsibleIds,
    ],
  );
  const query = useQuery({
    initialData: paramsKey === initialParamsKey ? data : undefined,
    queryFn: () => dashboardService.getRoleDashboard(params),
    queryKey: ["dashboard", "role", paramsKey],
  });
  const view = query.data ?? data;
  const responsibleOptions = optionList(view.filters.responsibles);
  const executorOptions = optionList(view.filters.executors);
  const areaOptions = optionList(view.areas);
  const hasFilters = Boolean(
    areaId ||
    areaResponsibleUserIds.length ||
    executorIds.length ||
    observationState ||
    search.trim(),
  );
  const isProcessOwner = view.roleCode === "PROCESS_OWNER";
  const isExecutor = view.roleCode === "EXECUTOR";

  const resultRows = useMemo(() => {
    if (!activeCard) return [];
    return view.observations.filter((row) => {
      const isFinal = row.status.isFinal ?? row.status.key === "CONCLUIDO";
      if (activeCard === "TOTAL") return true;
      if (activeCard === "PENDING") return !isFinal;
      if (activeCard === "CLOSED") return isFinal;
      return row.isOverdue;
    });
  }, [activeCard, view.observations]);

  const toggleArea = (id: string) => {
    setCollapsedAreas((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleResponsible = (areaId: string, responsibleId: string) => {
    const key = `${areaId}:${responsibleId}`;
    setCollapsedResponsibles((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setActiveCard(null);
    setAreaId("");
    setAreaResponsibleUserIds([]);
    setExecutorIds([]);
    setObservationState("");
    setSearch("");
  };

  const areaName = view.areas.find((option) => option.id === areaId)?.name;
  const responsibleNames = areaResponsibleUserIds.map(
    (id) =>
      view.filters.responsibles.find((option) => option.id === id)?.name ?? id,
  );
  const executorNames = executorIds.map(
    (id) =>
      view.filters.executors.find((option) => option.id === id)?.name ?? id,
  );

  const focusResults = () => {
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const toggleCard = (card: RoleDashboardCard) => {
    if (activeCard === card) {
      setActiveCard(null);
      return;
    }
    setActiveCard(card);
    setObservationState("");
    focusResults();
  };

  return (
    <div className="space-y-4">
      <section className="nibol-panel overflow-visible px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="nibol-eyebrow">
              Auditoría · {roleLabels[view.roleCode]}
            </p>
            <h1 className="font-display mt-2 text-3xl leading-none font-bold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
              Seguimiento de observaciones
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground-soft)]">
              Programa general de observaciones, su estado, avances y relación
              con los planes de acción.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-right">
              <p className="text-[0.62rem] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
                Actualizado
              </p>
              <time className="mt-0.5 block text-xs font-semibold text-[var(--foreground)]">
                {formatUpdatedAt(view.generatedAt)}
              </time>
            </div>
            <button
              className="nibol-btn-secondary px-3.5 py-2.5 text-sm"
              disabled={query.isFetching}
              onClick={() => query.refetch()}
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={cn("h-4 w-4", query.isFetching && "animate-spin")}
              />
              {query.isFetching ? "Actualizando…" : "Actualizar"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-4 lg:grid-cols-[minmax(240px,0.8fr)_minmax(320px,1.2fr)]">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
              Área
            </span>
            <SearchableSelect
              onChange={(value) => {
                setAreaId(value);
                setAreaResponsibleUserIds([]);
                setExecutorIds([]);
              }}
              options={[{ id: "", label: "Todas las áreas" }, ...areaOptions]}
              placeholder="Todas las áreas"
              showSelectedValues={false}
              value={areaId}
            />
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
              Buscar
            </span>
            <SearchField
              onChange={setSearch}
              placeholder="Buscar por área, responsable, ejecutor o descripción…"
              value={search}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))_1.35fr]">
        <MetricCard
          active={activeCard === "TOTAL"}
          detail={hasFilters ? "Resultado del filtro" : "Alcance total del rol"}
          icon={ClipboardList}
          label="Total de observaciones"
          onClick={() => toggleCard("TOTAL")}
          value={view.summary.totalObservations}
        />
        <MetricCard
          active={activeCard === "PENDING"}
          detail={
            hasFilters ? "Pendientes del filtro" : "Requieren seguimiento"
          }
          icon={AlertTriangle}
          label="Pendientes"
          onClick={() => toggleCard("PENDING")}
          value={view.summary.pendingObservations}
        />
        <MetricCard
          active={activeCard === "CLOSED"}
          detail={
            hasFilters ? "Concluidas del filtro" : "Estado final registrado"
          }
          icon={CheckCircle2}
          label="Concluidas"
          onClick={() => toggleCard("CLOSED")}
          value={view.summary.concludedObservations}
        />
        <MetricCard
          active={activeCard === "OVERDUE"}
          detail="Pendientes fuera de plazo"
          icon={AlertTriangle}
          label="Vencidas"
          onClick={() => toggleCard("OVERDUE")}
          value={view.summary.overdueObservations}
        />
        <section className="nibol-panel-dark min-h-[132px] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-bold tracking-[0.16em] text-white/55 uppercase">
                {isExecutor ? "Productividad" : "Seguimiento"}
              </p>
              <h2 className="font-display mt-1 text-2xl leading-none font-bold tracking-[-0.03em] text-white">
                {isExecutor ? "Accesos rápidos" : "Acciones prioritarias"}
              </h2>
            </div>
            {isExecutor ? (
              <ArrowUpRight
                aria-hidden="true"
                className="h-5 w-5 text-white/65"
              />
            ) : (
              <AlertTriangle
                aria-hidden="true"
                className="h-5 w-5 text-white/65"
              />
            )}
          </div>
          {isExecutor ? (
            <QuickActionList items={view.quickActions} />
          ) : (
            <PriorityList items={view.priorities} />
          )}
        </section>
      </section>

      <section className="nibol-panel overflow-visible p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--info-soft)] text-[var(--info)]">
              <ListFilter aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[var(--foreground)]">
                Filtros
              </h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Acota la jerarquía y los indicadores del tablero.
              </p>
            </div>
          </div>
          <button
            className="nibol-btn-ghost self-start px-0 py-1.5 text-xs lg:self-auto"
            disabled={!hasFilters && !activeCard}
            onClick={clearFilters}
            type="button"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 md:grid-cols-2 xl:grid-cols-3">
          {isProcessOwner ? (
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
                Responsable de área
              </span>
              <SearchableSelect
                disabled={!responsibleOptions.length}
                multiple
                onChange={(values) => {
                  setAreaResponsibleUserIds(values);
                  setExecutorIds([]);
                }}
                options={responsibleOptions}
                placeholder="Todos los responsables"
                showSelectedValues={false}
                value={areaResponsibleUserIds}
              />
            </label>
          ) : null}
          {!isExecutor ? (
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
                Ejecutor
              </span>
              <SearchableSelect
                disabled={!executorOptions.length}
                multiple
                onChange={setExecutorIds}
                options={executorOptions}
                placeholder="Todos los ejecutores"
                showSelectedValues={false}
                value={executorIds}
              />
            </label>
          ) : null}
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
              Estado de observación
            </span>
            <SearchableSelect
              onChange={(value) => {
                setActiveCard(null);
                if (value === "PENDING" || value === "CONCLUDED") {
                  setObservationState(value);
                } else {
                  setObservationState("");
                }
              }}
              options={[
                { id: "PENDING", label: "Pendientes" },
                { id: "CONCLUDED", label: "Concluidas" },
              ]}
              placeholder="Todos los estados"
              showSelectedValues={false}
              value={observationState}
            />
          </label>
        </div>

        {hasFilters ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
            <span className="mr-1 text-[0.68rem] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
              Filtros aplicados:
            </span>
            {areaName ? (
              <FilterChip
                label="Área"
                onRemove={() => setAreaId("")}
                value={areaName}
              />
            ) : null}
            {responsibleNames.map((name, index) => (
              <FilterChip
                label="Responsable"
                key={areaResponsibleUserIds[index]}
                onRemove={() =>
                  setAreaResponsibleUserIds((current) =>
                    current.filter((_, currentIndex) => currentIndex !== index),
                  )
                }
                value={name}
              />
            ))}
            {executorNames.map((name, index) => (
              <FilterChip
                label="Ejecutor"
                key={executorIds[index]}
                onRemove={() =>
                  setExecutorIds((current) =>
                    current.filter((_, currentIndex) => currentIndex !== index),
                  )
                }
                value={name}
              />
            ))}
            {observationState ? (
              <FilterChip
                label="Estado"
                onRemove={() => setObservationState("")}
                value={
                  observationState === "PENDING" ? "Pendientes" : "Concluidas"
                }
              />
            ) : null}
            {search.trim() ? (
              <FilterChip
                label="Búsqueda"
                onRemove={() => setSearch("")}
                value={search.trim()}
              />
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--foreground-soft)]">
          <span className="text-[0.68rem] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
            Resultado filtrado:
          </span>
          <span>
            <strong className="text-sm text-[var(--foreground)]">
              {view.summary.totalObservations}
            </strong>{" "}
            observaciones
          </span>
          <span>
            <strong className="text-sm text-[var(--foreground)]">
              {view.summary.pendingObservations}
            </strong>{" "}
            pendientes
          </span>
          <span>
            <strong className="text-sm text-[var(--foreground)]">
              {view.summary.concludedObservations}
            </strong>{" "}
            concluidas
          </span>
        </div>
      </section>

      {query.isError ? (
        <div className="border border-[color:color-mix(in_srgb,var(--accent)_22%,white)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
          No se pudo actualizar este tablero. Se mantiene la última información
          disponible.
        </div>
      ) : null}

      <section className="nibol-panel overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-[var(--border)] px-4 py-4 sm:px-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--info-soft)] text-[var(--info)]">
              <FileCheck2 aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[var(--foreground)]">
                Observaciones por jerarquía
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {isProcessOwner
                  ? "Área / Responsable / Ejecutor"
                  : "Área / Ejecutor"}
              </p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)]">
            {query.isFetching
              ? "Actualizando resultados…"
              : `${view.hierarchy.length} áreas visibles`}
          </p>
        </div>
        <div className="hidden grid-cols-[minmax(0,1fr)_150px_120px] gap-4 bg-[var(--surface-soft)] px-5 py-2.5 text-[0.65rem] font-bold tracking-[0.13em] text-[var(--muted)] uppercase lg:grid">
          <span>
            {isProcessOwner
              ? "Área / Responsable / Ejecutor"
              : "Área / Ejecutor"}
          </span>
          <span className="text-right">Cantidad</span>
          <span className="text-right">Acción</span>
        </div>
        {view.hierarchy.length ? (
          <div>
            {view.hierarchy.map((area) => {
              const areaOpen = !collapsedAreas.has(area.id);
              const areaHref = buildObservationHref(
                view.roleCode,
                area.id,
                area.status,
                undefined,
                undefined,
                search.trim() || undefined,
              );
              return (
                <div key={area.id}>
                  <HierarchyRow
                    expand={{
                      label: area.name,
                      onToggle: () => toggleArea(area.id),
                      open: areaOpen,
                    }}
                    href={areaHref}
                    icon={Building2}
                    label={area.name}
                    level={0}
                    meta="Área"
                    summary={
                      <HierarchySummary
                        status={area.status}
                        total={area.total}
                      />
                    }
                  />
                  {areaOpen ? (
                    <div>
                      {isProcessOwner
                        ? (area.responsibles ?? []).map((responsible) => (
                            <ResponsibleRow
                              areaId={area.id}
                              collapsed={collapsedResponsibles.has(
                                area.id + ":" + responsible.id,
                              )}
                              key={responsible.id}
                              node={responsible}
                              onToggle={() =>
                                toggleResponsible(area.id, responsible.id)
                              }
                              roleCode={view.roleCode}
                              search={search.trim() || undefined}
                            />
                          ))
                        : (area.executors ?? []).map((executor) => (
                            <ExecutorRow
                              areaId={area.id}
                              key={executor.id}
                              node={executor}
                              roleCode={view.roleCode}
                              search={search.trim() || undefined}
                            />
                          ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-[var(--muted)]" />
            <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
              No hay observaciones para los filtros seleccionados.
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Prueba con otra área, responsable, ejecutor o búsqueda.
            </p>
          </div>
        )}
      </section>
      {activeCard ? (
        <section className="nibol-panel overflow-hidden" ref={resultsRef}>
          <RoleObservationResults
            activeCard={activeCard}
            isFetching={query.isFetching}
            items={resultRows}
          />
        </section>
      ) : null}
    </div>
  );
}

function RoleObservationResults({
  activeCard,
  isFetching,
  items,
}: {
  activeCard: RoleDashboardCard;
  isFetching: boolean;
  items: RoleDashboardObservationRow[];
}) {
  const titles: Record<RoleDashboardCard, string> = {
    CLOSED: "Observaciones concluidas",
    OVERDUE: "Observaciones vencidas",
    PENDING: "Observaciones pendientes",
    TOTAL: "Todas las observaciones",
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-5">
        <div>
          <p className="nibol-eyebrow">Resultado seleccionado</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
            {titles[activeCard]}
          </h2>
          <p className="mt-1 text-xs text-[var(--foreground-soft)]">
            {items.length} observaciones dentro del alcance y jerarquía
            seleccionados.
          </p>
        </div>
        <span className="text-xs text-[var(--muted)]">
          {isFetching ? "Actualizando…" : "Filtrado en el tablero"}
        </span>
      </div>
      {items.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem] text-left text-xs">
            <thead className="bg-[var(--surface-soft)] text-[0.65rem] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
              <tr>
                <th className="px-4 py-2.5">Informe / Obs.</th>
                <th className="px-4 py-2.5">Título</th>
                <th className="px-4 py-2.5">Área</th>
                <th className="px-4 py-2.5">Responsable</th>
                <th className="px-4 py-2.5">Ejecutor</th>
                <th className="px-4 py-2.5">Riesgo</th>
                <th className="px-4 py-2.5">Estado</th>
                <th className="px-4 py-2.5">Estado según plazo</th>
                <th className="px-4 py-2.5">Fecha compromiso</th>
                <th className="px-4 py-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <tr
                  className="align-top hover:bg-[var(--surface-soft)]"
                  key={item.id}
                >
                  <td className="px-4 py-2.5 font-semibold whitespace-nowrap text-[var(--foreground)]">
                    {item.code}
                  </td>
                  <td className="max-w-[18rem] px-4 py-2.5">
                    <p className="truncate font-semibold text-[var(--foreground)]">
                      {item.title}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-[var(--foreground-soft)]">
                    {item.area.name}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-[var(--foreground-soft)]">
                    {item.responsibleUser?.name ?? "Sin asignar"}
                  </td>
                  <td className="max-w-[12rem] px-4 py-2.5 text-[var(--foreground-soft)]">
                    <span className="block truncate">
                      {item.executorNames.length
                        ? item.executorNames.join(", ")
                        : "Sin asignar"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "inline-flex border px-2 py-1 text-xs font-semibold",
                        getRiskLevelClasses(),
                      )}
                      style={getRiskLevelStyle(item.riskLevel.colorToken)}
                    >
                      {item.riskLevel.name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex border px-2 py-1 text-xs font-semibold",
                        getStatusClasses(item.status.key),
                      )}
                    >
                      {item.status.name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex border px-2 py-1 text-xs font-semibold",
                        item.isOverdue
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {item.isOverdue ? "Vencido" : "Vigente"}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 whitespace-nowrap text-[var(--foreground-soft)]",
                      item.isOverdue && "font-semibold text-[var(--accent)]",
                    )}
                  >
                    {formatObservationDate(item.dueDate)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      className="inline-flex items-center gap-1 font-semibold whitespace-nowrap text-[var(--primary)] hover:underline"
                      href={item.href}
                    >
                      Ver detalle
                      <ChevronRight
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-5 py-10 text-center text-sm text-[var(--foreground-soft)]">
          No hay observaciones para este indicador dentro del alcance
          seleccionado.
        </div>
      )}
    </>
  );
}

function FilterChip({
  label,
  onRemove,
  value,
}: {
  label: string;
  onRemove?: () => void;
  value: string;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1.5 text-xs text-[var(--foreground-soft)]">
      <span className="font-bold text-[var(--muted)]">{label}:</span>
      <span className="truncate">{value}</span>
      {onRemove ? (
        <button
          aria-label={`Quitar filtro ${label}: ${value}`}
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[var(--muted)] hover:bg-white hover:text-[var(--foreground)]"
          onClick={onRemove}
          type="button"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

function ResponsibleRow({
  areaId,
  collapsed,
  node,
  onToggle,
  roleCode,
  search,
}: {
  areaId: string;
  collapsed: boolean;
  node: RoleDashboardResponsibleNode;
  onToggle: () => void;
  roleCode: RoleDashboardData["roleCode"];
  search?: string;
}) {
  const expandable = node.executors.length > 0;
  return (
    <div>
      <HierarchyRow
        expand={
          expandable
            ? {
                label: node.name,
                onToggle,
                open: !collapsed,
              }
            : undefined
        }
        href={buildObservationHref(
          roleCode,
          areaId,
          node.status,
          node.id,
          undefined,
          search,
        )}
        icon={UserRound}
        label={node.name}
        level={1}
        meta="Responsable de área"
        summary={<HierarchySummary status={node.status} total={node.total} />}
      />
      {!collapsed
        ? node.executors.map((executor) => (
            <ExecutorRow
              areaId={areaId}
              key={executor.id}
              node={executor}
              responsibleId={node.id}
              roleCode={roleCode}
              search={search}
            />
          ))
        : null}
    </div>
  );
}

function ExecutorRow({
  areaId,
  node,
  responsibleId,
  roleCode,
  search,
}: {
  areaId: string;
  node: RoleDashboardExecutorNode;
  responsibleId?: string;
  roleCode: RoleDashboardData["roleCode"];
  search?: string;
}) {
  return (
    <HierarchyRow
      href={buildObservationHref(
        roleCode,
        areaId,
        node.status,
        responsibleId,
        node.id === "unassigned" ? undefined : node.id,
        search,
      )}
      icon={UserRound}
      label={node.name}
      level={roleCode === "PROCESS_OWNER" ? 2 : 1}
      meta="Ejecutor"
      summary={<HierarchySummary status={node.status} total={node.total} />}
    />
  );
}
