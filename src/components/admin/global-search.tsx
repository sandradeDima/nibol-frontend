"use client";

import {
  useDeferredValue,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, FileText, LayoutGrid, Search, X } from "lucide-react";

import type { ObservationTableRow, SidebarItem } from "@/types";
import { observationCatalogService } from "@/services/observation-catalog-service";
import { observationService } from "@/services/observation-service";
import { buildObservationUrl } from "@/lib/observation-links";
import { cn } from "@/utils";

type GlobalSearchProps = {
  canSearchAuditReports: boolean;
  canViewObservations: boolean;
  canViewReports: boolean;
  navigationItems: SidebarItem[];
  className?: string;
};

type SearchReport = {
  id: string;
  reportNumber: string;
  title: string;
};

const searchResources = async (
  term: string,
  {
    canSearchAuditReports,
    canViewObservations,
  }: Pick<GlobalSearchProps, "canSearchAuditReports" | "canViewObservations">,
) => {
  const params = new URLSearchParams({
    page: "1",
    perPage: "6",
    search: term,
    sortBy: "updatedAt",
    sortDirection: "desc",
  });
  const [observationResult, reportResult] = await Promise.all([
    canViewObservations
      ? observationService.listObservations(`?${params.toString()}`)
      : Promise.resolve({ data: [] as ObservationTableRow[] }),
    canSearchAuditReports
      ? observationCatalogService.listReports(term)
      : Promise.resolve([]),
  ]);
  const reports = new Map<string, SearchReport>();

  reportResult.slice(0, 6).forEach((report) => {
    reports.set(report.id, {
      id: report.id,
      reportNumber: report.reportNumber,
      title: report.title,
    });
  });
  observationResult.data.forEach((observation) => {
    if (!reports.has(observation.auditReport.id)) {
      reports.set(observation.auditReport.id, {
        id: observation.auditReport.id,
        reportNumber: observation.auditReport.reportNumber,
        title: observation.auditReport.title,
      });
    }
  });

  return {
    observations: observationResult.data,
    reports: [...reports.values()].slice(0, 6),
  };
};

