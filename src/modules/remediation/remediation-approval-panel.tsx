"use client";

import { useState } from "react";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowUpRight,
  GitBranch,
  Pencil,
  Send,
  ShieldCheck,
} from "lucide-react";

import { remediationService } from "@/services/remediation-service";
import type { ObservationUserSummary, RemediationPlanDetail } from "@/types";
import { getApiErrorMessage } from "@/utils";

const statusLabels: Record<RemediationPlanDetail["status"], string> = {
  APPROVED: "Aprobado",
  CLOSED: "Cerrado",
  DRAFT: "Borrador",
  RETURNED: "Devuelto",
  SENT_TO_AUDIT: "En aprobación",
};

const emptyForm = {
  additionalComments: "",
  mitigationText: "",
  ownerUserId: "",
  strategyText: "",
};

export function RemediationApprovalPanel({
  area,
  observationId,
  onChanged,
  plan,
  users,
}: {
  area: { id: string; name: string };
  observationId: string;
  onChanged: () => Promise<unknown>;
  plan: RemediationPlanDetail | null;
  users: ObservationUserSummary[];
}) {
  const editable = !plan || ["DRAFT", "RETURNED"].includes(plan.status);
  const [editing, setEditing] = useState(!plan);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() =>
    plan
      ? {
          additionalComments: plan.additionalComments ?? "",
          mitigationText: plan.mitigationText ?? "",
          ownerUserId: plan.ownerUser?.id ?? "",
          strategyText: plan.strategyText,
        }
      : emptyForm,
  );
  const save = useMutation({
    mutationFn: () =>
      plan
        ? remediationService.updateRemediationPlan(plan.id, {
            additionalComments: form.additionalComments || null,
            mitigationText: form.mitigationText || null,
            ownerUserId: form.ownerUserId || null,
            strategyText: form.strategyText,
          })
        : remediationService.createRemediationPlan(observationId, {
            additionalComments: form.additionalComments || null,
            areaId: area.id,
            mitigationText: form.mitigationText || null,
            ownerUserId: form.ownerUserId || null,
            strategyText: form.strategyText,
          }),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setError(null);
      setEditing(false);
      await onChanged();
    },
  });
  const submit = useMutation({
    mutationFn: () => {
      if (!plan) throw new Error("Guarde el plan antes de enviarlo.");
      return remediationService.submitRemediationPlan(plan.id);
    },
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setError(null);
      await onChanged();
    },
  });

  return (
    <div className="mb-4 border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--primary)]" />
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
              Plan de remediación del área
            </p>
            <p className="mt-1 text-sm text-[var(--foreground-soft)]">
              Define la estrategia que Auditoría aprobará antes de ejecutar sus
              planes de acción.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {plan ? (
            <span className="nibol-badge">{statusLabels[plan.status]}</span>
          ) : null}
          {editable && !editing ? (
            <button
              className="nibol-btn-secondary px-3 py-2 text-xs"
              onClick={() => setEditing(true)}
              type="button"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar
            </button>
          ) : null}
        </div>
      </div>

      {editing ? (
        <form
          className="mt-5 grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">
            Estrategia de remediación
            <textarea
              className="nibol-field min-h-28 resize-y"
              minLength={10}
              required
              value={form.strategyText}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  strategyText: event.target.value,
                }))
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Medidas de mitigación
            <textarea
              className="nibol-field min-h-24 resize-y"
              value={form.mitigationText}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  mitigationText: event.target.value,
                }))
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Responsable del plan
            <select
              className="nibol-field"
              value={form.ownerUserId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  ownerUserId: event.target.value,
                }))
              }
            >
              <option value="">Sin responsable específico</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} · {user.jobTitle ?? user.email}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">
            Comentarios adicionales
            <textarea
              className="nibol-field min-h-20 resize-y"
              value={form.additionalComments}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  additionalComments: event.target.value,
                }))
              }
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
            {plan ? (
              <button
                className="nibol-btn-secondary px-4 py-2.5 text-sm"
                onClick={() => setEditing(false)}
                type="button"
              >
                Cancelar
              </button>
            ) : null}
            <button
              className="nibol-btn-primary px-4 py-2.5 text-sm"
              disabled={save.isPending}
              type="submit"
            >
              {save.isPending ? "Guardando…" : "Guardar plan"}
            </button>
          </div>
        </form>
      ) : plan ? (
        <div className="mt-5 grid gap-4 border-t border-[var(--border)] pt-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="text-sm leading-6 whitespace-pre-wrap text-[var(--foreground)]">
              {plan.strategyText}
            </p>
            {plan.returnReason ? (
              <p className="mt-3 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Observación de revisión: {plan.returnReason}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-[var(--muted)]">
              Responsable: {plan.ownerUser?.name ?? "No asignado"}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:min-w-52">
            {editable ? (
              <button
                className="nibol-btn-primary justify-center px-4 py-2.5 text-sm"
                disabled={submit.isPending}
                onClick={() => submit.mutate()}
                type="button"
              >
                <Send className="h-4 w-4" />
                {submit.isPending ? "Enviando…" : "Enviar a aprobación"}
              </button>
            ) : null}
            {plan.workflowInstanceId ? (
              <Link
                className="nibol-btn-secondary justify-center px-4 py-2.5 text-sm"
                href={`/configuracion/flujos/instancias/${plan.workflowInstanceId}`}
              >
                <GitBranch className="h-4 w-4" /> Ver ejecución
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
