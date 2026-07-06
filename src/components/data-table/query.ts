import type { SortingState } from "@tanstack/react-table";

import type { DataTableFilterConfig, DataTableFilterValue } from "./types";

const hasFilterValue = (value: DataTableFilterValue | undefined): boolean => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value.trim().length > 0;
};

/**
 * Serializes the shared table state into a stable query-string contract that
 * backend modules can parse consistently.
 */
export const buildDataTableSearchParams = ({
  filters,
  filterDefinitions,
  page,
  perPage,
  search,
  sorting,
}: {
  filters: Record<string, DataTableFilterValue | undefined>;
  filterDefinitions: DataTableFilterConfig[];
  page: number;
  perPage: number;
  search: string;
  sorting: SortingState;
}): URLSearchParams => {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("perPage", String(perPage));

  if (search.trim().length > 0) {
    params.set("search", search.trim());
  }

  const [sort] = sorting;

  if (sort) {
    params.set("sortBy", sort.id);
    params.set("sortDirection", sort.desc ? "desc" : "asc");
  }

  filterDefinitions.forEach((filter) => {
    const value = filters[filter.id];

    if (!hasFilterValue(value)) {
      return;
    }

    const queryKey = filter.queryKey ?? filter.id;

    if (Array.isArray(value)) {
      params.set(`filter.${queryKey}`, value.join(","));
      return;
    }

    if (typeof value === "string") {
      params.set(`filter.${queryKey}`, value.trim());
    }
  });

  return params;
};

export const hasActiveFilterValue = (value: DataTableFilterValue | undefined): boolean => {
  return hasFilterValue(value);
};
