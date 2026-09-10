"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  ListChecks,
  TriangleAlert,
} from "lucide-react";

import { QUERY_KEYS } from "@/lib/constants";
import { observationService } from "@/services/observation-service";
import { remediationService } from "@/services/remediation-service";
import type { ObservationActionItem } from "@/types";
import { cn } from "@/utils";

export function ObservationActionPanel({
  observationId,
}: {
  observationId: string;
}) {
  const actionQuery = useQuery({
    queryFn: () => observationService.getObservationActionItems(observationId),
    queryKey: QUERY_KEYS.observationActionItems(observationId),
    staleTime: 30_000,
  });
  const plansQuery = useQuery({
    enabled: Boolean(
      (actionQuery.data ?? []).some(
        (item) => item.actionType === "REQUEST_EXTENSION",
      ),
    ),
    queryFn: () =>
      remediationService.listActionPlans(
        `?filter.observationId=${encodeURIComponent(observationId)}&perPage=100`,
      ),
    queryKey: ["action-plans", "extension-action", observationId],
  });
  const items = actionQuery.data ?? [];
  const critical = items.some((item) => item.severity === "CRITICAL");

  return (
    <section className="nibol-panel overflow-hidden" id="proximas-acciones">
      <div
        className={cn(
          "flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6",
          critical
            ? "border-b-rose-200 bg-rose-50/70"
            : "border-b-[var(--border)] bg-[var(--surface)]",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "p-2.5",
              critical
                ? "bg-rose-100 text-rose-700"
                : "bg-[var(--primary-soft)] text-[var(--primary)]",
            )}
          >
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--muted)] uppercase">
              Guía de seguimiento
            </p>
            <h3 className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              Próximas acciones
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--foreground-soft)]">
              Revise lo que falta para mantener el hallazgo en control,
              completar su respaldo y solicitar el cierre.
            </p>
          </div>
        </div>
        {items.length > 0 ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-2 border px-3 py-2 text-xs font-semibold uppercase",
              critical
                ? "border-rose-200 bg-white text-rose-700"
                : "border-amber-200 bg-amber-50 text-amber-800",
            )}
          >
            <CircleAlert className="h-3.5 w-3.5" />
            {items.length} pendiente{items.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      <div className="p-5 sm:p-6">
        {actionQuery.isPending ? (
          <div className="flex items-center gap-3 py-5 text-sm text-[var(--foreground-soft)]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--primary)]" />
            Revisando la completitud de esta observación…
          </div>
        ) : null}
        {actionQuery.isError ? (
          <div className="flex items-center justify-between gap-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>No fue posible revisar las próximas acciones.</span>
            <button
              className="font-semibold underline"
              onClick={() => {
                void actionQuery.refetch();
              }}
              type="button"
            >
              Reintentar
            </button>
          </div>
        ) : null}
        {!actionQuery.isPending &&
        !actionQuery.isError &&
        items.length === 0 ? (
          <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 px-4 py-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-semibold text-emerald-900">Todo al día</p>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                No hay acciones pendientes identificadas para esta observación.
              </p>
            </div>
          </div>
        ) : null}
        {!actionQuery.isPending && !actionQuery.isError && items.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <ActionItemCard
                item={item}
                key={item.code}
                observationId={observationId}
                plans={plansQuery.data?.data ?? []}
                plansLoading={plansQuery.isPending}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ActionItemCard({
  item,
  observationId,
  plans,
  plansLoading,
}: {
  item: ObservationActionItem;
  observationId: string;
  plans: Array<{
    area: { name: string };
    currentDueDate: string;
    description: string;
    id: string;
    responsibleUser: { name: string };
    statusLabel: string;
  }>;
  plansLoading: boolean;
}) {
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const severityClass =
    item.severity === "CRITICAL"
      ? "border-rose-200 bg-rose-50/70"
      : item.severity === "WARNING"
        ? "border-amber-200 bg-amber-50/70"
        : "border-[var(--border)] bg-[var(--surface-soft)]";
  const iconClass =
    item.severity === "CRITICAL"
      ? "text-rose-700"
      : item.severity === "WARNING"
        ? "text-amber-700"
        : "text-[var(--primary)]";
  const Icon =
    item.severity === "CRITICAL"
      ? TriangleAlert
      : item.severity === "WARNING"
        ? CircleAlert
        : CheckCircle2;
  return (
    <article className={cn("flex flex-col gap-3 border p-4", severityClass)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {item.label}
          </p>
          {item.description ? (
            <p className="mt-1 text-sm leading-6 text-[var(--foreground-soft)]">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>
      {item.actionType === "REQUEST_EXTENSION" ? (
        plansLoading ? (
          <span className="text-xs text-[var(--muted)]">
            Revisando planes elegibles…
          </span>
        ) : plans.length === 1 ? (
          <Link
            className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
            href={`/planes-accion/${plans[0]!.id}?extension=1#plazo`}
          >
            Solicitar ampliación <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        ) : plans.length > 1 ? (
          <>
            <button
              className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
              onClick={() => setShowPlanSelector(true)}
              type="button"
            >
              Seleccionar plan <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
            {showPlanSelector ? (
              <div
                aria-label="Seleccione el plan de acción"
                className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4"
                role="dialog"
              >
                <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-stone-950">
                        Seleccione el plan de acción
                      </h4>
                      <p className="mt-1 text-sm text-stone-500">
                        La ampliación se solicita para un plan específico.
                      </p>
                    </div>
                    <button
                      className="text-sm text-stone-500 underline"
                      onClick={() => setShowPlanSelector(false)}
                      type="button"
                    >
                      Cerrar
                    </button>
                  </div>
                  <div className="mt-5 space-y-3">
                    {plans.map((plan) => (
                      <Link
                        className="block rounded-xl border border-stone-200 p-4 hover:border-amber-400 hover:bg-amber-50/50"
                        href={`/planes-accion/${plan.id}?extension=1#plazo`}
                        key={plan.id}
                        onClick={() => setShowPlanSelector(false)}
                      >
                        <p className="font-semibold text-stone-950">
                          {plan.description}
                        </p>
                        <p className="mt-2 text-xs text-stone-600">
                          {plan.area.name} · {plan.responsibleUser.name} · vence{" "}
                          {new Date(plan.currentDueDate).toLocaleDateString(
                            "es-BO",
                            { timeZone: "UTC" },
                          )}{" "}
                          · {plan.statusLabel}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <Link
            className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
            href={`/observaciones/${observationId}?tab=plans`}
          >
            Agregar plan de acción <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )
      ) : item.actionUrl ? (
        <Link
          className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
          href={item.actionUrl}
        >
          {item.actionLabel ?? "Ver seguimiento"}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Pendiente de atención en el seguimiento.
        </p>
      )}
    </article>
  );
}
