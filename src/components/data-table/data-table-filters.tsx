"use client";

import { ListFilter, RotateCcw } from "lucide-react";

import { cn } from "@/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";

import { hasActiveFilterValue } from "./query";
import type { DataTableFilterConfig, DataTableFilterValue } from "./types";

type DataTableFiltersProps = {
  filters: DataTableFilterConfig[];
  onChange: (filterId: string, value: DataTableFilterValue | undefined) => void;
  onReset: () => void;
  searchableSelects?: boolean;
  values: Record<string, DataTableFilterValue | undefined>;
};

const getSelectValue = (value: DataTableFilterValue | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const renderFilterControl = ({
  filter,
  onChange,
  searchableSelects,
  value,
}: {
  filter: DataTableFilterConfig;
  onChange: (value: DataTableFilterValue | undefined) => void;
  searchableSelects?: boolean;
  value: DataTableFilterValue | undefined;
}) => {
  if (filter.type === "text") {
    return (
      <input
        className="nibol-field h-11 text-sm"
        onChange={(event) => {
          const nextValue = event.target.value.trim();
          onChange(nextValue.length > 0 ? event.target.value : undefined);
        }}
        placeholder={
          filter.placeholder ?? `Filter by ${filter.label.toLowerCase()}`
        }
        type="text"
        value={Array.isArray(value) ? value.join(", ") : (value ?? "")}
      />
    );
  }

  if (filter.type === "date") {
    return (
      <input
        className="nibol-field h-11 text-sm"
        onChange={(event) => {
          const nextValue = event.target.value.trim();
          onChange(nextValue.length > 0 ? nextValue : undefined);
        }}
        type="date"
        value={Array.isArray(value) ? (value[0] ?? "") : (value ?? "")}
      />
    );
  }

  if (filter.type === "multi-select") {
    const selectedValues = Array.isArray(value)
      ? value
      : value
        ? value.split(",").filter(Boolean)
        : [];

    return (
      <SearchableSelect
        multiple
        onChange={(nextValues) => {
          onChange(nextValues.length > 0 ? nextValues : undefined);
        }}
        options={(filter.options ?? []).map((option) => ({
          id: option.value,
          label: option.label,
        }))}
        placeholder={filter.placeholder ?? filter.label}
        value={selectedValues}
      />
    );
  }

  if (searchableSelects && filter.type === "select") {
    const placeholder =
      filter.placeholder ?? `All ${filter.label.toLowerCase()}`;
    const selectedValues = Array.isArray(value)
      ? value
      : value
        ? value.split(",").filter(Boolean)
        : [];

    return (
      <SearchableSelect
        multiple
        onChange={(nextValue) => {
          onChange(nextValue.length > 0 ? nextValue : undefined);
        }}
        options={[
          ...(filter.options ?? []).map((option) => ({
            id: option.value,
            label: option.label,
          })),
        ]}
        placeholder={placeholder}
        value={selectedValues}
      />
    );
  }

  return (
    <select
      className="nibol-field h-11 text-sm"
      onChange={(event) => {
        onChange(
          event.target.value.length > 0 ? event.target.value : undefined,
        );
      }}
      value={getSelectValue(value)}
    >
      <option value="">
        {filter.placeholder ?? `All ${filter.label.toLowerCase()}`}
      </option>
      {filter.options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

/**
 * Shared filter row for server-driven module tables.
 */
export function DataTableFilters({
  filters,
  onChange,
  onReset,
  searchableSelects = false,
  values,
}: DataTableFiltersProps) {
  if (filters.length === 0) {
    return null;
  }

  const activeFilterCount = filters.filter((filter) => {
    return hasActiveFilterValue(values[filter.id]);
  }).length;

  return (
    <div className="nibol-panel flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
            <ListFilter className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-base font-bold text-[var(--foreground)] uppercase">
              Filtros de tabla
            </p>
            <p className="text-xs text-[var(--muted)]">
              {activeFilterCount > 0
                ? `${activeFilterCount} filtro${activeFilterCount === 1 ? "" : "s"} aplicado${activeFilterCount === 1 ? "" : "s"}`
                : "Ajuste el conjunto de resultados actual"}
            </p>
          </div>
        </div>

        <button
          className={cn(
            "inline-flex items-center gap-2 border px-3 py-2 text-sm font-semibold transition",
            activeFilterCount > 0
              ? "border-[var(--border-strong)] bg-white text-[var(--foreground)] hover:border-[var(--primary)]"
              : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)]",
          )}
          disabled={activeFilterCount === 0}
          onClick={onReset}
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar filtros
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {filters.map((filter) => (
          <div key={filter.id} className="space-y-2">
            <label className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)] uppercase">
              {filter.label}
            </label>
            {renderFilterControl({
              filter,
              onChange: (value) => {
                onChange(filter.id, value);
              },
              searchableSelects,
              value: values[filter.id],
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
