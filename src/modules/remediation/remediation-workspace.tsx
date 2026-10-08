"use client";

import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Eye,
  Pencil,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { UserSearchSelect } from "@/components/ui/user-search-select";
import { QUERY_KEYS } from "@/lib/constants";
import { extensionRequestService } from "@/services/extension-request-service";
import { observationService } from "@/services/observation-service";
import { remediationService } from "@/services/remediation-service";
import { cn, getApiErrorMessage } from "@/utils";

import {
  ActionPlanEditor,
  type ActionPlanEditorValues,
} from "./action-plan-editor";
import { RemediationApprovalPanel } from "./remediation-approval-panel";
import {
  formatRemediationDate,
  getActionPlanStatusClasses,
} from "./presentation";

const emptyForm = {
  description: "",
  dueDate: "",
  observationAreaId: "",
  responsibleUserId: "",
};

export function RemediationWorkspace({
  activeExtensionId,
  activePlanId,
  canAssignRecommendedExecutor,
  canCreateActionPlans,
  canCreateRecommended,
  canEditActionPlans,
  canEditRecommended,
  canSubmitRecommended,
  canViewRecommended,
  observationId,
}: {
  activeExtensionId?: string | null;
  activePlanId?: string | null;
  canAssignRecommendedExecutor: boolean;
  canCreateActionPlans: boolean;
  canCreateRecommended: boolean;
  canEditActionPlans: boolean;
  canEditRecommended: boolean;
  canSubmitRecommended: boolean;
  canViewRecommended: boolean;
  observationId: string;
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const observation = useQuery({
    queryFn: () => observationService.getObservationById(observationId),
    queryKey: QUERY_KEYS.observationDetails(observationId),
  });
  const options = useQuery({
    queryFn: observationService.getObservationOptions,
    queryKey: QUERY_KEYS.observationOptions,
  });
  const executorOptions = useQuery({
    enabled: Boolean(showForm && form.observationAreaId),
    queryFn: () =>
      remediationService.getActionPlanOptions(
        `?observationId=${encodeURIComponent(observationId)}&observationAreaId=${encodeURIComponent(form.observationAreaId)}`,
      ),
    queryKey: [
      "action-plan-executor-options",
      observationId,
      form.observationAreaId,
    ],
  });
  const plans = useQuery({
    queryFn: () =>
      remediationService.listActionPlans(
        `?filter.observationId=${encodeURIComponent(observationId)}&perPage=100`,
      ),
    queryKey: ["action-plans", observationId],
  });
  const editingPlan = plans.data?.data.find(
    (plan) => plan.id === editingPlanId,
  );
  const editingExecutorOptions = useQuery({
    enabled: Boolean(editingPlanId && editingPlan),
    queryFn: () =>
      remediationService.getActionPlanOptions(
        `?observationId=${encodeURIComponent(observationId)}&observationAreaId=${encodeURIComponent(editingPlan!.observationAreaId)}`,
      ),
    queryKey: [
      "action-plan-editor-executor-options",
      observationId,
      editingPlan?.observationAreaId,
    ],
  });
  const activeExtension = useQuery({
    enabled: Boolean(activeExtensionId),
    queryFn: () => extensionRequestService.getById(activeExtensionId as string),
    queryKey: ["extension-request", activeExtensionId],
  });
  const remediationPlans = useQuery({
    enabled: canViewRecommended,
    queryFn: () => remediationService.listRemediationPlans(observationId),
    queryKey: [QUERY_KEYS.remediationPlans, observationId],
  });
  const refreshRemediationPlans = () =>
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.remediationPlans, observationId],
    });
  const create = useMutation({
    mutationFn: () => remediationService.createActionPlan(observationId, form),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setForm(emptyForm);
      setShowForm(false);
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["action-plans", observationId],
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.observationDetails(observationId),
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.observationActionItems(observationId),
        }),
      ]);
    },
  });
  const update = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ActionPlanEditorValues;
    }) => remediationService.updateActionPlan(id, input),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setEditingPlanId(null);
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["action-plans", observationId],
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.observationDetails(observationId),
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.observationActionItems(observationId),
        }),
      ]);
    },
  });
  const data = observation.data;
  const rows = plans.data?.data ?? [];

  useEffect(() => {
    const evidenceHash = window.location.hash === "#avances-evidencias";
    const targetId = evidenceHash
      ? "avances-evidencias"
      : activeExtensionId
        ? `extension-${activeExtensionId}`
        : activePlanId
          ? `action-plan-${activePlanId}`
          : null;
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (!target) return;
    if (evidenceHash) {
      const stickyHeader = document.getElementById("observation-detail-sticky");
      const offset = stickyHeader
        ? stickyHeader.getBoundingClientRect().height + 16
        : 16;
      window.scrollTo({
        behavior: "smooth",
        top: window.scrollY + target.getBoundingClientRect().top - offset,
      });
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeExtensionId, activeExtension.data, activePlanId, plans.data]);

  return (
    <section className="nibol-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-700 uppercase">
            Ejecución por área
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-stone-950">
            Planes de acción
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Cada plan conserva su ejecutor, plazo, evaluaciones y evidencia de
            forma independiente.
          </p>
        </div>
        {canCreateActionPlans ? (
          <button
            className="nibol-btn-primary px-4 py-2.5 text-sm"
            onClick={() => setShowForm((value) => !value)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Agregar plan de acción
          </button>
        ) : null}
      </div>

      {activeExtension.data && !activeExtension.data.actionPlan ? (
        <div
          className="mt-5 border border-[var(--primary)] bg-[var(--primary-soft)] p-4 ring-2 ring-[color:color-mix(in_srgb,var(--primary)_20%,transparent)]"
          id={`extension-${activeExtension.data.id}`}
        >
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--primary)] uppercase">
            Ampliación solicitada
          </p>
          <p className="mt-2 text-sm text-stone-700">
            Hasta {activeExtension.data.proposedDueDate.slice(0, 10)} · +
            {activeExtension.data.impactDays} días ·{" "}
            {activeExtension.data.status}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            {activeExtension.data.reason}
          </p>
        </div>
      ) : null}

      {showForm && canCreateActionPlans && data ? (
        <form
          className="mt-6 grid gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.observationAreaId || !form.responsibleUserId) {
              setError("Seleccione un área y un ejecutor válido.");
              return;
            }
            create.mutate();
          }}
        >
          <label className="space-y-2 text-sm font-semibold">
            Área
            <select
              className="nibol-field"
              required
              value={form.observationAreaId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  observationAreaId: event.target.value,
                }))
              }
            >
              <option value="">Seleccione</option>
              {data.areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.area.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold">
            Ejecutor
            <UserSearchSelect
              id="action-plan-create-responsible"
              onChange={(responsibleUserId) =>
                setForm((current) => ({ ...current, responsibleUserId }))
              }
              placeholder={
                executorOptions.isLoading
                  ? "Cargando ejecutores…"
                  : "Buscar ejecutor por nombre o correo"
              }
              users={executorOptions.data?.executorCandidates ?? []}
              value={form.responsibleUserId}
            />
            <span className="block text-xs font-normal text-stone-500">
              Solo se muestran usuarios activos con rol Ejecutor para el área
              seleccionada.
            </span>
          </label>
          <label className="space-y-2 text-sm font-semibold md:col-span-2">
            Descripción
            <textarea
              className="nibol-field min-h-24 resize-y py-3"
              required
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-2 text-sm font-semibold">
            Fecha límite
            <input
              className="nibol-field"
              required
              type="date"
              value={form.dueDate}
              onChange={(event) => {
                const dueDate = event.currentTarget.value;
                setForm((current) => ({ ...current, dueDate }));
              }}
            />
          </label>
          <div className="flex items-end justify-end gap-2">
            <button
              className="nibol-btn-secondary px-4 py-2.5 text-sm"
              onClick={() => setShowForm(false)}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="nibol-btn-primary px-4 py-2.5 text-sm"
              disabled={create.isPending}
              type="submit"
            >
              {create.isPending ? "Guardando…" : "Guardar plan"}
            </button>
          </div>
          {error ? (
            <p className="text-sm font-medium text-rose-700 md:col-span-2">
              {error}
            </p>
          ) : null}
        </form>
      ) : null}

      <div className="mt-6 space-y-6">
        {data?.areas.map((area) => {
          const areaPlans = rows.filter(
            (plan) => plan.observationAreaId === area.id,
          );
          return (
            <div key={area.id}>
              <div className="mb-3 flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <h4 className="font-semibold tracking-[0.14em] text-stone-900 uppercase">
                    {area.area.name}
                  </h4>
                  <p className="mt-1 text-xs text-stone-500">
                    {area.processOwner.name} · dueño del proceso &nbsp;|&nbsp;{" "}
                    {area.areaResponsible.name} · responsable del área
                  </p>
                </div>
                <span className="nibol-badge">
                  {areaPlans.length}{" "}
                  {areaPlans.length === 1 ? "plan" : "planes"}
                </span>
              </div>
              {canViewRecommended && remediationPlans.isPending ? (
                <div className="mb-4 h-28 animate-pulse bg-[var(--surface-muted)]" />
              ) : canViewRecommended ? (
                <RemediationApprovalPanel
                  area={area.area}
                  canAssignExecutor={canAssignRecommendedExecutor}
                  canCreate={canCreateRecommended}
                  canEdit={canEditRecommended}
                  canSubmit={canSubmitRecommended}
                  key={`${area.id}-${remediationPlans.data?.find((plan) => plan.area.id === area.area.id)?.updatedAt ?? "new"}`}
                  observationId={observationId}
                  onChanged={refreshRemediationPlans}
                  plan={
                    remediationPlans.data?.find(
                      (plan) => plan.area.id === area.area.id,
                    ) ?? null
                  }
                  users={options.data?.users ?? []}
                />
              ) : null}
              {areaPlans.length ? (
                <div className="space-y-3">
                  {areaPlans.map((plan) =>
                    editingPlanId === plan.id ? (
                      <ActionPlanEditor
                        areas={data.areas}
                        error={error}
                        initial={{
                          description: plan.description,
                          dueDate: plan.currentDueDate,
                          observationAreaId: plan.observationAreaId,
                          responsibleUserId: plan.responsibleUser.id,
                        }}
                        isSaving={
                          update.isPending && update.variables?.id === plan.id
                        }
                        key={`${plan.id}-editor`}
                        onCancel={() => {
                          setEditingPlanId(null);
                          setError(null);
                        }}
                        onSubmit={(input) =>
                          update.mutate({ id: plan.id, input })
                        }
                        users={[
                          ...(editingExecutorOptions.data?.executorCandidates ??
                            []),
                          ...(editingExecutorOptions.data?.executorCandidates.some(
                            (user) => user.id === plan.responsibleUser.id,
                          )
                            ? []
                            : [plan.responsibleUser]),
                        ]}
                      />
                    ) : (
                      <div
                        className={cn(
                          "relative border bg-white transition hover:border-amber-300 hover:shadow-sm",
                          activePlanId === plan.id ||
                            activeExtension.data?.actionPlan?.id === plan.id
                            ? "border-[var(--primary)] bg-[var(--primary-soft)] ring-2 ring-[color:color-mix(in_srgb,var(--primary)_20%,transparent)]"
                            : "border-stone-200",
                        )}
                        id={`action-plan-${plan.id}`}
                        key={plan.id}
                      >
                        <Link
                          className="group grid gap-6 p-5 pr-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(15rem,0.8fr)_auto] lg:items-stretch lg:pr-5"
                          href={`/planes-accion/${plan.id}`}
                        >
                          <div className="flex min-w-0 gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-[var(--surface-muted)] text-[var(--primary)]">
                              <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold tracking-[0.16em] text-amber-700 uppercase">
                                Plan de acción
                              </p>
                              <p className="mt-2 text-lg leading-7 font-semibold break-words whitespace-pre-wrap text-stone-950">
                                {plan.description}
                              </p>
                              <p className="mt-3 text-sm break-words text-stone-500">
                                Área: {area.area.name}
                              </p>
                            </div>
                          </div>
                          <div className="grid gap-4 border-t border-stone-200 pt-5 text-sm lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                            <div className="flex items-start justify-between gap-3">
                              <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                                  Ejecutor
                                </p>
                                <p className="mt-1 font-semibold break-words text-stone-950">
                                  {plan.responsibleUser.name}
                                </p>
                                <p className="mt-1 text-xs break-words text-stone-500">
                                  {plan.progressEvaluationCount} evaluaciones ·{" "}
                                  {plan.evidenceCount} evidencias
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "inline-flex shrink-0 border px-2.5 py-1 text-xs font-semibold",
                                  getActionPlanStatusClasses(plan.status),
                                )}
                              >
                                {plan.statusLabel}
                              </span>
                            </div>
                            <div className="flex items-start gap-3">
                              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" />
                              <div>
                                <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                                  Fecha de compromiso
                                </p>
                                <p className="mt-1 font-semibold text-stone-950">
                                  {formatRemediationDate(plan.effectiveDueDate)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                                  Estado
                                </p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  <span
                                    className={cn(
                                      "inline-flex border px-2.5 py-1 text-xs font-semibold",
                                      plan.deadlineStatus === "VENCIDO"
                                        ? "border-rose-200 bg-rose-50 text-rose-800"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-800",
                                    )}
                                  >
                                    {plan.deadlineStatus === "VENCIDO"
                                      ? "Vencido"
                                      : "Vigente"}
                                  </span>
                                </div>
                                {plan.reprogrammed ? (
                                  <p className="mt-1 text-xs font-medium text-amber-700">
                                    Reprogramado
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center lg:justify-end">
                            <span className="nibol-btn-primary w-full justify-center px-4 py-3 text-sm lg:w-auto">
                              <Eye className="h-4 w-4" />
                              Ver plan de acción
                              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                            </span>
                          </div>
                        </Link>
                        {activeExtension.data?.actionPlan?.id === plan.id ? (
                          <div
                            className="mx-5 mb-5 border border-[var(--primary)] bg-white p-3 ring-2 ring-[color:color-mix(in_srgb,var(--primary)_20%,transparent)]"
                            id={`extension-${activeExtension.data.id}`}
                          >
                            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--primary)] uppercase">
                              Ampliación solicitada
                            </p>
                            <p className="mt-1 text-sm text-stone-700">
                              Hasta{" "}
                              {activeExtension.data.proposedDueDate.slice(
                                0,
                                10,
                              )}{" "}
                              · +{activeExtension.data.impactDays} días ·{" "}
                              {activeExtension.data.status}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-stone-600">
                              {activeExtension.data.reason}
                            </p>
                          </div>
                        ) : null}
                        {canEditActionPlans ? (
                          <button
                            aria-label="Editar plan de acción"
                            className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-lg text-stone-500 transition hover:bg-amber-50 hover:text-amber-800"
                            onClick={() => {
                              setError(null);
                              setEditingPlanId(plan.id);
                            }}
                            type="button"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-stone-300 p-5 text-sm text-stone-500">
                  Esta área todavía no tiene planes de acción.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
