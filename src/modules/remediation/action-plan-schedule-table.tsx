"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { remediationService } from "@/services/remediation-service";
import {
  formatRemediationDate,
  getActionPlanStatusClasses,
} from "./presentation";

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
        <table className="w-full min-w-[1060px] text-left text-sm">
          <thead className="bg-stone-50 text-xs tracking-wider text-stone-500 uppercase">
            <tr>
              <th className="px-5 py-4">Informe / Obs.</th>
              <th className="px-5 py-4">Descripción del plan</th>
              <th className="px-5 py-4">Área</th>
              <th className="px-5 py-4">Ejecutor</th>
              <th className="px-5 py-4">Avance oficial</th>
              <th className="px-5 py-4">Fecha efectiva</th>
              <th className="px-5 py-4">Estado de avance</th>
              <th className="px-5 py-4">Estado de plazo</th>
              <th className="px-5 py-4">Reprogramado</th>
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
                    {plan.description}
                  </Link>
                </td>
                <td className="px-5 py-4">{plan.area.name}</td>
                <td className="px-5 py-4">{plan.responsibleUser.name}</td>
                <td className="px-5 py-4 font-semibold">
                  {plan.progressPercent}%
                </td>
                <td className="px-5 py-4">
                  {formatRemediationDate(plan.effectiveDueDate)}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex border px-2 py-1 text-xs font-semibold ${getActionPlanStatusClasses(plan.status)}`}
                  >
                    {plan.statusLabel}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`font-semibold ${plan.deadlineStatus === "VENCIDO" ? "text-rose-700" : "text-emerald-700"}`}
                  >
                    {plan.deadlineStatus === "VENCIDO" ? "Vencido" : "Vigente"}
                  </span>
                </td>
                <td className="px-5 py-4">{plan.reprogrammed ? "Sí" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
