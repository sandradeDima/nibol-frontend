"use client";

import { createPortal } from "react-dom";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Ellipsis,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useFloatingMenuPosition } from "@/components/data-table/data-table";
import { DataTableFilters } from "@/components/data-table/data-table-filters";
import type {
  DataTableFilterConfig,
  DataTableFilterValue,
} from "@/components/data-table/types";
import { SearchField } from "@/components/ui/search-field";
import { QUERY_KEYS } from "@/lib/constants";
import { buildObservationUrl } from "@/lib/observation-links";
import { observationService } from "@/services/observation-service";
import type { ObservationTableRow } from "@/types";
import { cn, getApiErrorMessage } from "@/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  formatObservationDate,
  getRiskLevelClasses,
  getRiskLevelStyle,
  getStatusClasses,
} from "./presentation";

const OBSERVATION_FILTER_QUERY_KEYS = [
  "filter.actionPlanResponsibleUserId",
  "filter.areaId",
  "filter.areaResponsibleUserId",
  "filter.auditReportId",
  "filter.currentDueDateFrom",
  "filter.currentDueDateTo",
  "filter.deadlineStatus",
  "filter.mainObservationId",
  "filter.observationState",
  "filter.observationStatus",
  "filter.overdue",
  "filter.progressStatus",
  "filter.processOwnerUserId",
  "filter.riskId",
  "filter.riskLevelId",
  "filter.title",
] as const;

const formatTaskProgress = (completed: number, total: number) =>
  `${completed} de ${total} ${total === 1 ? "tarea" : "tareas"}`;

