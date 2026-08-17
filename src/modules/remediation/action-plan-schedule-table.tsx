"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { remediationService } from "@/services/remediation-service";
import { formatRemediationDate } from "./presentation";

export function ActionPlanScheduleTable() {
  const query = useQuery({
    queryFn: () =>
      remediationService.listActionPlans(
        "?perPage=100&sortBy=currentDueDate&sortDirection=asc",
      ),
    queryKey: ["action-plans", "schedule"],
  });
  return (
    <section className="nibol-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-stone-50 text-xs tracking-wider text-stone-500 uppercase">
            <tr>
              <th className="px-5 py-4">Informe / Obs.</th>
              <th className="px-5 py-4">Plan de acción</th>
              <th className="px-5 py-4">Área</th>
              <th className="px-5 py-4">Ejecutor</th>
              <th className="px-5 py-4">Progreso</th>
              <th className="px-5 py-4">Fecha actual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {query.data?.data.map((plan) => (
              <tr key={plan.id}>
                <td className="px-5 py-4">
                  <Link
                    className="font-semibold text-amber-800 hover:underline"
                    href={`/observaciones/${plan.observation.id}`}
                  >
                    {plan.observation.displayCode}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <Link
                    className="font-semibold hover:underline"
                    href={`/planes-accion/${plan.id}`}
                  >
                    {plan.title}
                  </Link>
                </td>
                <td className="px-5 py-4">{plan.area.name}</td>
                <td className="px-5 py-4">{plan.responsibleUser.name}</td>
                <td className="px-5 py-4 font-semibold">
                  {plan.progressPercent}%
                </td>
                <td className="px-5 py-4">
                  <span
                    className={
                      plan.isOverdue
                        ? "font-semibold text-rose-700"
                        : "font-semibold"
                    }
                  >
                    {formatRemediationDate(plan.currentDueDate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
