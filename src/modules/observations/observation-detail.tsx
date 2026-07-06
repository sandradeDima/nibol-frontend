"use client";

import { useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  Pencil,
  ShieldAlert,
  Trash2,
  UserRound,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { observationService } from "@/services/observation-service";
import { getApiErrorMessage } from "@/utils";
import { cn } from "@/utils";

import {
  formatObservationDate,
  getRiskLevelClasses,
  getStatusClasses,
} from "./presentation";
import { ObservationCollaborationWorkspace } from "../progress/observation-collaboration-workspace";
import { RemediationWorkspace } from "../remediation/remediation-workspace";

type ObservationDetailProps = {
  canDelete: boolean;
  canEdit: boolean;
  observationId: string;
};

export function ObservationDetail({
  canDelete,
  canEdit,
  observationId,
}: ObservationDetailProps) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  const observationQuery = useQuery({
    queryFn: () => observationService.getObservationById(observationId),
    queryKey: QUERY_KEYS.observationDetails(observationId),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => observationService.deleteObservation(observationId),
    onSuccess: async () => {
      setActionError(null);
      setPendingDelete(false);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observations,
      });
      window.location.assign("/observaciones");
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error));
    },
  });

  if (observationQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void observationQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={observationQuery.error.message}
        title="No fue posible cargar esta observacion"
      />
    );
  }

  const observation = observationQuery.data;

  if (!observation) {
    return (
      <section className="nibol-panel p-6 text-sm text-stone-600">
        Cargando detalle de la observacion...
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="nibol-panel p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                {observation.code}
              </p>
              <h2 className="max-w-4xl text-3xl font-semibold tracking-tight text-stone-950">
                {observation.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                  getRiskLevelClasses(observation.riskLevel.colorToken),
                )}
              >
                {observation.riskLevel.name}
              </span>
              <span
                className={cn(
                  "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                  getStatusClasses(observation.effectiveStatus.key),
                )}
              >
                {observation.effectiveStatus.name}
              </span>
              <span className="inline-flex items-center border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-700">
                Area principal: {observation.area.name}
              </span>
            </div>

            <p className="max-w-4xl text-sm leading-7 text-stone-700">
              {observation.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="nibol-btn-secondary px-4 py-2.5 text-sm" href="/observaciones">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            {canEdit ? (
              <Link
                className="nibol-btn-primary px-4 py-2.5 text-sm"
                href={`/observaciones/${observation.id}/editar`}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="nibol-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Fecha limite
          </p>
          <p className="mt-3 text-xl font-semibold text-stone-950">
            {formatObservationDate(observation.dueDate)}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            {observation.isOverdue
              ? "Requiere atencion prioritaria por vencimiento."
              : "Dentro del plazo comprometido."}
          </p>
        </article>

        <article className="nibol-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Avance actual
          </p>
          <p className="mt-3 text-xl font-semibold text-stone-950">
            {observation.progressPercent}%
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-[var(--primary)]"
              style={{
                width: `${observation.progressPercent}%`,
              }}
            />
          </div>
        </article>

        <article className="nibol-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Responsable
          </p>
          <p className="mt-3 text-xl font-semibold text-stone-950">
            {observation.responsibleUser?.name ?? "Sin asignar"}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            {observation.currentStage || "Sin etapa declarada"}
          </p>
        </article>

        <article className="nibol-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Ultima actualizacion
          </p>
          <p className="mt-3 text-xl font-semibold text-stone-950">
            {formatObservationDate(observation.updatedAt, {
              timeStyle: "short",
            })}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Deteccion inicial: {formatObservationDate(observation.detectedAt)}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <section className="nibol-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Recomendacion de auditoria
            </p>
            <p className="mt-4 text-sm leading-7 text-stone-700">
              {observation.auditRecommendation}
            </p>
          </section>

          <section className="nibol-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Contexto del hallazgo
            </p>
            <dl className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.2rem] border border-stone-200/90 bg-white/80 px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Tipo
                </dt>
                <dd className="mt-2 text-sm font-medium text-stone-900">
                  {observation.observationType || "No registrado"}
                </dd>
              </div>
              <div className="rounded-[1.2rem] border border-stone-200/90 bg-white/80 px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Fuente
                </dt>
                <dd className="mt-2 text-sm font-medium text-stone-900">
                  {observation.source || "No registrada"}
                </dd>
              </div>
              <div className="rounded-[1.2rem] border border-stone-200/90 bg-white/80 px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Proceso
                </dt>
                <dd className="mt-2 text-sm font-medium text-stone-900">
                  {observation.process || "No registrado"}
                </dd>
              </div>
              <div className="rounded-[1.2rem] border border-stone-200/90 bg-white/80 px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Categoria
                </dt>
                <dd className="mt-2 text-sm font-medium text-stone-900">
                  {observation.category || "No registrada"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="nibol-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Areas involucradas
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.2rem] border border-stone-200/90 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Area principal
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-950">
                  {observation.area.name}
                </p>
              </div>

              {observation.additionalAreas.length > 0 ? (
                observation.additionalAreas.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-[1.2rem] border border-stone-200/90 bg-white/80 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-stone-950">
                          {assignment.area.name}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {assignment.roleInFinding || "Area relacionada"}
                        </p>
                      </div>
                      <p className="text-xs font-medium text-stone-600">
                        {assignment.responsibleUser?.name || "Sin responsable complementario"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-[var(--surface-soft)] px-4 py-4 text-sm text-stone-600">
                  No se registraron areas secundarias para este hallazgo.
                </div>
              )}
            </div>
          </section>
        </section>

        <section className="space-y-6">
          <section className="nibol-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Responsables y control
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.2rem] border border-stone-200/90 bg-white/80 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-[0.9rem] bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Auditor
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950">
                      {observation.auditorUser.name}
                    </p>
                    <p className="text-sm text-stone-600">{observation.auditorUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-stone-200/90 bg-white/80 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-[0.9rem] bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Responsable
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950">
                      {observation.responsibleUser?.name ?? "Sin asignacion directa"}
                    </p>
                    <p className="text-sm text-stone-600">
                      {observation.responsibleUser?.email ??
                        "La ejecucion puede asignarse mas adelante."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-stone-200/90 bg-white/80 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-[0.9rem] bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Cronograma
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950">
                      Deteccion: {formatObservationDate(observation.detectedAt)}
                    </p>
                    <p className="text-sm text-stone-600">
                      Limite: {formatObservationDate(observation.dueDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {canDelete ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="nibol-btn-primary px-4 py-2.5 text-sm"
                  onClick={() => {
                    setPendingDelete(true);
                  }}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar observacion
                </button>
              </div>
            ) : null}

            {actionError ? (
              <div className="mt-4 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {actionError}
              </div>
            ) : null}
          </section>

          <section className="nibol-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Plan de remediacion
            </p>
            <div className="mt-5 rounded-[1.2rem] border border-dashed border-stone-300 bg-[var(--surface-soft)] px-4 py-4 text-sm leading-7 text-stone-600">
              El detalle operativo del plan se administra mas abajo, con estrategia del area, cronograma y flujo de auditoria integrados sobre la misma observacion.
            </div>
          </section>

        </section>
      </section>

      <ObservationCollaborationWorkspace observationId={observationId} />

      <RemediationWorkspace observationId={observationId} />

      <ConfirmDialog
        confirmLabel="Eliminar observacion"
        description={`Eliminar ${observation.code} mediante borrado logico?`}
        isLoading={deleteMutation.isPending}
        open={pendingDelete}
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
        }}
        onOpenChange={setPendingDelete}
        title="Eliminar observacion?"
        tone="danger"
      />
    </div>
  );
}