function ObservationActionsMenu({
  canDelete,
  canEdit,
  canViewActionPlans,
  onDelete,
  row,
}: {
  canDelete: boolean;
  canEdit: boolean;
  canViewActionPlans: boolean;
  onDelete: () => void;
  row: ObservationTableRow;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuPosition = useFloatingMenuPosition(open, buttonRef, menuRef);
  const handleDocumentPointerDown = useEffectEvent((event: PointerEvent) => {
    const target = event.target as Node;

    if (
      !buttonRef.current?.contains(target) &&
      !menuRef.current?.contains(target)
    ) {
      setOpen(false);
    }
  });
  const handleDocumentKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") setOpen(false);
  });

  useEffect(() => {
    if (!open) return;
    document.addEventListener("pointerdown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Más acciones"
        className="flex h-9 w-9 shrink-0 items-center justify-center border border-stone-200 text-stone-500 hover:bg-stone-100"
        onClick={() => setOpen((current) => !current)}
        ref={buttonRef}
        type="button"
      >
        <Ellipsis className="h-4 w-4" />
      </button>
      {open
        ? createPortal(
            <div
              className="fixed z-[80] w-48 border border-stone-200 bg-white p-1 text-left shadow-xl"
              ref={menuRef}
              role="menu"
              style={{
                left: menuPosition?.left ?? 0,
                top: menuPosition?.top ?? 0,
                visibility: menuPosition ? "visible" : "hidden",
              }}
            >
              {canViewActionPlans && row.actionPlanCount > 0 ? (
                <Link
                  className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-amber-50"
                  href={buildObservationUrl({
                    observationId: row.id,
                    planId:
                      row.actionPlans.length === 1
                        ? row.actionPlans[0]?.id
                        : undefined,
                    tab: "plans",
                  })}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  {row.actionPlans.length === 1
                    ? "Ver plan de acción"
                    : "Ver planes de acción"}
                </Link>
              ) : null}
              {canEdit ? (
                <Link
                  className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-stone-100"
                  href={`/observaciones/${row.id}/editar`}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar observación
                </Link>
              ) : null}
              {canDelete ? (
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => {
                    setOpen(false);
                    onDelete();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar observación
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function ObservationTable({
  canDelete,
  canEdit,
  canSend,
  canViewActionPlans,
}: {
  canDelete: boolean;
  canEdit: boolean;
  canSend: boolean;
  canViewActionPlans: boolean;
}) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [pendingDelete, setPendingDelete] =
    useState<ObservationTableRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const optionsQuery = useQuery({
    queryFn: observationService.getObservationOptions,
    queryKey: QUERY_KEYS.observationOptions,
    staleTime: 60_000,
  });
  const filterDefinitions = useMemo<DataTableFilterConfig[]>(
    () => [
      {
        id: "title",
        label: "Título",
        placeholder: "Buscar por título",
        type: "text",
      },
      {
        id: "auditReportId",
        label: "Informe de auditoría",
        options: (optionsQuery.data?.auditReports ?? []).map((report) => ({
          label: `${report.reportNumber} · ${report.title}`,
          value: report.id,
        })),
        placeholder: "Todos los informes",
        type: "select",
      },
      {
        id: "areaId",
        label: "Área",
        options: (optionsQuery.data?.areas ?? []).map((area) => ({
          label: area.name,
          value: area.id,
        })),
        placeholder: "Todas las áreas",
        type: "select",
      },
      {
        id: "areaResponsibleUserId",
        label: "Responsable de área",
        options: (optionsQuery.data?.users ?? []).map((user) => ({
          label: user.name,
          value: user.id,
        })),
        placeholder: "Todos los responsables",
        type: "select",
      },
      {
        id: "actionPlanResponsibleUserId",
        label: "Ejecutor",
        options: (optionsQuery.data?.users ?? []).map((user) => ({
          label: user.name,
          value: user.id,
        })),
        placeholder: "Todos los ejecutores",
        type: "select",
      },
      {
        id: "observationState",
        label: "Estado de observación",
        options: [
          { label: "Pendiente", value: "PENDING" },
          { label: "Concluido", value: "CONCLUDED" },
        ],
        placeholder: "Todos los estados",
        type: "select",
      },
      {
        id: "deadlineStatus",
        label: "Estado según plazo",
        options: [
          { label: "Vigente", value: "VIGENTE" },
          { label: "Vencido", value: "VENCIDO" },
          { label: "Reprogramado", value: "REPROGRAMADO" },
        ],
        placeholder: "Todos los plazos",
        type: "select",
      },
      {
        id: "progressStatus",
        label: "Estado según avance",
        options: [
          { label: "No iniciado", value: "NO_INICIADO" },
          { label: "Iniciado", value: "INICIADO" },
          { label: "Con avance", value: "CON_AVANCE" },
          { label: "Concluido", value: "CONCLUIDO" },
        ],
        placeholder: "Todos los avances",
        type: "select",
      },
      {
        id: "riskLevelId",
        label: "Nivel de riesgo",
        options: (optionsQuery.data?.riskLevels ?? []).map((level) => ({
          label: level.name,
          value: level.id,
        })),
        placeholder: "Todos los niveles",
        type: "select",
      },
      {
        id: "currentDueDateFrom",
        label: "Fecha límite desde",
        type: "date",
      },
      {
        id: "currentDueDateTo",
        label: "Fecha límite hasta",
        type: "date",
      },
    ],
    [optionsQuery.data],
  );
  const filterValues = useMemo<
    Record<string, DataTableFilterValue | undefined>
  >(
    () =>
      Object.fromEntries(
        filterDefinitions.map((filter) => [
          filter.id,
          (() => {
            const value = searchParams.get(
              `filter.${filter.queryKey ?? filter.id}`,
            );
            return value && filter.type === "select"
              ? value.split(",").filter(Boolean)
              : (value ?? undefined);
          })(),
        ]),
      ),
    [filterDefinitions, searchParams],
  );
  const filterQuery = useMemo(() => {
    const next = new URLSearchParams();
    OBSERVATION_FILTER_QUERY_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) next.set(key, value);
    });
    return next.toString();
  }, [searchParams]);
  const params = useMemo(() => {
    const next = new URLSearchParams(filterQuery);
    next.set("page", String(page));
    next.set("perPage", "20");
    if (search.trim()) next.set("search", search.trim());
    else next.delete("search");
    next.set("sortBy", "updatedAt");
    next.set("sortDirection", "desc");
    return next;
  }, [filterQuery, page, search]);
  const activeFilters = useMemo(
    () =>
      filterDefinitions
        .map((filter) => {
          const value = searchParams.get(
            `filter.${filter.queryKey ?? filter.id}`,
          );
          if (!value) return null;
          const labels = value.split(",").map((selectedValue) => {
            const option = filter.options?.find(
              (item) => item.value === selectedValue,
            );
            return option?.label ?? selectedValue;
          });
          return `${filter.label}: ${labels.join(", ")}`;
        })
        .filter((value): value is string => Boolean(value)),
    [filterDefinitions, searchParams],
  );
  const replaceFilters = (next: URLSearchParams) => {
    next.delete("page");
    router.replace(
      `${pathname}${next.toString() ? `?${next.toString()}` : ""}`,
      { scroll: false },
    );
    setPage(1);
  };
  const updateFilter = (
    filterId: string,
    value: DataTableFilterValue | undefined,
  ) => {
    const definition = filterDefinitions.find(
      (filter) => filter.id === filterId,
    );
    if (!definition) return;
    const next = new URLSearchParams(searchParams.toString());
    const key = `filter.${definition.queryKey ?? definition.id}`;
    if (value === undefined || value === "" || value.length === 0) {
      next.delete(key);
    } else {
      next.set(key, Array.isArray(value) ? value.join(",") : value);
    }
    replaceFilters(next);
  };
  const resetFilters = () => {
    const next = new URLSearchParams(searchParams.toString());
    OBSERVATION_FILTER_QUERY_KEYS.forEach((key) => next.delete(key));
    next.delete("search");
    setSearch("");
    replaceFilters(next);
  };
  const query = useQuery({
    queryFn: () => observationService.listObservations(`?${params.toString()}`),
    queryKey: [...QUERY_KEYS.observations, filterQuery, search.trim(), page],
  });
  const remove = useMutation({
    mutationFn: (id: string) => observationService.deleteObservation(id),
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observations,
      });
    },
  });
  const send = useMutation({
    mutationFn: () => observationService.sendObservations(selectedIds),
    onSuccess: async () => {
      setSelectedIds([]);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observations,
      });
    },
  });
  const pagination = query.data?.pagination;

  return (
    <section className="nibol-panel overflow-visible">
      <div className="space-y-3 border-b border-stone-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchField
            className="w-full sm:max-w-md"
            onChange={(value) => {
              setSearch(value);
              const next = new URLSearchParams(searchParams.toString());
              if (value.trim()) next.set("search", value.trim());
              else next.delete("search");
              replaceFilters(next);
            }}
            placeholder="Buscar por informe, título, área o responsable"
            value={search}
          />
          <div className="flex items-center gap-3">
            <p className="text-sm text-stone-500">
              {pagination?.total ?? 0} observaciones
            </p>
            {canSend && selectedIds.length ? (
              <button
                className="nibol-btn-primary px-3 py-2 text-xs"
                disabled={send.isPending}
                onClick={() => send.mutate()}
                type="button"
              >
                <Send className="h-3.5 w-3.5" />
                Enviar observaciones a las áreas ({selectedIds.length})
              </button>
            ) : null}
          </div>
        </div>
        {activeFilters.length ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
            <span className="font-semibold">Filtros activos:</span>
            {activeFilters.map((filter, index) => (
              <span
                className="border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-900"
                key={`${filter}-${index}`}
              >
                {filter}
              </span>
            ))}
            <button
              className="font-semibold text-amber-800 hover:underline"
              onClick={resetFilters}
              type="button"
            >
              Limpiar filtros
            </button>
          </div>
        ) : null}
      </div>
      <DataTableFilters
        filters={filterDefinitions}
        onChange={updateFilter}
        onReset={resetFilters}
        searchableSelects
        values={filterValues}
      />
      <div className="hidden w-full xl:block">
        <table className="w-full table-fixed text-left text-xs">
          <colgroup>
            {canSend ? <col className="w-[4%]" /> : null}
            <col className="w-[12%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
          </colgroup>
          <thead className="bg-stone-50 text-xs font-semibold tracking-wider text-stone-500 uppercase">
            <tr>
              {canSend ? (
                <th className="px-2.5 py-3">
                  <input
                    aria-label="Seleccionar todas las observaciones enviables"
                    checked={Boolean(
                      query.data?.data.length &&
                      query.data.data
                        .filter((row) => !row.sentAt)
                        .every((row) => selectedIds.includes(row.id)),
                    )}
                    onChange={(event) =>
                      setSelectedIds(
                        event.target.checked
                          ? (query.data?.data ?? [])
                              .filter((row) => !row.sentAt)
                              .map((row) => row.id)
                          : [],
                      )
                    }
                    type="checkbox"
                  />
                </th>
              ) : null}
              <th className="px-2.5 py-3 break-words">Informe / Obs.</th>
              <th className="px-2.5 py-3 break-words">Título</th>
              <th className="px-2.5 py-3 break-words">Nivel y riesgos</th>
              <th className="px-2.5 py-3 break-words">Áreas / responsables</th>
              <th className="px-2.5 py-3 break-words">Progreso</th>
              <th className="px-2.5 py-3 break-words">Fecha límite</th>
              <th className="px-2.5 py-3 break-words">Estados</th>
              <th className="px-2.5 py-3 text-right break-words">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {query.data?.data.map((row) => (
              <tr className="group hover:bg-amber-50/30" key={row.id}>
                {canSend ? (
                  <td className="px-2.5 py-3">
                    <input
                      aria-label={`Seleccionar ${row.displayCode}`}
                      checked={selectedIds.includes(row.id)}
                      disabled={Boolean(row.sentAt)}
                      onChange={(event) =>
                        setSelectedIds((current) =>
                          event.target.checked
                            ? [...current, row.id]
                            : current.filter((id) => id !== row.id),
                        )
                      }
                      type="checkbox"
                    />
                  </td>
                ) : null}
                <td className="min-w-0 overflow-hidden px-2.5 py-3">
                  <p
                    className="font-semibold break-words text-stone-950"
                    title={row.displayCode}
                  >
                    {row.displayCode}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatObservationDate(row.auditReport.reportDate)}
                  </p>
                </td>
                <td className="min-w-0 overflow-hidden px-2.5 py-3">
                  <p
                    className="line-clamp-2 font-semibold break-words text-stone-950"
                    title={row.title}
                  >
                    {row.title}
                  </p>
                  <p
                    className="mt-1 line-clamp-2 text-[11px] break-words text-stone-500"
                    title={row.mainObservation.name}
                  >
                    {row.mainObservation.name}
                  </p>
                </td>
                <td className="min-w-0 overflow-hidden px-2.5 py-3">
                  <span
                    className={cn(
                      "inline-flex border px-2 py-1 text-xs font-semibold",
                      getRiskLevelClasses(),
                    )}
                    style={getRiskLevelStyle(row.riskLevel.colorToken)}
                  >
                    {row.riskLevel.name}
                  </span>
                  <p
                    className="mt-2 line-clamp-2 text-[11px] break-words text-stone-600"
                    title={row.risks.map((risk) => risk.name).join(", ")}
                  >
                    {row.risks[0]?.name}
                    {row.risks.length > 1 ? ` +${row.risks.length - 1}` : ""}
                  </p>
                </td>
                <td className="min-w-0 overflow-hidden px-2.5 py-3">
                  <p
                    className="line-clamp-2 font-medium break-words"
                    title={row.areas.map((area) => area.area.name).join(", ")}
                  >
                    {row.areas[0]?.area.name ?? "—"}
                    {row.areas.length > 1 ? ` +${row.areas.length - 1}` : ""}
                  </p>
                  <p
                    className="mt-1 line-clamp-2 text-[11px] break-words text-stone-500"
                    title={row.areas
                      .map(
                        (area) =>
                          `${area.area.name}: ${area.areaResponsible.name}`,
                      )
                      .join(" · ")}
                  >
                    {row.areas[0]?.areaResponsible.name ?? "Sin responsable"}
                  </p>
                </td>
                <td className="min-w-0 overflow-hidden px-2.5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full bg-stone-950"
                        style={{ width: `${row.progressPercent}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs font-semibold">
                      {row.progressPercent}% ·{" "}
                      {formatTaskProgress(
                        row.completedTaskCount,
                        row.taskCount,
                      )}
                    </span>
                  </div>
                </td>
                <td className="min-w-0 overflow-hidden px-2.5 py-3">
                  <p
                    className={cn(
                      "font-semibold",
                      row.isOverdue && "text-rose-700",
                    )}
                  >
                    {formatObservationDate(row.currentDueDate)}
                  </p>
                  {row.originalDueDate !== row.currentDueDate ? (
                    <p className="mt-1 text-xs text-stone-500">
                      Original: {formatObservationDate(row.originalDueDate)}
                    </p>
                  ) : null}
                </td>
                <td className="min-w-0 overflow-hidden px-2.5 py-3">
                  <div className="space-y-2">
                    <div>
                      <p className="mb-1 text-[10px] font-semibold tracking-wide text-stone-500 uppercase">
                        Estado de observación
                      </p>
                      <span
                        className={cn(
                          "inline-flex border px-2 py-1 text-xs font-semibold",
                          getStatusClasses(row.status.key),
                        )}
                      >
                        {row.status.name}
                      </span>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-semibold tracking-wide text-stone-500 uppercase">
                        Estado de plazo
                      </p>
                      <span
                        className={cn(
                          "inline-flex border px-2 py-1 text-xs font-semibold",
                          row.deadlineStatus === "VENCIDO"
                            ? "border-rose-200 bg-rose-50 text-rose-800"
                            : "border-stone-200 bg-stone-50 text-stone-700",
                        )}
                      >
                        {row.deadlineStatus === "NO_APLICA"
                          ? "No aplica"
                          : row.deadlineStatus === "VENCIDO"
                            ? "Vencido"
                            : "Vigente"}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="min-w-0 overflow-hidden px-2.5 py-3">
                  <div className="flex min-w-0 items-center justify-end gap-1">
                    <Link
                      aria-label="Ver observación"
                      className="nibol-btn-primary shrink-0 justify-center px-2 py-2 text-[11px]"
                      href={buildObservationUrl({ observationId: row.id })}
                      title="Ver"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden 2xl:inline">Ver</span>
                    </Link>
                    <ObservationActionsMenu
                      canDelete={canDelete}
                      canEdit={canEdit}
                      canViewActionPlans={canViewActionPlans}
                      onDelete={() => setPendingDelete(row)}
                      row={row}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-stone-200 xl:hidden">
        {query.data?.data.map((row) => (
          <article className="space-y-3 p-4" key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-stone-950">
                  {row.displayCode}
                </p>
                <p
                  className="line-clamp-2 text-sm font-medium text-stone-800"
                  title={row.title}
                >
                  {row.title}
                </p>
                <p className="text-xs break-words text-stone-500">
                  {row.auditReport.reportNumber} ·{" "}
                  {formatObservationDate(row.auditReport.reportDate)}
                </p>
              </div>
              {canSend ? (
                <input
                  aria-label={`Seleccionar ${row.displayCode}`}
                  checked={selectedIds.includes(row.id)}
                  disabled={Boolean(row.sentAt)}
                  onChange={(event) =>
                    setSelectedIds((current) =>
                      event.target.checked
                        ? [...current, row.id]
                        : current.filter((id) => id !== row.id),
                    )
                  }
                  type="checkbox"
                />
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div>
                <p className="text-stone-500">Riesgo</p>
                <p className="truncate font-semibold">
                  {row.riskLevel.name} · {row.risks[0]?.name ?? "—"}
                  {row.risks.length > 1 ? ` +${row.risks.length - 1}` : ""}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Área</p>
                <p className="truncate font-semibold">
                  {row.areas[0]?.area.name ?? "—"}
                  {row.areas.length > 1 ? ` +${row.areas.length - 1}` : ""}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Progreso</p>
                <p className="font-semibold">{row.progressPercent}%</p>
                <p className="text-stone-500">
                  {formatTaskProgress(row.completedTaskCount, row.taskCount)}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Fecha límite</p>
                <p
                  className={cn(
                    "font-semibold",
                    row.isOverdue && "text-rose-700",
                  )}
                >
                  {formatObservationDate(row.currentDueDate)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    "inline-flex border px-2 py-1 text-xs font-semibold",
                    getStatusClasses(row.status.key),
                  )}
                >
                  Observación: {row.status.name}
                </span>
                <span
                  className={cn(
                    "inline-flex border px-2 py-1 text-xs font-semibold",
                    row.deadlineStatus === "VENCIDO"
                      ? "border-rose-200 bg-rose-50 text-rose-800"
                      : "border-stone-200 bg-stone-50 text-stone-700",
                  )}
                >
                  Plazo:{" "}
                  {row.deadlineStatus === "NO_APLICA"
                    ? "No aplica"
                    : row.deadlineStatus === "VENCIDO"
                      ? "Vencido"
                      : "Vigente"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  aria-label="Ver observación"
                  className="nibol-btn-primary px-3 py-2 text-xs"
                  href={buildObservationUrl({ observationId: row.id })}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver
                </Link>
                {canViewActionPlans && row.actionPlanCount > 0 ? (
                  <Link
                    className="nibol-btn-secondary px-3 py-2 text-xs"
                    href={buildObservationUrl({
                      observationId: row.id,
                      planId:
                        row.actionPlans.length === 1
                          ? row.actionPlans[0]?.id
                          : undefined,
                      tab: "plans",
                    })}
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Planes
                  </Link>
                ) : null}
                {canEdit ? (
                  <Link
                    aria-label="Editar observación"
                    className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                    href={`/observaciones/${row.id}/editar`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                ) : null}
                {canDelete ? (
                  <button
                    aria-label="Eliminar observación"
                    className="rounded-lg p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => setPendingDelete(row)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
      {query.isLoading ? (
        <p className="p-8 text-center text-sm text-stone-500">
          Cargando observaciones…
        </p>
      ) : null}
      {query.isError ? (
        <p className="p-8 text-center text-sm text-rose-700">
          {getApiErrorMessage(query.error)}
        </p>
      ) : null}
      {!query.isLoading && query.data?.data.length === 0 ? (
        <p className="p-10 text-center text-sm text-stone-500">
          No hay observaciones para los criterios actuales.
        </p>
      ) : null}
      <div className="flex items-center justify-between border-t border-stone-200 p-4">
        <button
          className="nibol-btn-secondary px-3 py-2 text-sm"
          disabled={page <= 1}
          onClick={() => setPage((value) => value - 1)}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>
        <span className="text-sm text-stone-500">
          Página {page} de{" "}
          {Math.max(
            1,
            Math.ceil((pagination?.total ?? 0) / (pagination?.perPage ?? 20)),
          )}
        </span>
        <button
          className="nibol-btn-secondary px-3 py-2 text-sm"
          disabled={
            page >=
            Math.max(
              1,
              Math.ceil((pagination?.total ?? 0) / (pagination?.perPage ?? 20)),
            )
          }
          onClick={() => setPage((value) => value + 1)}
          type="button"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <ConfirmDialog
        confirmLabel="Eliminar observación"
        description={
          pendingDelete
            ? `Se dejará de mostrar ${pendingDelete.displayCode}. La información, evidencias e historial se conservarán.`
            : ""
        }
        isLoading={remove.isPending}
        onConfirm={async () => {
          if (pendingDelete) await remove.mutateAsync(pendingDelete.id);
        }}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        open={Boolean(pendingDelete)}
        title="¿Eliminar observación?"
        tone="danger"
      />
    </section>
  );
}
