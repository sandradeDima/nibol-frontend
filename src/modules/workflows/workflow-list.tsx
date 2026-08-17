"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  ArrowUpRight,
  CheckCircle2,
  Ellipsis,
  FilePenLine,
  GitBranch,
  History,
  Plus,
  RefreshCcw,
  Search,
  Users,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormDialog } from "@/components/ui/form-dialog";
import { StatCard, StatCardSkeleton } from "@/components/ui/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QUERY_KEYS } from "@/lib/constants";
import {
  workflowDuplicateFormSchema,
  type WorkflowDuplicateFormValues,
} from "@/modules/workflows/forms";
import {
  formatDate,
  formatProcessType,
  formatUser,
  formatWorkflowStatus,
  getLatestVersionLabel,
  getStatusBadgeClass,
} from "@/modules/workflows/presentation";
import { workflowService } from "@/services/workflow-service";
import type {
  WorkflowDefinitionListItem,
  WorkflowVersionSummary,
} from "@/types";
import { getApiErrorMessage } from "@/utils";

type WorkflowListProps = {
  canArchive: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canViewVersions: boolean;
};

const pageSizeOptions = [10, 20, 50];

const getVersionChoices = (
  row: WorkflowDefinitionListItem,
): WorkflowVersionSummary[] => {
  const choices = [row.activeVersion, row.latestVersion].filter(
    (version): version is WorkflowVersionSummary => Boolean(version),
  );

  return choices.filter(
    (version, index) =>
      choices.findIndex((candidate) => candidate.id === version.id) === index,
  );
};

