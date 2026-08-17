"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QUERY_KEYS } from "@/lib/constants";
import { observationService } from "@/services/observation-service";
import type { ObservationTableRow } from "@/types";
import { cn, getApiErrorMessage } from "@/utils";

import {
  formatObservationDate,
  getRiskLevelClasses,
  getStatusClasses,
} from "./presentation";

export function ObservationTable({
  canDelete,
  canEdit,
}: {
  canDelete: boolean;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] =
    useState<ObservationTableRow | null>(null);
  const params = new URLSearchParams({
    page: String(page),
    perPage: "20",
    search,
    sortBy: "updatedAt",
    sortDirection: "desc",
  });
  const query = useQuery({
    queryFn: () => observationService.listObservations(`?${params}`),
    queryKey: [...QUERY_KEYS.observations, search, page],
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
  const pagination = query.data?.pagination;

  return (
    <section className="nibol-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-4">
        <label className="relative min-w-72 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute top-3.5 left-3 h-4 w-4 text-stone-400" />
          <input
            className="nibol-field pl-10"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por informe, título, área o responsable"
            value={search}
          />
        </label>
        <p className="text-sm text-stone-500">
          {pagination?.total ?? 0} observaciones
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-stone-50 text-xs font-semibold tracking-wider text-stone-500 uppercase">
            <tr>
              <th className="px-5 py-4">Informe / Obs.</th>
              <th className="px-5 py-4">Título</th>
              <th className="px-5 py-4">Nivel y riesgos</th>
              <th className="px-5 py-4">Áreas / responsables</th>
              <th className="px-5 py-4">Progreso</th>
              <th className="px-5 py-4">Fecha límite</th>
              <th className="px-5 py-4">Estado</th>
              <th className="px-5 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {query.data?.data.map((row) => (
              <tr className="group hover:bg-amber-50/30" key={row.id}>
                <td className="px-5 py-4">
                  <Link
                    className="font-semibold text-amber-800 hover:underline"
                    href={`/observaciones/${row.id}`}
                  >
                    {row.displayCode}
                  </Link>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatObservationDate(row.auditReport.reportDate)}
                  </p>
                </td>
                <td className="max-w-xs px-5 py-4">
                  <p className="font-semibold text-stone-950">{row.title}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {row.mainObservation.name}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "inline-flex border px-2 py-1 text-xs font-semibold",
                      getRiskLevelClasses(row.riskLevel.colorToken),
                    )}
                  >
                    {row.riskLevel.name}
                  </span>
                  <p
                    className="mt-2 max-w-40 truncate text-xs text-stone-600"
                    title={row.risks.map((risk) => risk.name).join(", ")}
                  >
                    {row.risks[0]?.name}
                    {row.risks.length > 1 ? ` +${row.risks.length - 1}` : ""}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium">
                    {row.areas[0]?.area.name ?? "—"}
                    {row.areas.length > 1 ? ` +${row.areas.length - 1}` : ""}
                  </p>
                  <p
                    className="mt-1 max-w-44 truncate text-xs text-stone-500"
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
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full bg-amber-600"
                        style={{ width: `${row.progressPercent}%` }}
                      />
                    </div>
                    <span className="font-semibold">
                      {row.progressPercent}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {row.actionPlanCount} planes
                  </p>
                </td>
                <td className="px-5 py-4">
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
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "inline-flex border px-2 py-1 text-xs font-semibold",
                      getStatusClasses(row.status.key),
                    )}
                  >
                    {row.status.name}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    {canEdit ? (
                      <Link
                        aria-label="Editar"
                        className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                        href={`/observaciones/${row.id}/editar`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    ) : null}
                    {canDelete ? (
                      <button
                        aria-label="Eliminar"
                        className="rounded-lg p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => setPendingDelete(row)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          pendingDelete ? `Se archivará ${pendingDelete.displayCode}.` : ""
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
