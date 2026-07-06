"use client";

import { useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Eye, RotateCcw, ShieldAlert, XCircle } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { progressService } from "@/services/progress-service";
import type { ProgressUpdateTableRow } from "@/types";
import { cn, getApiErrorMessage } from "@/utils";

import { getRiskLevelClasses } from "../observations/presentation";
import {
  formatProgressDate,
  getProgressStatusClasses,
  getProgressStatusLabel,
  getProgressTypeClasses,
  getProgressTypeLabel,
} from "./presentation";

export function PendingProgressApprovals() {
  const queryClient = useQueryClient();
  const [reviewState, setReviewState] = useState<{
    action: "approve" | "reject" | "return";
    comment: string;
    row: ProgressUpdateTableRow;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingApprovalsQuery = useQuery({
    queryFn: async () => {
      return progressService.listProgressUpdates("?filter.status=SENT_TO_AUDIT&perPage=100");
    },
    queryKey: [...QUERY_KEYS.progressUpdates, "pending-approvals"],
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!reviewState) {
        throw new Error("Seleccione un avance para revisar.");
      }

      if (reviewState.action === "approve") {
        await progressService.approveProgressUpdate(reviewState.row.id, {
          comment: reviewState.comment.trim() || null,
        });
        return;
      }

      if (reviewState.action === "return") {
        await progressService.returnProgressUpdate(reviewState.row.id, {
          comment: reviewState.comment.trim(),
        });
        return;
      }

      await progressService.rejectProgressUpdate(reviewState.row.id, {
        comment: reviewState.comment.trim(),
      });
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setActionError(null);
      setReviewState(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEYS.progressUpdates, "pending-approvals"],
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.progressUpdates,
        }),
      ]);
    },
  });

  if (pendingApprovalsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void pendingApprovalsQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={pendingApprovalsQuery.error.message}
        title="No fue posible cargar aprobaciones pendientes"
      />
    );
  }

  if (!pendingApprovalsQuery.data) {
    return (
      <section className="nibol-panel px-6 py-8 text-sm text-stone-600">
        Cargando aprobaciones pendientes...
      </section>
    );
  }

  const rows = pendingApprovalsQuery.data.data;

  if (rows.length === 0) {
    return (
      <EmptyState
        description="Cuando las areas envien avances a Auditoria, apareceran aqui listos para aprobacion, devolucion o rechazo."
        icon={ShieldAlert}
        title="No hay avances pendientes"
      />
    );
  }

  return (
    <section className="space-y-5">
      {actionError ? (
        <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      <section className="nibol-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-[var(--surface-soft)] text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              <tr>
                <th className="px-4 py-3">Observacion</th>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Avance</th>
                <th className="px-4 py-3">Fecha envio</th>
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
                            getRiskLevelClasses(row.riskLevel.colorToken),
                          )}
                        >
                          {row.riskLevel.name}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-stone-700">{row.area.name}</td>
                  <td className="px-4 py-4 text-sm text-stone-700">
                    {row.responsibleUser?.name ?? "Sin responsable"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                        getProgressTypeClasses(row.type),
                      )}
                    >
                      {getProgressTypeLabel(row.type)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                        getProgressStatusClasses(row.status),
                      )}
                    >
                      {getProgressStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="min-w-[9rem] space-y-2">
                      <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                        <div
                          className="h-full bg-[var(--primary)]"
                          style={{
                            width: `${row.progressPercent ?? 0}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-stone-700">
                        {row.progressPercent ?? 0}% · {row.evidenceCount} archivos
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-stone-700">
                    {formatProgressDate(row.sentToAuditAt ?? row.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-[14rem] flex-col gap-2">
                      <Link
                        className="nibol-btn-secondary justify-center px-3 py-2 text-sm"
                        href={`/observaciones/${row.observation.id}`}
                      >
                        <Eye className="h-4 w-4" />
                        Ver detalle
                      </Link>
                      <button
                        className="nibol-btn-primary justify-center px-3 py-2 text-sm"
                        onClick={() => {
                          setReviewState({
                            action: "approve",
                            comment: "",
                            row,
                          });
                        }}
                        type="button"
                      >
                        <CheckCheck className="h-4 w-4" />
                        Aprobar
                      </button>
                      <button
                        className="nibol-btn-secondary justify-center px-3 py-2 text-sm"
                        onClick={() => {
                          setReviewState({
                            action: "return",
                            comment: "",
                            row,
                          });
                        }}
                        type="button"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Devolver
                      </button>
                      <button
                        className="nibol-btn-secondary justify-center px-3 py-2 text-sm text-rose-700"
                        onClick={() => {
                          setReviewState({
                            action: "reject",
                            comment: "",
                            row,
                          });
                        }}
                        type="button"
                      >
                        <XCircle className="h-4 w-4" />
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {reviewState ? (
        <section className="nibol-panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Revision de Auditoria
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
                {reviewState.action === "approve"
                  ? "Aprobar avance"
                  : reviewState.action === "return"
                    ? "Devolver avance"
                    : "Rechazar avance"}
              </h3>
              <p className="max-w-3xl text-sm leading-7 text-stone-700">
                {reviewState.row.observation.code} · {reviewState.row.observation.title}
              </p>
            </div>
          </div>

          <textarea
            className="nibol-field mt-5 min-h-32 resize-y py-3"
            disabled={reviewMutation.isPending}
            onChange={(event) => {
              setReviewState((current) =>
                current
                  ? {
                      ...current,
                      comment: event.target.value,
                    }
                  : current,
              );
            }}
            placeholder="Registre el criterio de Auditoria para dejar trazabilidad del dictamen."
            value={reviewState.comment}
          />

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="nibol-btn-primary px-4 py-2.5 text-sm"
              disabled={reviewMutation.isPending}
              onClick={() => {
                void reviewMutation.mutateAsync();
              }}
              type="button"
            >
              <CheckCheck className="h-4 w-4" />
              Confirmar decision
            </button>
            <button
              className="nibol-btn-ghost px-4 py-2.5 text-sm"
              onClick={() => {
                setReviewState(null);
              }}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );
}
