"use client";

import {
  type RefObject,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  Download,
  Ellipsis,
  RefreshCcw,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { apiClient } from "@/services/api-client";
import type { PaginatedApiSuccessResponse } from "@/types";
import { cn, getApiErrorMessage } from "@/utils";

import { exportRowsToCsv } from "./csv";
import { DataTableFilters } from "./data-table-filters";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableSearch } from "./data-table-search";
import { buildDataTableSearchParams, hasActiveFilterValue } from "./query";
import type {
  DataTableBulkAction,
  DataTableConfig,
  DataTableFilterValue,
  DataTableResult,
  DataTableRowAction,
} from "./types";

type DataTableProps<TRow> = {
  className?: string;
  config: DataTableConfig<TRow>;
  endpoint: string;
};

type PendingAction<TRow> =
  | {
      action: DataTableBulkAction<TRow>;
      rows: TRow[];
      scope: "bulk";
    }
  | {
      action: DataTableRowAction<TRow>;
      rows: TRow[];
      scope: "row";
    };

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const FLOATING_MENU_GAP_PX = 8;
const FLOATING_MENU_VIEWPORT_PADDING_PX = 16;

const buttonClassName =
  "inline-flex items-center gap-2 border px-3.5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

const getActionButtonClassName = (tone: "danger" | "default" = "default") => {
  return cn(
    buttonClassName,
    tone === "danger"
      ? "border-[var(--accent)] bg-[var(--accent)] text-white hover:opacity-90"
      : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--foreground)]",
  );
};

const resolveUpdater = <TValue,>(updater: Updater<TValue>, currentValue: TValue): TValue => {
  if (typeof updater === "function") {
    return (updater as (previousValue: TValue) => TValue)(currentValue);
  }

  return updater;
};

const isRowActionHidden = <TRow,>(
  action: DataTableRowAction<TRow>,
  row: TRow,
): boolean => {
  if (typeof action.hidden === "function") {
    return action.hidden(row);
  }

  return action.hidden ?? false;
};

const isRowActionDisabled = <TRow,>(
  action: DataTableRowAction<TRow>,
  row: TRow,
): boolean => {
  if (typeof action.disabled === "function") {
    return action.disabled(row);
  }

  return action.disabled ?? false;
};

const isBulkActionHidden = <TRow,>(
  action: DataTableBulkAction<TRow>,
  rows: TRow[],
): boolean => {
  if (typeof action.hidden === "function") {
    return action.hidden(rows);
  }

  return action.hidden ?? false;
};

const isBulkActionDisabled = <TRow,>(
  action: DataTableBulkAction<TRow>,
  rows: TRow[],
): boolean => {
  if (typeof action.disabled === "function") {
    return action.disabled(rows);
  }

  return action.disabled ?? false;
};

const resolveActionSuccessMessage = <TRow,>(
  action: DataTableBulkAction<TRow> | DataTableRowAction<TRow>,
  rows: TRow[],
): string | null => {
  if (typeof action.successMessage === "function") {
    return action.successMessage(rows);
  }

  return action.successMessage ?? null;
};

const useFloatingMenuPosition = <TAnchor extends HTMLElement>(
  isOpen: boolean,
  anchorRef: RefObject<TAnchor | null>,
  menuRef: RefObject<HTMLDivElement | null>,
) => {
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const updatePosition = useEffectEvent(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;

    if (!anchor || !menu) {
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const openUpward =
      anchorRect.bottom + FLOATING_MENU_GAP_PX + menuRect.height >
        window.innerHeight - FLOATING_MENU_VIEWPORT_PADDING_PX &&
      anchorRect.top - FLOATING_MENU_GAP_PX - menuRect.height >=
        FLOATING_MENU_VIEWPORT_PADDING_PX;
    const left = Math.min(
      window.innerWidth - FLOATING_MENU_VIEWPORT_PADDING_PX - menuRect.width,
      Math.max(
        FLOATING_MENU_VIEWPORT_PADDING_PX,
        anchorRect.right - menuRect.width,
      ),
    );
    const top = openUpward
      ? Math.max(
          FLOATING_MENU_VIEWPORT_PADDING_PX,
          anchorRect.top - FLOATING_MENU_GAP_PX - menuRect.height,
        )
      : Math.min(
          window.innerHeight -
            FLOATING_MENU_VIEWPORT_PADDING_PX -
            menuRect.height,
          anchorRect.bottom + FLOATING_MENU_GAP_PX,
        );

    setPosition({
      left,
      top,
    });
  });

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      updatePosition();
    });

    window.addEventListener("resize", updatePosition);
    document.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  return position;
};

