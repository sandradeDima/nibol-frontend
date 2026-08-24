"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileText,
  History,
  Pencil,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { observationService } from "@/services/observation-service";
import { cn, getApiErrorMessage } from "@/utils";

import { EntityActivityTimeline } from "../activity/entity-activity-timeline";
import { ObservationExtensionPanel } from "../extension-requests/observation-extension-panel";
import { ObservationCollaborationWorkspace } from "../progress/observation-collaboration-workspace";
import { RemediationWorkspace } from "../remediation/remediation-workspace";
import { ObservationActionPanel } from "./observation-action-panel";
import {
  formatObservationDate,
  getRiskLevelClasses,
  getRiskLevelStyle,
  getStatusClasses,
} from "./presentation";

type Props = {
  canAccessExtensions: boolean;
  canClose: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canEditActionPlans: boolean;
  canViewTechnical: boolean;
  observationId: string;
};

const remainingLabel = (dateValue: string) => {
  const days = Math.ceil(
    (new Date(dateValue).getTime() - Date.now()) / 86_400_000,
  );
  if (days < 0) return `${Math.abs(days)} días vencida`;
  if (days === 0) return "Vence hoy";
  return `${days} días restantes`;
};

export function ObservationDetail({
  canAccessExtensions,
  canClose,
  canDelete,
  canEdit,
  canEditActionPlans,
  canViewTechnical,
  observationId,
}: Props) {
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
    queryFn: () => observationService.getObservationById(observationId),
    queryKey: QUERY_KEYS.observationDetails(observationId),
  });
  const remove = useMutation({
    mutationFn: () => observationService.deleteObservation(observationId),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observations,
      });
      window.location.assign("/observaciones");
    },
  });
  const close = useMutation({
    mutationFn: () => observationService.closeObservation(observationId),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setConfirmClose(false);
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.observationDetails(observationId),
        }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.observations }),
      ]);
    },
  });
  if (query.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(query.error)}
        title="No fue posible cargar la observación"
      />
    );
  const observation = query.data;
  if (!observation)
    return (
      <section className="nibol-panel p-6 text-sm text-stone-500">
        Cargando detalle…
      </section>
    );

  return (
    <div className="space-y-6">
      <section className="nibol-panel overflow-hidden">
        <div className="border-b border-stone-200 bg-stone-950 px-6 py-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-amber-400 uppercase">
                {observation.displayCode}
              </p>
              <h2 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight">
                {observation.title}
              </h2>
              <p className="mt-2 text-sm text-stone-300">
                {observation.auditReport.title}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="nibol-btn-secondary bg-white px-4 py-2.5 text-sm"
                href="/observaciones"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
              {canClose && !observation.status.isFinal ? (
                <button
                  className="nibol-btn-secondary bg-white px-4 py-2.5 text-sm"
                  id="cierre-observacion"
                  onClick={() => setConfirmClose(true)}
                  type="button"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Concluir
                </button>
              ) : null}
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
        </div>
        <div className="grid gap-px bg-stone-200 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ["Nivel", observation.riskLevel.name, "risk"],
            ["Estado", observation.status.name, "status"],
            ["Progreso", `${observation.progressPercent}%`, ""],
            [
              "Fecha original",
              formatObservationDate(observation.originalDueDate),
              "",
            ],
            [
              "Fecha actual",
              formatObservationDate(observation.currentDueDate),
              "",
            ],
            ["Plazo", remainingLabel(observation.currentDueDate), ""],
          ].map(([label, value, kind]) => (
            <div className="bg-white p-5" key={label}>
              <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                {label}
              </p>
              <p
                className={cn(
                  "mt-2 text-base font-semibold text-stone-950",
                  kind === "risk" &&
                    `inline-flex border px-2.5 py-1 ${getRiskLevelClasses()}`,
                  kind === "status" && getStatusClasses(observation.status.key),
                )}
                style={
                  kind === "risk"
                    ? getRiskLevelStyle(observation.riskLevel.colorToken)
                    : undefined
                }
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <ObservationActionPanel observationId={observationId} />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="nibol-panel p-6">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-amber-700" />
            <h3 className="text-xl font-semibold">Observación</h3>
          </div>
          <p className="mt-5 text-sm leading-7 whitespace-pre-wrap text-stone-700">
            {observation.description}
          </p>
          <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-5">
            <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
              Recomendación de Auditoría
            </p>
            <p className="mt-2 text-sm leading-7 whitespace-pre-wrap text-stone-700">
              {observation.auditRecommendation}
            </p>
          </div>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-stone-500">Observación principal</dt>
              <dd className="mt-1 font-semibold">
                {observation.mainObservation.name}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Proceso</dt>
              <dd className="mt-1 font-semibold">
                {observation.process ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Auditor</dt>
              <dd className="mt-1 font-semibold">
                {observation.auditorUser.name}
              </dd>
            </div>
          </dl>
        </section>
        <div className="space-y-6">
          <section className="nibol-panel p-6">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-5 w-5 text-amber-700" />
              <h3 className="text-xl font-semibold">Informe</h3>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-stone-500">Número</dt>
                <dd className="mt-1 font-semibold">
                  {observation.auditReport.reportNumber}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">Título</dt>
                <dd className="mt-1 font-semibold">
                  {observation.auditReport.title}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">Fecha</dt>
                <dd className="mt-1 font-semibold">
                  {formatObservationDate(observation.auditReport.reportDate)}
                </dd>
              </div>
            </dl>
          </section>
          <section className="nibol-panel p-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-700" />
              <h3 className="text-xl font-semibold">Riesgos asociados</h3>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {observation.risks.map((risk) => (
                <span
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900"
                  key={risk.id}
                >
                  {risk.name}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="nibol-panel p-6">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-amber-700" />
          <div>
            <h3 className="text-xl font-semibold">Áreas involucradas</h3>
            <p className="text-sm text-stone-500">
              Matriz de responsabilidad y avance agregado por área.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {observation.areas.map((assignment) => (
            <article
              className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
              key={assignment.id}
            >
              <div className="flex items-start justify-between gap-4">
                <h4 className="font-semibold text-stone-950">
                  {assignment.area.name}
                </h4>
                <span className="nibol-badge">
                  {assignment.progressPercent}% avance
                </span>
              </div>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-stone-500">Dueño del proceso</dt>
                  <dd className="mt-1 font-semibold">
                    {assignment.processOwner.name}
                  </dd>
                  <dd className="text-xs text-stone-500">
                    {assignment.processOwner.jobTitle ??
                      assignment.processOwner.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">Responsable del área</dt>
                  <dd className="mt-1 font-semibold">
                    {assignment.areaResponsible.name}
                  </dd>
                  <dd className="text-xs text-stone-500">
                    {assignment.areaResponsible.jobTitle ??
                      assignment.areaResponsible.email}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <div id="planes-accion">
        <RemediationWorkspace
          canEditActionPlans={canEditActionPlans}
          observationId={observationId}
        />
      </div>
      <div id="colaboracion">
        <ObservationCollaborationWorkspace observationId={observationId} />
      </div>
      {canAccessExtensions ? (
        <div id="ampliaciones">
          <ObservationExtensionPanel observationId={observationId} />
        </div>
      ) : null}

      <section className="nibol-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-amber-700 uppercase">
              Trazabilidad
            </p>
            <h3 className="mt-2 text-xl font-semibold">
              Actividad y aprobaciones
            </h3>
          </div>
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => setShowHistory((value) => !value)}
            type="button"
          >
            <History className="h-4 w-4" />
            {showHistory ? "Ocultar actividad" : "Ver actividad"}
          </button>
        </div>
        {showHistory ? (
          <div className="mt-6">
            <EntityActivityTimeline
              canViewTechnical={canViewTechnical}
              observationId={observationId}
            />
          </div>
        ) : null}
      </section>

      {canDelete ? (
        <div className="flex justify-end">
          <button
            className="nibol-btn-secondary px-4 py-2.5 text-sm text-rose-700"
            onClick={() => setConfirmDelete(true)}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar observación
          </button>
        </div>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        confirmLabel="Eliminar observación"
        description={`Se archivará ${observation.displayCode}.`}
        isLoading={remove.isPending}
        onConfirm={async () => remove.mutateAsync()}
        onOpenChange={setConfirmDelete}
        open={confirmDelete}
        title="¿Eliminar observación?"
        tone="danger"
      />
      <ConfirmDialog
        confirmLabel="Concluir observación"
        description="El sistema validará que todos los planes estén concluidos y que no existan evaluaciones pendientes."
        isLoading={close.isPending}
        onConfirm={async () => close.mutateAsync()}
        onOpenChange={setConfirmClose}
        open={confirmClose}
        title="¿Aprobar el cierre?"
      />
    </div>
  );
}
