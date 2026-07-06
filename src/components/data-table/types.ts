import type { ColumnDef } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { PaginationMeta } from "@/types";

export type DataTableFilterType = "date" | "multi-select" | "select" | "text";
export type DataTableFilterValue = string | string[];
export type DataTableActionTone = "danger" | "default";

export type DataTableFilterOption = {
  label: string;
  value: string;
};

/**
 * Declares a reusable server-backed filter that can be attached to a DataTable.
 * The filter id doubles as the backend query field unless queryKey is provided.
 */
export type DataTableFilterConfig = {
  defaultValue?: DataTableFilterValue;
  id: string;
  label: string;
  options?: DataTableFilterOption[];
  placeholder?: string;
  queryKey?: string;
  type?: DataTableFilterType;
};

export type DataTableActionConfirmation<TRow> = {
  confirmLabel?: string;
  description: string | ((rows: TRow[]) => string);
  title: string;
  tone?: DataTableActionTone;
};

type DataTableBaseAction<TRow> = {
  confirmation?: DataTableActionConfirmation<TRow>;
  icon?: LucideIcon;
  id: string;
  invalidateAfterSuccess?: boolean;
  label: string;
  successMessage?: string | ((rows: TRow[]) => string);
  tone?: DataTableActionTone;
};

export type DataTableRowAction<TRow> = DataTableBaseAction<TRow> & {
  disabled?: boolean | ((row: TRow) => boolean);
  hidden?: boolean | ((row: TRow) => boolean);
  href?: (row: TRow) => string;
  onClick?: (row: TRow) => Promise<void> | void;
  variant?: "custom" | "delete" | "edit" | "view";
};

export type DataTableBulkAction<TRow> = DataTableBaseAction<TRow> & {
  disabled?: boolean | ((rows: TRow[]) => boolean);
  hidden?: boolean | ((rows: TRow[]) => boolean);
  onClick: (rows: TRow[]) => Promise<void> | void;
  variant?: "custom" | "delete" | "export";
};

export type DataTableCsvColumn<TRow> = {
  header: string;
  key: string;
  value: (row: TRow) => unknown;
};

export type DataTableCsvConfig<TRow> = {
  columns?: DataTableCsvColumn<TRow>[];
  fileName?: string;
  mapRow?: (row: TRow) => Record<string, unknown>;
};

export type DataTableEmptyState = {
  action?: ReactNode;
  description: string;
  title: string;
};

/**
 * Shared table configuration used by every server-backed module in the app.
 * New modules only need to provide columns, an endpoint, and optional filters.
 */
export interface DataTableConfig<TRow> {
  bulkActions?: DataTableBulkAction<TRow>[];
  columns: ColumnDef<TRow>[];
  csv?: DataTableCsvConfig<TRow>;
  defaultSort?: {
    desc?: boolean;
    id: string;
  };
  emptyState?: DataTableEmptyState;
  enableSelection?: boolean;
  filters?: DataTableFilterConfig[];
  getRowId?: (row: TRow) => string;
  pageSizeOptions?: number[];
  queryKey?: readonly unknown[];
  rowActions?: DataTableRowAction<TRow>[];
  searchPlaceholder?: string;
}

export interface DataTableQueryState {
  filters: Record<string, DataTableFilterValue | undefined>;
  page: number;
  perPage: number;
  search: string;
  sorting: Array<{
    desc: boolean;
    id: string;
  }>;
}

export interface DataTableResult<TRow> {
  data: TRow[];
  pagination: PaginationMeta;
}
