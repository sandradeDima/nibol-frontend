"use client";

import { ListFilter, RotateCcw } from "lucide-react";

import { cn } from "@/utils";

import { hasActiveFilterValue } from "./query";
import type { DataTableFilterConfig, DataTableFilterValue } from "./types";

type DataTableFiltersProps = {
  filters: DataTableFilterConfig[];
  onChange: (filterId: string, value: DataTableFilterValue | undefined) => void;
  onReset: () => void;
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
  value,
}: {
  filter: DataTableFilterConfig;
  onChange: (value: DataTableFilterValue | undefined) => void;
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
        placeholder={filter.placeholder ?? `Filter by ${filter.label.toLowerCase()}`}
        type="text"
        value={Array.isArray(value) ? value.join(", ") : value ?? ""}
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
        value={Array.isArray(value) ? value[0] ?? "" : value ?? ""}
      />
    );
  }

  if (filter.type === "multi-select") {
    const selectedValues = Array.isArray(value) ? value : [];

    return (
      <details className="group relative min-w-[13rem]">
        <summary className="flex h-11 cursor-pointer list-none items-center justify-between border border-[var(--border)] bg-white px-4 text-sm font-medium text-[var(--foreground-soft)] transition hover:border-[var(--primary)] [&::-webkit-details-marker]:hidden">
          <span className="truncate">
            {selectedValues.length > 0
              ? `${filter.label}: ${selectedValues.length} selected`
              : filter.label}
          </span>
          <ListFilter className="h-4 w-4 text-[var(--muted)]" />
        </summary>
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full min-w-[15rem] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-panel)]">
          <div className="grid gap-2">
            {filter.options?.map((option) => {
              const checked = selectedValues.includes(option.value);

              return (
                <label
                  key={option.value}
                  className="flex items-center gap-3 px-2 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-soft)]"
                >
                  <input
                    checked={checked}
                    className="h-4 w-4 border-[var(--border-strong)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    onChange={(event) => {
                      const nextValues = event.target.checked
                        ? [...selectedValues, option.value]
                        : selectedValues.filter((item) => item !== option.value);

                      onChange(nextValues.length > 0 ? nextValues : undefined);
                    }}
                    type="checkbox"
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </details>
    );
  }

  return (
    <select
      className="nibol-field h-11 text-sm"
      onChange={(event) => {
        onChange(event.target.value.length > 0 ? event.target.value : undefined);
      }}
      value={getSelectValue(value)}
    >
      <option value="">{filter.placeholder ?? `All ${filter.label.toLowerCase()}`}</option>
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
            <p className="font-display text-base font-bold uppercase text-[var(--foreground)]">
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
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {filter.label}
            </label>
            {renderFilterControl({
              filter,
              onChange: (value) => {
                onChange(filter.id, value);
              },
              value: values[filter.id],
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
