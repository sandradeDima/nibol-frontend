"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronRight, Plus, Target } from "lucide-react";
import Link from "next/link";

import { QUERY_KEYS } from "@/lib/constants";
import { observationService } from "@/services/observation-service";
import { remediationService } from "@/services/remediation-service";
import { getApiErrorMessage } from "@/utils";

import { RemediationApprovalPanel } from "./remediation-approval-panel";

const emptyForm = {
  description: "",
  dueDate: "",
  observationAreaId: "",
  responsibleUserId: "",
  title: "",
};

export function RemediationWorkspace({
  observationId,
}: {
  observationId: string;
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
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
  const plans = useQuery({
    queryFn: () =>
      remediationService.listActionPlans(
        `?filter.observationId=${encodeURIComponent(observationId)}&perPage=100`,
      ),
    queryKey: ["action-plans", observationId],
  });
  const remediationPlans = useQuery({
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
      ]);
    },
  });
  const data = observation.data;
  const rows = plans.data?.data ?? [];

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
        <button
          className="nibol-btn-primary px-4 py-2.5 text-sm"
          onClick={() => setShowForm((value) => !value)}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Agregar plan de acción
        </button>
      </div>

      {showForm && data ? (
        <form
          className="mt-6 grid gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
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
            <select
              className="nibol-field"
              required
              value={form.responsibleUserId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  responsibleUserId: event.target.value,
                }))
              }
            >
              <option value="">Seleccione</option>
              {options.data?.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} · {user.jobTitle ?? user.email}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold md:col-span-2">
            Título
            <input
              className="nibol-field"
              required
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
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
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
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
              {remediationPlans.isPending ? (
                <div className="mb-4 h-28 animate-pulse bg-[var(--surface-muted)]" />
              ) : (
                <RemediationApprovalPanel
                  area={area.area}
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
              )}
              {areaPlans.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {areaPlans.map((plan) => (
                    <Link
                      className="group rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-amber-300 hover:shadow-sm"
                      href={`/planes-accion/${plan.id}`}
                      key={plan.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
                            {plan.statusLabel}
                          </p>
                          <h5 className="mt-2 font-semibold text-stone-950">
                            {plan.title}
                          </h5>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
                            {plan.description}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-stone-400 transition group-hover:translate-x-1 group-hover:text-amber-700" />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-stone-600">
                        <span className="flex items-center gap-1">
                          <Target className="h-3.5 w-3.5" />
                          {plan.progressPercent}%
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {plan.currentDueDate.slice(0, 10)}
                        </span>
                        <span>{plan.responsibleUser.name}</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full bg-amber-600"
                          style={{ width: `${plan.progressPercent}%` }}
                        />
                      </div>
                    </Link>
                  ))}
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