export function GlobalSearch({
  canSearchAuditReports,
  canViewObservations,
  canViewReports,
  className,
  navigationItems,
}: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const resultsId = useId();
  const deferredSearch = useDeferredValue(search.trim());
  const moduleResults = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    if (!normalized) return [];

    return navigationItems
      .filter((item) =>
        `${item.label} ${item.group ?? ""}`
          .toLocaleLowerCase()
          .includes(normalized),
      )
      .slice(0, 5);
  }, [navigationItems, search]);
  const resourceQuery = useQuery({
    enabled: deferredSearch.length >= 2,
    queryFn: () =>
      searchResources(deferredSearch, {
        canSearchAuditReports,
        canViewObservations,
      }),
    queryKey: [
      "global-search",
      deferredSearch,
      canSearchAuditReports,
      canViewObservations,
    ],
    staleTime: 30_000,
  });
  const results = resourceQuery.data;
  const hasSearch = search.trim().length > 0;
  const showResults = open && hasSearch;

  const reportHref = (report: SearchReport): string =>
    canViewReports
      ? `/reportes?filter.auditReportId=${encodeURIComponent(report.id)}`
      : `/administracion/informes-auditoria?search=${encodeURIComponent(report.reportNumber)}`;

  return (
    <div
      className={cn("relative min-w-0", className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
      onFocus={() => setOpen(true)}
      role="search"
    >
      <div className="group flex h-11 min-w-0 overflow-hidden border border-[var(--border)] bg-[var(--surface-soft)] transition focus-within:border-[color-mix(in_srgb,var(--primary)_32%,white)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_10%,white)]">
        <span className="flex w-10 shrink-0 items-center justify-center text-[var(--muted)] transition group-focus-within:text-[var(--primary)]">
          <Search aria-hidden="true" className="h-4 w-4" />
        </span>
        <input
          aria-controls={resultsId}
          aria-expanded={showResults}
          aria-label="Buscar en NIBOL"
          aria-autocomplete="list"
          className="h-full min-w-0 flex-1 border-0 bg-transparent px-1 text-sm leading-5 outline-none placeholder:text-[var(--muted)]"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar módulos, informes u observaciones"
          role="combobox"
          type="search"
          value={search}
        />
        {search ? (
          <button
            aria-label="Limpiar búsqueda"
            className="mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center self-center text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            onClick={() => setSearch("")}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showResults ? (
        <div
          className="absolute top-[calc(100%+0.5rem)] right-0 z-50 max-h-[min(32rem,calc(100vh-8rem))] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-panel-strong)]"
          id={resultsId}
        >
          {moduleResults.length ? (
            <SearchGroup
              icon={<LayoutGrid className="h-3.5 w-3.5" />}
              title="Módulos disponibles"
            >
              {moduleResults.map((item) => (
                <SearchResult
                  href={item.route}
                  key={item.route}
                  label={item.label}
                  meta={item.group ?? "Módulo"}
                  onSelect={() => setOpen(false)}
                />
              ))}
            </SearchGroup>
          ) : null}

          {deferredSearch.length < 2 && !moduleResults.length ? (
            <p className="px-3 py-4 text-sm text-[var(--muted)]">
              Escriba al menos 2 caracteres para buscar registros.
            </p>
          ) : deferredSearch.length >= 2 && resourceQuery.isPending ? (
            <p className="px-3 py-4 text-sm text-[var(--muted)]">
              Buscando en informes y observaciones…
            </p>
          ) : deferredSearch.length >= 2 && resourceQuery.isError ? (
            <p className="px-3 py-4 text-sm text-[var(--muted)]">
              No fue posible completar la búsqueda.
            </p>
          ) : moduleResults.length ||
            results?.reports.length ||
            results?.observations.length ? (
            results ? (
              <>
                {results.reports.length ? (
                  <SearchGroup
                    icon={<FileText className="h-3.5 w-3.5" />}
                    title="Informes"
                  >
                    {results.reports.map((report) => (
                      <SearchResult
                        href={reportHref(report)}
                        key={report.id}
                        label={report.reportNumber}
                        meta={report.title}
                        onSelect={() => setOpen(false)}
                      />
                    ))}
                  </SearchGroup>
                ) : null}
                {results.observations.length ? (
                  <SearchGroup
                    icon={<FileText className="h-3.5 w-3.5" />}
                    title="Observaciones"
                  >
                    {results.observations.map((observation) => (
                      <SearchResult
                        href={buildObservationUrl({
                          observationId: observation.id,
                        })}
                        key={observation.id}
                        label={observation.displayCode}
                        meta={observation.title}
                        onSelect={() => setOpen(false)}
                      />
                    ))}
                  </SearchGroup>
                ) : null}
              </>
            ) : null
          ) : (
            <p className="px-3 py-4 text-sm text-[var(--muted)]">
              No se encontraron módulos, informes u observaciones.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SearchGroup({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="not-first:border-t not-first:border-[var(--border)] not-first:pt-2">
      <p className="flex items-center gap-2 px-3 py-2 text-[0.68rem] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
        {icon}
        {title}
      </p>
      <div className="grid gap-0.5">{children}</div>
    </section>
  );
}

function SearchResult({
  href,
  label,
  meta,
  onSelect,
}: {
  href: string;
  label: string;
  meta: string;
  onSelect: () => void;
}) {
  return (
    <Link
      className="group flex items-center justify-between gap-3 px-3 py-2.5 transition hover:bg-[var(--primary-soft)]"
      href={href}
      onClick={onSelect}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[var(--foreground)]">
          {label}
        </span>
        <span className="block truncate text-xs text-[var(--muted)]">
          {meta}
        </span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--muted)] transition group-hover:text-[var(--primary)]" />
    </Link>
  );
}
