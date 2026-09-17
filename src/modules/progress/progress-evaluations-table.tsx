"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { buildObservationUrl } from "@/lib/observation-links";
import { progressService } from "@/services/progress-service";
import { getActionPlanStatusLabel } from "../remediation/presentation";
import { getProgressStatusLabel } from "./presentation";

export function ProgressEvaluationsTable() {
  const searchParams = useSearchParams();
  const areaId = searchParams.get("filter.areaId");
  const reviewStatus = searchParams.get("filter.reviewStatus");
  const query = useQuery({
    queryFn: () => {
      const params = new URLSearchParams({ perPage: "100" });
      if (areaId) params.set("filter.areaId", areaId);
      if (reviewStatus) params.set("filter.reviewStatus", reviewStatus);
      return progressService.listProgressEvaluations(`?${params.toString()}`);
    },
    queryKey: ["progress-evaluations", "all", areaId, reviewStatus],
  });
  return (
    <section className="nibol-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-stone-50 text-xs tracking-wider text-stone-500 uppercase">
            <tr>
              <th className="px-5 py-4">Informe / Obs.</th>
              <th className="px-5 py-4">Plan / Área</th>
              <th className="px-5 py-4">Avance</th>
              <th className="px-5 py-4">Estado del plan</th>
              <th className="px-5 py-4">Revisión</th>
              <th className="px-5 py-4">Registrado por</th>
              <th className="px-5 py-4">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {query.data?.data.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-4">
                  <Link
                    className="font-semibold text-amber-800 hover:underline"
                    href={buildObservationUrl({
                      advanceId: item.id,
                      observationId: item.observation.id,
                      planId: item.actionPlan.id,
                      tab: "plans",
                    })}
                  >
                    {item.observation.displayCode}
                  </Link>
                  <p className="mt-1 text-xs text-stone-500">
                    {item.observation.title}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="line-clamp-2 font-semibold">
                    {item.actionPlan.area.name} · {item.comment}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">Plan de acción</p>
                </td>
                <td className="px-5 py-4 text-lg font-semibold">
                  {item.reportedProgressPercent ?? 0}%
                </td>
                <td className="px-5 py-4">
                  {getActionPlanStatusLabel(item.officialStatus)}
                </td>
                <td className="px-5 py-4">
                  <span className="nibol-badge">
                    {getProgressStatusLabel(item.reviewStatus)}
                  </span>
                </td>
                <td className="px-5 py-4">{item.submittedByUser.name}</td>
                <td className="px-5 py-4">
                  {new Date(item.submittedAt).toLocaleDateString("es-BO")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {query.isLoading ? (
        <p className="p-8 text-center text-sm text-stone-500">
          Cargando evaluaciones…
        </p>
      ) : null}
    </section>
  );
}
