"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye, ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { extensionRequestService } from "@/services/extension-request-service";
import { cn } from "@/utils";

import { getRiskLevelClasses } from "../observations/presentation";
import {
  formatExtensionRequestDate,
  getExtensionRequestStatusClasses,
  getExtensionRequestStatusLabel,
} from "./presentation";

export function PendingExtensionRequestApprovals() {
  const pendingQuery = useQuery({
    queryFn: async () => {
      return extensionRequestService.list(
        "?filter.pendingMine=true&perPage=100&sortBy=updatedAt&sortDirection=desc",
      );
    },
    queryKey: [...QUERY_KEYS.extensionRequests, "pending-approvals"],
  });

  if (pendingQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void pendingQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={pendingQuery.error.message}
        title="No fue posible cargar ampliaciones pendientes"
      />
    );
  }

  if (!pendingQuery.data) {
    return (
      <section className="nibol-panel px-6 py-8 text-sm text-stone-600">
        Cargando ampliaciones pendientes...
      </section>
    );
  }

  const rows = pendingQuery.data.data;

  if (rows.length === 0) {
    return (
      <EmptyState
        description="Cuando una ampliación requiera su revisión como Gerencia o Auditoría, aparecerá aquí lista para dictamen."
        icon={ShieldAlert}
        title="No hay ampliaciones pendientes"
      />
    );
  }

  return (
    <section className="nibol-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-[var(--surface-soft)] text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            <tr>
              <th className="px-4 py-3">Observación</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Solicitante</th>
              <th className="px-4 py-3">Nueva fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-stone-200 align-top">
                <td className="px-4 py-4">
                  <div className="min-w-[16rem] space-y-2">
                    <p className="font-semibold text-stone-950">{row.observation.title}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        {row.observation.code}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                          getRiskLevelClasses(row.observation.riskLevel.colorToken),
                        )}
                      >
                        {row.observation.riskLevel.name}
                      </span>
                    </div>
                    {row.commitment ? (
                      <p className="text-xs text-stone-500">
                        Compromiso: {row.commitment.title}
                      </p>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-stone-700">{row.area.name}</td>
                <td className="px-4 py-4 text-sm text-stone-700">
                  {row.requestedByUser.name}
                </td>
                <td className="px-4 py-4 text-sm text-stone-700">
                  {formatExtensionRequestDate(row.requestedDueDate)}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                      getExtensionRequestStatusClasses(row.status),
                    )}
                  >
                    {getExtensionRequestStatusLabel(row.status)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <Link
                    className="nibol-btn-primary px-3 py-2 text-sm"
                    href={`/ampliaciones-plazo/${row.id}`}
                  >
                    <Eye className="h-4 w-4" />
                    Ver y revisar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
