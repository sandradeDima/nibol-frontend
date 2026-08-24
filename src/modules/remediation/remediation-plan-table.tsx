"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";

import { remediationService } from "@/services/remediation-service";
import { cn } from "@/utils";

import {
  formatRemediationDate,
  getActionPlanStatusClasses,
} from "./presentation";

export function RemediationPlanTable({ canEdit }: { canEdit: boolean }) {
  const query = useQuery({
    queryFn: () =>
      remediationService.listActionPlans(
        "?perPage=100&sortBy=currentDueDate&sortDirection=asc",
      ),
    queryKey: ["action-plans", "all"],
  });
  return (
    <section className="nibol-panel overflow-hidden">
      <div className="divide-y divide-stone-200">
        {query.data?.data.map((plan) => (
          <div
            className="relative transition hover:bg-amber-50/40"
            key={plan.id}
          >
            <Link
              className="grid gap-4 p-5 pr-16 transition md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center"
              href={`/planes-accion/${plan.id}`}
            >
              <div>
                <p className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
                  {plan.observation.displayCode} · {plan.area.name}
                </p>
                <h3 className="mt-1 font-semibold text-stone-950">
                  Plan de acción
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-stone-500">
                  {plan.description}
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  {plan.responsibleUser.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Avance aprobado</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-28 rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-amber-600"
                      style={{ width: `${plan.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {plan.progressPercent}%
                  </span>
                </div>
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs text-stone-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Fecha actual
                </p>
                <p className="mt-1 font-semibold">
                  {formatRemediationDate(plan.currentDueDate)}
                </p>
                <span
                  className={cn(
                    "mt-2 inline-flex border px-2 py-1 text-xs font-semibold",
                    getActionPlanStatusClasses(
                      plan.isOverdue ? "OVERDUE" : plan.status,
                    ),
                  )}
                >
                  {plan.isOverdue ? "Vencido" : plan.statusLabel}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-stone-400" />
            </Link>
            {canEdit ? (
              <Link
                aria-label="Editar plan de acción"
                className="absolute top-5 right-12 rounded-lg p-2 text-stone-500 transition hover:bg-amber-100 hover:text-amber-800"
                href={`/planes-accion/${plan.id}?edit=1`}
                title="Editar plan de acción"
              >
                <Pencil className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        ))}
      </div>
      {query.isLoading ? (
        <p className="p-8 text-center text-sm text-stone-500">
          Cargando planes de acción…
        </p>
      ) : null}
      {!query.isLoading && !query.data?.data.length ? (
        <p className="p-10 text-center text-sm text-stone-500">
          No hay planes de acción registrados.
        </p>
      ) : null}
    </section>
  );
}