function WorkflowActionMenu({
  canArchive,
  canCreate,
  canEdit,
  canViewVersions,
  onArchive,
  onDuplicate,
  row,
}: WorkflowListProps & {
  onArchive: (row: WorkflowDefinitionListItem) => void;
  onDuplicate: (row: WorkflowDefinitionListItem) => void;
  row: WorkflowDefinitionListItem;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const focusMenuItem = (direction: "first" | "last" | "next" | "previous") => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    const nextIndex =
      direction === "first"
        ? 0
        : direction === "last"
          ? items.length - 1
          : direction === "next"
            ? (currentIndex + 1) % items.length
            : (currentIndex - 1 + items.length) % items.length;
    items[nextIndex]?.focus();
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const close = (event: MouseEvent) => {
      if (
        !(event.target as HTMLElement).closest(
          `[data-workflow-menu="${row.id}"]`,
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, [open, row.id]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => focusMenuItem("first"));
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusMenuItem("next");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusMenuItem("previous");
    } else if (event.key === "Home") {
      event.preventDefault();
      focusMenuItem("first");
    } else if (event.key === "End") {
      event.preventDefault();
      focusMenuItem("last");
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className="relative" data-workflow-menu={row.id}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Acciones del flujo ${row.name}`}
        className="flex h-10 w-10 items-center justify-center border border-[var(--border)] bg-white text-[var(--foreground-soft)] transition hover:border-[var(--primary)] hover:text-[var(--foreground)]"
        onClick={() => {
          setOpen((current) => !current);
        }}
        onKeyDown={(event) => {
          if (
            event.key === "ArrowDown" ||
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <Ellipsis className="h-4 w-4" />
      </button>

      {open ? (
        <div
          aria-label={`Acciones del flujo ${row.name}`}
          className="absolute top-[calc(100%+0.5rem)] right-0 z-30 min-w-[14rem] border border-[var(--border)] bg-white p-2 shadow-[var(--shadow-panel-strong)]"
          id={menuId}
          onKeyDown={handleMenuKeyDown}
          ref={menuRef}
          role="menu"
        >
          <Link
            className="flex min-h-10 items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[var(--foreground-soft)] transition hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
            href={`/configuracion/flujos/${row.id}`}
            onClick={closeMenu}
            role="menuitem"
            tabIndex={-1}
          >
            <ArrowUpRight className="h-4 w-4" />
            Ver detalle
          </Link>
          {canEdit && row.status !== "ARCHIVED" ? (
            <Link
              className="flex min-h-10 items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[var(--foreground-soft)] transition hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
              href={`/configuracion/flujos/${row.id}?edit=1`}
              onClick={closeMenu}
              role="menuitem"
              tabIndex={-1}
            >
              <FilePenLine className="h-4 w-4" />
              Editar metadatos
            </Link>
          ) : null}
          {canViewVersions ? (
            <Link
              className="flex min-h-10 items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[var(--foreground-soft)] transition hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
              href={`/configuracion/flujos/${row.id}/versiones`}
              onClick={closeMenu}
              role="menuitem"
              tabIndex={-1}
            >
              <History className="h-4 w-4" />
              Ver versiones
            </Link>
          ) : null}
          {canCreate ? (
            <button
              className="flex min-h-10 w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[var(--foreground-soft)] transition hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
              onClick={() => {
                closeMenu();
                onDuplicate(row);
              }}
              role="menuitem"
              tabIndex={-1}
              type="button"
            >
              <ArchiveRestore className="h-4 w-4" />
              Duplicar flujo
            </button>
          ) : null}
          {canArchive && row.status !== "ARCHIVED" ? (
            <button
              className="flex min-h-10 w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent-soft)] focus-visible:bg-[var(--accent-soft)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              onClick={() => {
                closeMenu();
                onArchive(row);
              }}
              role="menuitem"
              tabIndex={-1}
              type="button"
            >
              <Archive className="h-4 w-4" />
              Archivar flujo
            </button>
          ) : null}
          {canViewVersions && row.latestVersion && row.status !== "ARCHIVED" ? (
            <Link
              className="mt-1 flex min-h-10 items-center gap-3 border-t border-[var(--border)] px-3 py-2.5 text-sm font-semibold text-[var(--primary)] transition hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
              href={`/configuracion/flujos/${row.id}/versiones/${row.latestVersion.id}/disenador`}
              onClick={closeMenu}
              role="menuitem"
              tabIndex={-1}
            >
              <GitBranch className="h-4 w-4" />
              Abrir diseñador
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function WorkflowDuplicateDialog({
  onClose,
  onSuccess,
  row,
}: {
  onClose: () => void;
  onSuccess: (workflowId: string) => void;
  row: WorkflowDefinitionListItem | null;
}) {
  const form = useForm<WorkflowDuplicateFormValues>({
    defaultValues: {
      name: "",
      sourceVersionId: "",
      versionNotes: "",
    },
    resolver: zodResolver(workflowDuplicateFormSchema),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (values: WorkflowDuplicateFormValues) => {
      if (!row) {
        throw new Error("Seleccione un workflow para duplicar.");
      }

      const parsed = workflowDuplicateFormSchema.parse(values);
      return workflowService.duplicateWorkflow(row.id, {
        name: parsed.name.trim(),
        sourceVersionId: parsed.sourceVersionId,
        versionNotes: parsed.versionNotes.trim() || null,
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
    onSuccess: (workflow) => {
      toast.success("Flujo duplicado como borrador.");
      onClose();
      onSuccess(workflow.id);
    },
  });

  useEffect(() => {
    if (!row) {
      return;
    }

    const source = row.activeVersion ?? row.latestVersion;
    form.reset({
      name: `Copia de ${row.name}`.slice(0, 191),
      sourceVersionId: source?.id ?? "",
      versionNotes: source
        ? `Copia de la versión ${source.versionNumber}.`
        : "",
    });
  }, [form, row]);

  const choices = row ? getVersionChoices(row) : [];

  return (
    <FormDialog
      description="El nuevo flujo será independiente, quedará en borrador y no heredará publicación ni historial de ejecución."
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="nibol-btn-secondary justify-center"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="nibol-btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60"
            disabled={duplicateMutation.isPending}
            onClick={() => {
              void form.handleSubmit(async (values) => {
                await duplicateMutation.mutateAsync(values);
              })();
            }}
            type="button"
          >
            {duplicateMutation.isPending
              ? "Duplicando..."
              : "Duplicar como borrador"}
          </button>
        </div>
      }
      onOpenChange={(open) => {
        if (!open && !duplicateMutation.isPending) {
          onClose();
        }
      }}
      open={Boolean(row)}
      title="Duplicar flujo"
    >
      <div className="grid gap-5">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground-soft)]">
            Nombre del nuevo flujo
          </span>
          <input
            className="nibol-field h-auto py-3"
            disabled={duplicateMutation.isPending}
            {...form.register("name")}
          />
          {form.formState.errors.name ? (
            <span className="text-sm text-[var(--accent)]">
              {form.formState.errors.name.message}
            </span>
          ) : null}
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground-soft)]">
            Versión origen
          </span>
          <select
            className="nibol-field h-auto py-3"
            disabled={duplicateMutation.isPending}
            {...form.register("sourceVersionId")}
          >
            <option value="">Seleccione una versión</option>
            {choices.map((version) => (
              <option key={version.id} value={version.id}>
                v{version.versionNumber}.0 ·{" "}
                {version.status === "PUBLISHED" ? "Activa" : "Último borrador"}
              </option>
            ))}
          </select>
          {form.formState.errors.sourceVersionId ? (
            <span className="text-sm text-[var(--accent)]">
              {form.formState.errors.sourceVersionId.message}
            </span>
          ) : null}
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground-soft)]">
            Comentarios de versión
          </span>
          <textarea
            className="nibol-field h-auto min-h-28 py-3"
            disabled={duplicateMutation.isPending}
            {...form.register("versionNotes")}
          />
          {form.formState.errors.versionNotes ? (
            <span className="text-sm text-[var(--accent)]">
              {form.formState.errors.versionNotes.message}
            </span>
          ) : null}
        </label>
      </div>
    </FormDialog>
  );
}

export function WorkflowList({
  canArchive,
  canCreate,
  canEdit,
  canViewVersions,
}: WorkflowListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const initialSearch = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [processType, setProcessType] = useState(
    searchParams.get("processType") ?? "",
  );
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [createdById, setCreatedById] = useState(
    searchParams.get("createdById") ?? "",
  );
  const [page, setPage] = useState(
    Number(searchParams.get("page") ?? "1") || 1,
  );
  const [perPage, setPerPage] = useState(
    Number(searchParams.get("perPage") ?? "10") || 10,
  );
  const [duplicateRow, setDuplicateRow] =
    useState<WorkflowDefinitionListItem | null>(null);
  const [archiveRow, setArchiveRow] =
    useState<WorkflowDefinitionListItem | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const listParams = useMemo(
    () => ({
      createdById: createdById || undefined,
      page,
      perPage,
      processType: processType || undefined,
      search: search || undefined,
      sortBy: "updatedAt" as const,
      sortDirection: "desc" as const,
      status: status || undefined,
    }),
    [createdById, page, perPage, processType, search, status],
  );

  const urlQuery = useMemo(() => {
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    if (processType) next.set("processType", processType);
    if (status) next.set("status", status);
    if (createdById) next.set("createdById", createdById);
    if (page > 1) next.set("page", String(page));
    if (perPage !== 10) next.set("perPage", String(perPage));
    return next.toString();
  }, [createdById, page, perPage, processType, search, status]);

  useEffect(() => {
    const current = searchParams.toString();
    if (current !== urlQuery) {
      router.replace(`${pathname}${urlQuery ? `?${urlQuery}` : ""}`, {
        scroll: false,
      });
    }
  }, [pathname, router, searchParams, urlQuery]);

  const listQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => workflowService.listWorkflows(listParams),
    queryKey: [...QUERY_KEYS.workflows, "list", listParams],
  });
  const summaryQuery = useQuery({
    queryFn: workflowService.getWorkflowSummary,
    queryKey: QUERY_KEYS.workflowSummary,
  });
  const optionsQuery = useQuery({
    queryFn: workflowService.getWorkflowOptions,
    queryKey: QUERY_KEYS.workflowOptions,
  });

  const archiveMutation = useMutation({
    mutationFn: (workflowId: string) =>
      workflowService.archiveWorkflow(workflowId),
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      toast.success(
        "Flujo archivado. Las versiones e historial se conservaron.",
      );
      setArchiveRow(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workflows }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workflowSummary }),
      ]);
    },
  });

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setProcessType("");
    setStatus("");
    setCreatedById("");
    setPage(1);
  };

  const rows = listQuery.data?.data ?? [];
  const pagination = listQuery.data?.pagination ?? { page, perPage, total: 0 };
  const hasFilters = Boolean(search || processType || status || createdById);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryQuery.isLoading || !summaryQuery.data ? (
          Array.from({ length: 4 }, (_, index) => (
            <StatCardSkeleton key={index} />
          ))
        ) : (
          <>
            <StatCard
              description="Definiciones disponibles en el catálogo administrativo."
              icon={GitBranch}
              label="Total de flujos"
              value={String(summaryQuery.data.total)}
            />
            <StatCard
              description="Versiones listas para configurar en el diseñador."
              icon={FilePenLine}
              label="Borradores"
              tone="accent"
              value={String(summaryQuery.data.drafts)}
            />
            <StatCard
              description="Definiciones con una versión activa para ejecución futura."
              icon={CheckCircle2}
              label="Publicados"
              value={String(summaryQuery.data.published)}
            />
            <StatCard
              description="Conservados para consulta, sin iniciar nuevas instancias."
              icon={Archive}
              label="Archivados"
              value={String(summaryQuery.data.archived)}
            />
          </>
        )}
      </section>

      <section className="nibol-panel p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <label className="block min-w-0 flex-1 space-y-2">
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)] uppercase">
              Buscar flujo
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                aria-label="Buscar flujos por nombre"
                className="nibol-field h-11 pl-11"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Nombre o descripción"
                type="search"
                value={searchInput}
              />
            </div>
          </label>
          <label className="block space-y-2 xl:w-56">
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)] uppercase">
              Proceso relacionado
            </span>
            <select
              className="nibol-field h-11"
              onChange={(event) => {
                setProcessType(event.target.value);
                setPage(1);
              }}
              value={processType}
            >
              <option value="">Todos los procesos</option>
              {optionsQuery.data?.processes.map((process) => (
                <option key={process.key} value={process.key}>
                  {process.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 xl:w-44">
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)] uppercase">
              Estado
            </span>
            <select
              className="nibol-field h-11"
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              value={status}
            >
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borradores</option>
              <option value="PUBLISHED">Publicados</option>
              <option value="INACTIVE">Inactivos</option>
              <option value="ARCHIVED">Archivados</option>
            </select>
          </label>
          <label className="block space-y-2 xl:w-56">
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)] uppercase">
              Creado por
            </span>
            <select
              className="nibol-field h-11"
              onChange={(event) => {
                setCreatedById(event.target.value);
                setPage(1);
              }}
              value={createdById}
            >
              <option value="">Todos los creadores</option>
              {optionsQuery.data?.creators.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {creator.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="nibol-btn-secondary h-11 justify-center"
            disabled={!hasFilters}
            onClick={clearFilters}
            type="button"
          >
            <X className="h-4 w-4" />
            Limpiar
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4 text-sm text-[var(--foreground-soft)]">
          <span>
            <strong className="text-[var(--foreground)]">
              {pagination.total}
            </strong>{" "}
            flujos encontrados
          </span>
          <button
            className="nibol-btn-ghost px-3 py-2 text-sm"
            disabled={listQuery.isFetching}
            onClick={() => {
              void listQuery.refetch();
            }}
            type="button"
          >
            <RefreshCcw className="h-4 w-4" /> Actualizar
          </button>
        </div>
      </section>

      {listQuery.isError && rows.length === 0 ? (
        <ErrorState
          action={
            <button
              className="nibol-btn-secondary"
              onClick={() => {
                void listQuery.refetch();
              }}
              type="button"
            >
              <RefreshCcw className="h-4 w-4" /> Reintentar
            </button>
          }
          description={listQuery.error.message}
          title="No fue posible cargar los flujos"
        />
      ) : listQuery.isLoading && rows.length === 0 ? (
        <WorkflowTableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          action={
            canCreate && !hasFilters ? (
              <Link
                className="nibol-btn-primary"
                href="/configuracion/flujos/nuevo"
              >
                <Plus className="h-4 w-4" /> Crear flujo
              </Link>
            ) : undefined
          }
          description={
            hasFilters
              ? "Pruebe con otros términos o limpie los filtros para volver a ver todos los flujos."
              : "Cree el primer borrador para comenzar a configurar rutas de aprobación por proceso."
          }
          icon={GitBranch}
          title={
            hasFilters
              ? "No hay resultados"
              : "Todavía no hay flujos configurados"
          }
        />
      ) : (
        <section className="relative border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[76rem] border-separate border-spacing-0">
              <thead className="bg-[var(--secondary)] text-left text-sm text-slate-100">
                <tr>
                  {[
                    "Nombre del flujo",
                    "Proceso relacionado",
                    "Versión",
                    "Estado",
                    "Última actualización",
                    "Creado por",
                    "",
                  ].map((heading) => (
                    <th
                      className="border-b border-white/8 px-4 py-4 first:pl-5 last:pr-5"
                      key={heading}
                    >
                      <span className="text-sm font-semibold">{heading}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody
                className={listQuery.isFetching ? "opacity-70" : undefined}
              >
                {rows.map((row) => (
                  <tr
                    className="text-sm transition hover:bg-[var(--surface-soft)]"
                    key={row.id}
                  >
                    <td className="border-b border-[var(--border)] px-4 py-4 align-top first:pl-5">
                      <div className="min-w-[18rem] space-y-2">
                        <Link
                          className="font-semibold text-[var(--foreground)] hover:underline"
                          href={`/configuracion/flujos/${row.id}`}
                        >
                          {row.name}
                        </Link>
                        <p className="line-clamp-2 max-w-[34ch] leading-6 text-[var(--foreground-soft)]">
                          {row.description || "Sin descripción registrada."}
                        </p>
                      </div>
                    </td>
                    <td className="border-b border-[var(--border)] px-4 py-4 align-top text-[var(--foreground-soft)]">
                      {formatProcessType(
                        row.processType,
                        optionsQuery.data?.processes,
                      )}
                    </td>
                    <td className="border-b border-[var(--border)] px-4 py-4 align-top">
                      <span className="font-semibold">
                        {getLatestVersionLabel(
                          row.activeVersion,
                          row.latestVersion,
                        )}
                      </span>
                      <span className="mt-1 block text-xs text-[var(--muted)]">
                        {row._count.versions} versión
                        {row._count.versions === 1 ? "" : "es"}
                      </span>
                    </td>
                    <td className="border-b border-[var(--border)] px-4 py-4 align-top">
                      <span className={getStatusBadgeClass(row.status)}>
                        {formatWorkflowStatus(row.status)}
                      </span>
                    </td>
                    <td className="border-b border-[var(--border)] px-4 py-4 align-top whitespace-nowrap text-[var(--foreground-soft)]">
                      {formatDate(row.updatedAt)}
                    </td>
                    <td className="border-b border-[var(--border)] px-4 py-4 align-top">
                      <div className="flex items-center gap-2 text-[var(--foreground-soft)]">
                        <Users className="h-4 w-4 text-[var(--muted)]" />
                        <span>{formatUser(row.createdBy)}</span>
                      </div>
                    </td>
                    <td className="border-b border-[var(--border)] px-4 py-4 align-top last:pr-5">
                      <WorkflowActionMenu
                        canArchive={canArchive}
                        canCreate={canCreate}
                        canEdit={canEdit}
                        canViewVersions={canViewVersions}
                        onArchive={setArchiveRow}
                        onDuplicate={setDuplicateRow}
                        row={row}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <DataTablePagination
        isLoading={listQuery.isFetching}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPerPage(next);
          setPage(1);
        }}
        page={pagination.page}
        pageSize={pagination.perPage}
        pageSizeOptions={pageSizeOptions}
        total={pagination.total}
      />

      <WorkflowDuplicateDialog
        onClose={() => setDuplicateRow(null)}
        onSuccess={(workflowId) => {
          router.push(`/configuracion/flujos/${workflowId}`);
        }}
        row={duplicateRow}
      />
      <ConfirmDialog
        confirmLabel="Archivar flujo"
        description={
          archiveRow
            ? `¿Archivar “${archiveRow.name}”? No podrá iniciar nuevas instancias, pero las versiones publicadas, instancias existentes y el historial permanecerán disponibles.`
            : ""
        }
        isLoading={archiveMutation.isPending}
        onConfirm={() => {
          if (archiveRow) void archiveMutation.mutateAsync(archiveRow.id);
        }}
        onOpenChange={(open) => {
          if (!open && !archiveMutation.isPending) setArchiveRow(null);
        }}
        open={Boolean(archiveRow)}
        title="Archivar flujo"
      />
    </div>
  );
}

function WorkflowTableSkeleton() {
  return (
    <section className="border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
      <div className="animate-pulse space-y-3 p-5">
        <div className="h-10 bg-[var(--border)]" />
        {Array.from({ length: 5 }, (_, index) => (
          <div className="h-16 bg-[var(--surface-muted)]" key={index} />
        ))}
      </div>
    </section>
  );
}
