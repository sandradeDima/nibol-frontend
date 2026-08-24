"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Pencil,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { QUERY_KEYS } from "@/lib/constants";
import { observationService } from "@/services/observation-service";
import { progressService } from "@/services/progress-service";
import { remediationService } from "@/services/remediation-service";
import { getApiErrorMessage } from "@/utils";

import {
  ActionPlanEditor,
  type ActionPlanEditorValues,
} from "./action-plan-editor";
import { formatRemediationDate } from "./presentation";

export function ActionPlanDetailView({
  canEdit,
  actionPlanId,
  initialEditing = false,
}: {
  canEdit: boolean;
  actionPlanId: string;
  initialEditing?: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(canEdit && initialEditing);
  const [error, setError] = useState<string | null>(null);
  const planQuery = useQuery({
    queryFn: () => remediationService.getActionPlan(actionPlanId),
    queryKey: ["action-plan", actionPlanId],
  });
  const evaluationsQuery = useQuery({
    queryFn: () =>
      progressService.listProgressEvaluations(
        `?filter.actionPlanId=${encodeURIComponent(actionPlanId)}&perPage=100`,
      ),
    queryKey: ["progress-evaluations", "action-plan", actionPlanId],
  });
  const plan = planQuery.data;
  const observationQuery = useQuery({
    enabled: Boolean(plan && editing),
    queryFn: () => observationService.getObservationById(plan!.observation.id),
    queryKey: plan
      ? QUERY_KEYS.observationDetails(plan.observation.id)
      : ["action-plan", actionPlanId, "observation"],
  });
  const optionsQuery = useQuery({
    enabled: Boolean(plan && editing),
    queryFn: observationService.getObservationOptions,
    queryKey: QUERY_KEYS.observationOptions,
  });
  const update = useMutation({
    mutationFn: (input: ActionPlanEditorValues) =>
      remediationService.updateActionPlan(actionPlanId, input),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setEditing(false);
      setError(null);
      await Promise.all([
        planQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["action-plans"] }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.observationDetails(plan!.observation.id),
        }),
      ]);
    },
  });
  if (!plan)
    return (
      <section className="nibol-panel p-6 text-sm text-stone-500">
        Cargando plan de acción…
      </section>
    );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          className="nibol-btn-secondary px-4 py-2.5 text-sm"
          href={`/observaciones/${plan.observation.id}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la observación
        </Link>
        <div className="flex items-center gap-2">
          {canEdit ? (
            <button
              className="nibol-btn-secondary px-3 py-2 text-sm"
              onClick={() => {
                setError(null);
                setEditing((value) => !value);
              }}
              type="button"
            >
              <Pencil className="h-4 w-4" />
              {editing ? "Cerrar edición" : "Editar plan"}
            </button>
          ) : null}
          <span className="nibol-badge">{plan.statusLabel}</span>
        </div>
      </div>
      <section className="nibol-panel overflow-hidden">
        <div className="bg-stone-950 p-6 text-white">
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-400 uppercase">
            {plan.observation.displayCode} · {plan.area.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Plan de acción</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-300">
            {plan.description}
          </p>
        </div>
        <div className="grid gap-px bg-stone-200 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Ejecutor", plan.responsibleUser.name],
            ["Progreso", `${plan.progressPercent}%`],
            ["Estado", plan.statusLabel],
            ["Fecha original", formatRemediationDate(plan.originalDueDate)],
            ["Fecha actual", formatRemediationDate(plan.currentDueDate)],
          ].map(([label, value]) => (
            <div className="bg-white p-5" key={label}>
              <p className="text-xs tracking-wider text-stone-500 uppercase">
                {label}
              </p>
              <p className="mt-2 font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>
      {editing ? (
        observationQuery.data && optionsQuery.data ? (
          <ActionPlanEditor
            areas={observationQuery.data.areas}
            error={error}
            initial={{
              description: plan.description,
              dueDate: plan.currentDueDate,
              observationAreaId: plan.observationAreaId,
              responsibleUserId: plan.responsibleUser.id,
            }}
            isSaving={update.isPending}
            key={`${plan.id}-${plan.updatedAt}`}
            onCancel={() => {
              setEditing(false);
              setError(null);
            }}
            onSubmit={(input) => update.mutate(input)}
            users={optionsQuery.data.users}
          />
        ) : (
          <section className="nibol-panel p-5 text-sm text-stone-500">
            Cargando opciones de edición…
          </section>
        )
      ) : error ? (
        <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="nibol-panel p-5">
          <UserRound className="h-5 w-5 text-amber-700" />
          <h2 className="mt-3 font-semibold">Responsabilidad del área</h2>
          <p className="mt-3 text-sm text-stone-500">Dueño del proceso</p>
          <p className="font-semibold">{plan.processOwner.name}</p>
          <p className="text-xs text-stone-500">
            {plan.processOwner.jobTitle ?? plan.processOwner.email}
          </p>
          <p className="mt-3 text-sm text-stone-500">Responsable del área</p>
          <p className="font-semibold">{plan.areaResponsible.name}</p>
        </section>
        <section className="nibol-panel p-5">
          <CalendarDays className="h-5 w-5 text-amber-700" />
          <h2 className="mt-3 font-semibold">Plazo</h2>
          <p className="mt-3 text-sm text-stone-500">
            {plan.isOverdue
              ? "El plan está vencido y requiere atención."
              : "El plan se encuentra dentro del plazo actual."}
          </p>
        </section>
        <section className="nibol-panel p-5">
          <FileText className="h-5 w-5 text-amber-700" />
          <h2 className="mt-3 font-semibold">Evidencia</h2>
          <p className="mt-3 text-2xl font-semibold">{plan.evidenceCount}</p>
          <p className="text-sm text-stone-500">archivos asociados al plan</p>
        </section>
      </div>
      <section className="nibol-panel p-6">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-5 w-5 text-amber-700" />
          <div>
            <h2 className="text-xl font-semibold">Historial de evaluaciones</h2>
            <p className="text-sm text-stone-500">
              Avances exclusivos de este plan.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {evaluationsQuery.data?.data.map((item) => (
            <article
              className="rounded-xl border border-stone-200 p-4"
              key={item.id}
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    {item.progressPercent}% ·{" "}
                    {item.actionPlanStatus.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {item.submittedByUser.name} ·{" "}
                    {new Date(item.submittedAt).toLocaleString("es-BO")}
                  </p>
                </div>
                <span className="nibol-badge">
                  {item.reviewStatus.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-sm text-stone-700">{item.comment}</p>
            </article>
          ))}
          {!evaluationsQuery.data?.data.length ? (
            <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
              No hay evaluaciones todavía.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
