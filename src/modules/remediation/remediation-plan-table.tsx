"use client";

import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DataTableFilters } from "@/components/data-table/data-table-filters";
import type {
  DataTableFilterConfig,
  DataTableFilterValue,
} from "@/components/data-table/types";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { SearchField } from "@/components/ui/search-field";
import { remediationService } from "@/services/remediation-service";
import { cn } from "@/utils";

import {
  formatRemediationDate,
  getActionPlanStatusClasses,
} from "./presentation";

const ACTION_PLAN_FILTER_QUERY_KEYS = [
  "filter.areaId",
  "filter.areaResponsibleUserId",
  "filter.deadlineStatus",
  "filter.dueDateFrom",
  "filter.dueDateTo",
  "filter.observationId",
  "filter.processOwnerUserId",
  "filter.reportNumber",
  "filter.riskLevelId",
  "filter.responsibleUserId",
  "filter.status",
] as const;

export function RemediationPlanTable({ canEdit }: { canEdit: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const planOptionsQuery = useQuery({
    queryFn: () => remediationService.getActionPlanOptions(),
    queryKey: ["action-plan-options"],
    staleTime: 60_000,
  });
  const planOptions = planOptionsQuery.data;
  const filterDefinitions = useMemo<DataTableFilterConfig[]>(
    () => [
      {
        id: "status",
        label: "Estado del plan",
        options: [
          { label: "No iniciado", value: "NOT_STARTED" },
          { label: "Iniciado", value: "STARTED" },
          { label: "Con avance", value: "WITH_PROGRESS" },
          { label: "Concluido", value: "CONCLUDED" },
        ],
        placeholder: "Todos los estados",
        type: "select",
      },
      {
        id: "deadlineStatus",
        label: "Estado de plazo",
        options: [
          { label: "Vigente", value: "VIGENTE" },
          { label: "Vencido", value: "VENCIDO" },
          { label: "Reprogramado", value: "REPROGRAMADO" },
        ],
        placeholder: "Todos los plazos",
        type: "select",
      },
      {
        id: "riskLevelId",
        label: "Nivel de riesgo",
        options: (planOptions?.riskLevels ?? []).map((level) => ({
          label: level.name,
          value: level.id,
        })),
        placeholder: "Todos los niveles",
        type: "select",
      },
    ],
    [planOptions],
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
    filterDefinitions.forEach((filter) => {
      const key = `filter.${filter.queryKey ?? filter.id}`;
      const value = searchParams.get(key);
      if (value) next.set(key, value);
    });
    return next.toString();
  }, [filterDefinitions, searchParams]);
  const params = useMemo(() => {
    const next = new URLSearchParams(filterQuery);
    next.set("page", "1");
    next.set("perPage", "100");
    if (search.trim()) next.set("search", search.trim());
    else next.delete("search");
    next.set("sortBy", "currentDueDate");
    next.set("sortDirection", "asc");
    return next;
  }, [filterQuery, search]);
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
    ACTION_PLAN_FILTER_QUERY_KEYS.forEach((key) => next.delete(key));
    next.delete("search");
    setSearch("");
    replaceFilters(next);
  };
  const query = useQuery({
    queryFn: () => remediationService.listActionPlans(`?${params.toString()}`),
    queryKey: ["action-plans", filterQuery, search],
  });
  return (
    <section className="nibol-panel overflow-visible">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-4">
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
          {activeFilters.length ? (
            <button
              className="font-semibold text-amber-800 hover:underline"
              onClick={resetFilters}
              type="button"
            >
              Limpiar filtros
            </button>
          ) : null}
          <p className="text-sm text-stone-500">
            {query.data?.pagination.total ?? 0} planes
          </p>
        </div>
      </div>
      {activeFilters.length ? (
        <div className="flex flex-wrap gap-2 border-b border-stone-200 px-4 py-3 text-xs text-stone-600">
          <span className="font-semibold">Filtros activos:</span>
          {activeFilters.map((filter, index) => (
            <span
              className="border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-900"
              key={`${filter}-${index}`}
            >
              {filter}
            </span>
          ))}
        </div>
      ) : null}
      <DataTableFilters
        filters={filterDefinitions}
        onChange={updateFilter}
        onReset={resetFilters}
        searchableSelects
        values={filterValues}
      />
      <div className="divide-y divide-stone-200">
        {query.data?.data.map((plan) => (
          <div
            className="relative transition hover:bg-amber-50/40"
            key={plan.id}
          >
            <Link
              className="grid gap-4 p-5 pr-16 transition md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center"
              href={`/planes-accion/${plan.id}`}
            >
              <div>
                <p className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
                  <HighlightedText
                    query={search}
                    text={plan.observation.displayCode}
                  />{" "}
                  · <HighlightedText query={search} text={plan.area.name} />
                </p>
                <h3 className="mt-1 font-semibold text-stone-950">
                  Plan de acción
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-stone-500">
                  <HighlightedText query={search} text={plan.description} />
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  <HighlightedText
                    query={search}
                    text={plan.responsibleUser.name}
                  />
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Avance oficial</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-28 rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-stone-950"
                      style={{ width: `${plan.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {plan.progressPercent}%
                  </span>
                </div>
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs text-stone-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Fecha efectiva
                </p>
                <p className="mt-1 font-semibold">
                  {formatRemediationDate(plan.effectiveDueDate)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "inline-flex border px-2 py-1 text-xs font-semibold",
                      getActionPlanStatusClasses(plan.status),
                    )}
                  >
                    {plan.statusLabel}
                  </span>
                  <span
                    className={cn(
                      "inline-flex border px-2 py-1 text-xs font-semibold",
                      plan.deadlineStatus === "VENCIDO"
                        ? "border-rose-200 bg-rose-50 text-rose-800"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800",
                    )}
                  >
                    {plan.deadlineStatus === "VENCIDO" ? "Vencido" : "Vigente"}
                  </span>
                </div>
                {plan.reprogrammed ? (
                  <p className="mt-1 text-xs font-medium text-amber-700">
                    Reprogramado
                  </p>
                ) : null}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800">
                Ver detalle
                <ChevronRight className="h-4 w-4 text-stone-400" />
              </span>
            </Link>
            {canEdit ? (
              <Link
                aria-label="Editar plan de acción"
                className="absolute top-5 right-12 flex h-11 w-11 items-center justify-center rounded-lg text-stone-500 transition hover:bg-amber-100 hover:text-amber-800"
                href={`/planes-accion/${plan.id}?edit=1`}
                title="Editar plan de acción"
              >
                <Pencil className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        ))}
      </div>
      {query.isLoading ? (
        <p className="p-8 text-center text-sm text-stone-500">
          Cargando planes de acción…
        </p>
      ) : null}
      {!query.isLoading && !query.data?.data.length ? (
        <p className="p-10 text-center text-sm text-stone-500">
          No hay planes de acción registrados.
        </p>
      ) : null}
    </section>
  );
}