const renderSortIcon = (isSorted: false | "asc" | "desc") => {
  if (isSorted === "asc") {
    return <ArrowUp className="h-4 w-4" />;
  }

  if (isSorted === "desc") {
    return <ArrowDown className="h-4 w-4" />;
  }

  return <ArrowUpDown className="h-4 w-4" />;
};

function RowActionsMenu<TRow>({
  isOpen,
  menuId,
  onActionClick,
  onOpenChange,
  row,
  rowActions,
}: {
  isOpen: boolean;
  menuId: string;
  onActionClick: (action: DataTableRowAction<TRow>, row: TRow) => void;
  onOpenChange: (menuId: string | null) => void;
  row: TRow;
  rowActions: DataTableRowAction<TRow>[];
}) {
  const actions = rowActions.filter((action) => !isRowActionHidden(action, row));
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuPosition = useFloatingMenuPosition(isOpen, buttonRef, menuRef);

  const handleDocumentPointerDown = useEffectEvent((event: PointerEvent) => {
    const target = event.target as Node;

    if (
      !buttonRef.current?.contains(target) &&
      !menuRef.current?.contains(target)
    ) {
      onOpenChange(null);
    }
  });

  const handleDocumentKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onOpenChange(null);
    }
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isOpen]);

  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative isolate">
        <button
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className="flex h-10 w-10 items-center justify-center border border-[var(--border)] bg-white text-[var(--foreground-soft)] transition hover:border-[var(--primary)] hover:text-[var(--foreground)]"
          onClick={() => {
            onOpenChange(isOpen ? null : menuId);
          }}
          ref={buttonRef}
          type="button"
        >
          <Ellipsis className="h-4 w-4" />
        </button>
      </div>
      {isOpen
        ? createPortal(
            <div
              className="fixed z-[80] min-w-[12rem] border border-[var(--border)] bg-white p-2 shadow-[var(--shadow-panel-strong)]"
              ref={menuRef}
              style={{
                left: menuPosition?.left ?? 0,
                top: menuPosition?.top ?? 0,
                visibility: menuPosition ? "visible" : "hidden",
              }}
            >
              <div className="grid gap-1">
                {actions.map((action) => {
                  const Icon = action.icon;
                  const className = cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium transition",
                    action.tone === "danger"
                      ? "text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                      : "text-[var(--foreground-soft)] hover:bg-[var(--surface-soft)]",
                  );

                  if (action.href) {
                    return (
                      <Link
                        key={action.id}
                        className={className}
                        href={action.href(row)}
                        onClick={() => {
                          onOpenChange(null);
                        }}
                      >
                        {Icon ? <Icon className="h-4 w-4" /> : null}
                        {action.label}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={action.id}
                      className={className}
                      disabled={isRowActionDisabled(action, row)}
                      onClick={() => {
                        onOpenChange(null);
                        onActionClick(action, row);
                      }}
                      type="button"
                    >
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function ColumnVisibilityMenu<TRow>({
  isOpen,
  onOpenChange,
  table,
}: {
  isOpen: boolean;
  onOpenChange: (menuId: string | null) => void;
  table: ReturnType<typeof useReactTable<TRow>>;
}) {
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide() && !column.id.startsWith("__"));
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuPosition = useFloatingMenuPosition(isOpen, buttonRef, menuRef);

  const handleDocumentPointerDown = useEffectEvent((event: PointerEvent) => {
    const target = event.target as Node;

    if (
      !buttonRef.current?.contains(target) &&
      !menuRef.current?.contains(target)
    ) {
      onOpenChange(null);
    }
  });

  const handleDocumentKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onOpenChange(null);
    }
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isOpen]);

  if (hideableColumns.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative">
        <button
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className={getActionButtonClassName()}
          onClick={() => {
            onOpenChange(isOpen ? null : "__columns");
          }}
          ref={buttonRef}
          type="button"
        >
          <Columns3 className="h-4 w-4" />
          Columnas
        </button>
      </div>
      {isOpen
        ? createPortal(
            <div
              className="fixed z-[80] min-w-[14rem] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-panel-strong)]"
              ref={menuRef}
              style={{
                left: menuPosition?.left ?? 0,
                top: menuPosition?.top ?? 0,
                visibility: menuPosition ? "visible" : "hidden",
              }}
            >
              <div className="grid gap-2">
                {hideableColumns.map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-3 px-2 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-soft)]"
                  >
                    <input
                      checked={column.getIsVisible()}
                      className="h-4 w-4 border-[var(--border-strong)] text-[var(--primary)] focus:ring-[var(--primary)]"
                      onChange={(event) => {
                        column.toggleVisibility(event.target.checked);
                      }}
                      type="checkbox"
                    />
                    {String(column.columnDef.header ?? column.id)}
                  </label>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/**
 * Reusable enterprise-style DataTable with a server-side query contract.
 * Future modules only need an endpoint plus a DataTableConfig to render.
 */
export function DataTable<TRow>({
  className,
  config,
  endpoint,
}: DataTableProps<TRow>) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: config.pageSizeOptions?.[0] ?? DEFAULT_PAGE_SIZE_OPTIONS[0],
  });
  const [sorting, setSorting] = useState<SortingState>(
    config.defaultSort
      ? [
          {
            desc: config.defaultSort.desc ?? false,
            id: config.defaultSort.id,
          },
        ]
      : [],
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [filterValues, setFilterValues] = useState<
    Record<string, DataTableFilterValue | undefined>
  >(
    Object.fromEntries(
      (config.filters ?? []).map((filter) => [filter.id, filter.defaultValue]),
    ),
  );
  const [pendingAction, setPendingAction] = useState<PendingAction<TRow> | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filters = config.filters ?? [];
  const tableQueryKey = config.queryKey ?? ["data-table", endpoint];
  const shouldEnableSelection = config.enableSelection ?? true;
  const pageSizeOptions = config.pageSizeOptions ?? [...DEFAULT_PAGE_SIZE_OPTIONS];

  const searchParams = buildDataTableSearchParams({
    filters: filterValues,
    filterDefinitions: filters,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: deferredSearch,
    sorting,
  });
  const requestSignature = searchParams.toString();

  useEffect(() => {
    setRowSelection({});
    setActionError(null);
    setActionSuccess(null);
  }, [requestSignature]);

  useEffect(() => {
    setOpenMenuId(null);
  }, [requestSignature]);

  const tableQuery = useQuery<DataTableResult<TRow>>({
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const requestUrl = requestSignature
        ? `${endpoint}?${requestSignature}`
        : endpoint;
      const response = await apiClient.get<PaginatedApiSuccessResponse<TRow[]>>(
        requestUrl,
      );

      return {
        data: response.data.data,
        pagination: response.data.pagination,
      };
    },
    queryKey: [...tableQueryKey, requestSignature],
  });

  const rows = tableQuery.data?.data ?? [];
  const paginationMeta = tableQuery.data?.pagination ?? {
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    total: 0,
  };
  const pageCount = Math.max(1, Math.ceil(paginationMeta.total / paginationMeta.perPage));

  const runtimeColumns = [
    ...(shouldEnableSelection
      ? [
          {
                cell: ({ row }: { row: Row<TRow> }) => (
                  <input
                    aria-label="Select row"
                    checked={row.getIsSelected()}
                    className="h-4 w-4 border-[var(--border-strong)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    onChange={row.getToggleSelectedHandler()}
                    type="checkbox"
                  />
            ),
            enableHiding: false,
            enableSorting: false,
            header: () => (
              <input
                aria-label="Select all rows on page"
                checked={table.getIsAllPageRowsSelected()}
                className="h-4 w-4 border-[var(--border-strong)] text-[var(--primary)] focus:ring-[var(--primary)]"
                onChange={table.getToggleAllPageRowsSelectedHandler()}
                type="checkbox"
              />
            ),
            id: "__select",
            size: 48,
          },
        ]
      : []),
    ...config.columns,
    ...(config.rowActions?.length
      ? [
          {
            cell: ({ row }: { row: Row<TRow> }) => (
              <RowActionsMenu
                isOpen={openMenuId === row.id}
                menuId={row.id}
                onActionClick={(action, currentRow) => {
                  handleRowAction(action, currentRow);
                }}
                onOpenChange={setOpenMenuId}
                row={row.original}
                rowActions={config.rowActions ?? []}
              />
            ),
            enableHiding: false,
            enableSorting: false,
            header: "Actions",
            id: "__actions",
            size: 80,
          },
        ]
      : []),
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns: runtimeColumns,
    data: rows,
    enableRowSelection: shouldEnableSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId: config.getRowId,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const nextSorting = resolveUpdater(updater, sorting).slice(0, 1);
      setSorting(nextSorting);
      setPagination((current) => ({
        ...current,
        pageIndex: 0,
      }));
    },
    pageCount,
    state: {
      columnVisibility,
      rowSelection,
      sorting,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  const activeFilterCount = filters.filter((filter) => {
    return hasActiveFilterValue(filterValues[filter.id]);
  }).length;

  const invalidateTable = async () => {
    await queryClient.invalidateQueries({
      queryKey: tableQueryKey,
    });
  };

  const handleActionError = (error: unknown) => {
    setActionSuccess(null);
    setActionError(getApiErrorMessage(error));
  };

  const executeRowAction = async (
    action: DataTableRowAction<TRow>,
    row: TRow,
  ): Promise<void> => {
    if (!action.onClick) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setIsExecutingAction(true);

    try {
      await action.onClick(row);

      if (action.invalidateAfterSuccess ?? action.variant === "delete") {
        await invalidateTable();
      }

      const successMessage = resolveActionSuccessMessage(action, [row]);

      if (successMessage) {
        setActionSuccess(successMessage);
      }
    } catch (error) {
      handleActionError(error);
    } finally {
      setIsExecutingAction(false);
    }
  };

  const executeBulkAction = async (
    action: DataTableBulkAction<TRow>,
    currentRows: TRow[],
  ): Promise<void> => {
    setActionError(null);
    setActionSuccess(null);
    setIsExecutingAction(true);

    try {
      await action.onClick(currentRows);

      if (action.invalidateAfterSuccess ?? action.variant === "delete") {
        await invalidateTable();
      }

      const successMessage = resolveActionSuccessMessage(action, currentRows);

      if (successMessage) {
        setActionSuccess(successMessage);
      }
    } catch (error) {
      handleActionError(error);
    } finally {
      setIsExecutingAction(false);
    }
  };

  function handleRowAction(action: DataTableRowAction<TRow>, row: TRow) {
    if (action.confirmation) {
      setPendingAction({
        action,
        rows: [row],
        scope: "row",
      });
      return;
    }

    void executeRowAction(action, row);
  }

  const handleBulkActionClick = (action: DataTableBulkAction<TRow>) => {
    if (action.confirmation) {
      setPendingAction({
        action,
        rows: selectedRows,
        scope: "bulk",
      });
      return;
    }

    void executeBulkAction(action, selectedRows);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    if (pendingAction.scope === "row") {
      await executeRowAction(pendingAction.action, pendingAction.rows[0]);
    } else {
      await executeBulkAction(pendingAction.action, pendingAction.rows);
    }

    setPendingAction(null);
  };

  const handleFilterChange = (
    filterId: string,
    value: DataTableFilterValue | undefined,
  ) => {
    setFilterValues((current) => ({
      ...current,
      [filterId]: value,
    }));
    setPagination((current) => ({
      ...current,
      pageIndex: 0,
    }));
  };

  const handleResetFilters = () => {
    setFilterValues(
      Object.fromEntries(filters.map((filter) => [filter.id, filter.defaultValue])),
    );
    setPagination((current) => ({
      ...current,
      pageIndex: 0,
    }));
  };

  if (tableQuery.isError && rows.length === 0) {
    return (
      <ErrorState
        action={
          <button
            className={getActionButtonClassName()}
            onClick={() => {
              void tableQuery.refetch();
            }}
            type="button"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry
          </button>
        }
        description={tableQuery.error.message}
        title="La tabla no pudo cargar los registros"
      />
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      <div className="nibol-panel p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <DataTableSearch
              isBusy={tableQuery.isFetching}
              onChange={(value) => {
                setSearchInput(value);
                setPagination((current) => ({
                  ...current,
                  pageIndex: 0,
                }));
              }}
              placeholder={config.searchPlaceholder}
              value={searchInput}
            />
            <div className="flex flex-wrap gap-3">
              <ColumnVisibilityMenu
                isOpen={openMenuId === "__columns"}
                onOpenChange={setOpenMenuId}
                table={table}
              />
              {config.csv ? (
                <button
                  className={getActionButtonClassName()}
                  disabled={rows.length === 0}
                  onClick={() => {
                    exportRowsToCsv(rows, config.csv);
                  }}
                  type="button"
                >
                  <Download className="h-4 w-4" />
                  Exportar pagina
                </button>
              ) : null}
              <button
                className={getActionButtonClassName()}
                disabled={tableQuery.isFetching}
                onClick={() => {
                  void tableQuery.refetch();
                }}
                type="button"
              >
                <RefreshCcw className="h-4 w-4" />
                Actualizar
              </button>
            </div>
          </div>

          <div className="text-sm text-[var(--foreground-soft)]">
            <span className="font-semibold text-[var(--foreground)]">{paginationMeta.total}</span>{" "}
            registros
            {activeFilterCount > 0 ? ` • ${activeFilterCount} filtros activos` : ""}
          </div>
        </div>

        {selectedRows.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 border border-[var(--primary)] bg-[var(--primary)] px-4 py-4 text-white lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm">
              <span className="font-semibold text-slate-200">{selectedRows.length}</span>{" "}
              fila{selectedRows.length === 1 ? "" : "s"} seleccionada{selectedRows.length === 1 ? "" : "s"} en esta pagina
            </p>

            <div className="flex flex-wrap gap-3">
              {config.csv ? (
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-stone-50 transition hover:bg-white/16"
                  onClick={() => {
                    exportRowsToCsv(selectedRows, {
                      ...config.csv,
                      fileName:
                        config.csv
                          ? `${
                              config.csv.fileName?.replace(".csv", "") ??
                              "selected-records"
                            }-selected.csv`
                          : "selected-records.csv",
                    });
                  }}
                  type="button"
                >
                  <Download className="h-4 w-4" />
                  Exportar seleccion
                </button>
              ) : null}

              {(config.bulkActions ?? [])
                .filter((action) => !isBulkActionHidden(action, selectedRows))
                .map((action) => (
                  <button
                    key={action.id}
                    className={getActionButtonClassName(action.tone)}
                    disabled={isBulkActionDisabled(action, selectedRows)}
                    onClick={() => {
                      handleBulkActionClick(action);
                    }}
                    type="button"
                  >
                    {action.icon ? <action.icon className="h-4 w-4" /> : null}
                    {action.label}
                  </button>
                ))}

              <button
                className="inline-flex items-center gap-2 border border-white/12 px-3.5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white"
                onClick={() => {
                  setRowSelection({});
                }}
                type="button"
              >
                Limpiar seleccion
              </button>
            </div>
          </div>
        ) : null}

        {actionError ? (
          <div className="mt-4 border border-[color:color-mix(in_srgb,var(--accent)_18%,white)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
            {actionError}
          </div>
        ) : null}
        {actionSuccess ? (
          <div className="mt-4 border border-[color:color-mix(in_srgb,var(--success)_18%,white)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]">
            {actionSuccess}
          </div>
        ) : null}
      </div>

      <DataTableFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        values={filterValues}
      />

      {tableQuery.isLoading && rows.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
          <div className="animate-pulse space-y-4 p-5">
            <div className="h-5 w-40 bg-[var(--border)]" />
            <div className="h-12 bg-[var(--border)]" />
            <div className="h-12 bg-[var(--border)]" />
            <div className="h-12 bg-[var(--border)]" />
            <div className="h-12 bg-[var(--border)]" />
          </div>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          action={config.emptyState?.action}
          description={
            config.emptyState?.description ??
            "No se encontraron registros con la busqueda y los filtros aplicados."
          }
          title={config.emptyState?.title ?? "No se encontraron registros"}
        />
      ) : (
        <div className="relative border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-[var(--secondary)] text-left text-sm text-slate-100">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="border-b border-white/8 px-4 py-4 first:pl-5 last:pr-5"
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            className="inline-flex items-center gap-2 text-sm font-semibold"
                            onClick={header.column.getToggleSortingHandler()}
                            type="button"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {renderSortIcon(header.column.getIsSorted())}
                          </button>
                        ) : (
                          <div className="text-sm font-semibold">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className={cn(tableQuery.isFetching && "opacity-70")}>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--border)] text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="border-b border-[var(--border)] px-4 py-4 align-top first:pl-5 last:pr-5"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DataTablePagination
        isLoading={tableQuery.isFetching}
        onPageChange={(page) => {
          setPagination((current) => ({
            ...current,
            pageIndex: page - 1,
          }));
        }}
        onPageSizeChange={(pageSize) => {
          setPagination({
            pageIndex: 0,
            pageSize,
          });
        }}
        page={paginationMeta.page}
        pageSize={paginationMeta.perPage}
        pageSizeOptions={pageSizeOptions}
        total={paginationMeta.total}
      />

      <ConfirmDialog
        confirmLabel={pendingAction?.action.confirmation?.confirmLabel}
        description={
          typeof pendingAction?.action.confirmation?.description === "function"
            ? pendingAction.action.confirmation.description(pendingAction.rows)
            : pendingAction?.action.confirmation?.description ?? ""
        }
        isLoading={isExecutingAction}
        onConfirm={() => {
          void handleConfirmAction();
        }}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
        open={Boolean(pendingAction)}
        title={pendingAction?.action.confirmation?.title ?? "Confirm action"}
        tone={pendingAction?.action.confirmation?.tone ?? pendingAction?.action.tone}
      />
    </section>
  );
}
