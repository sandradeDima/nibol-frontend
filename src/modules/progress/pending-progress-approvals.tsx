"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, RotateCcw } from "lucide-react";
import Link from "next/link";

import { buildObservationUrl } from "@/lib/observation-links";
import { progressService } from "@/services/progress-service";
import type { ActionPlanStatus } from "@/types";

export function PendingProgressApprovals({
  canApproveProgress,
  canReturnProgress,
}: {
  canApproveProgress: boolean;
  canReturnProgress: boolean;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryFn: () =>
      progressService.listProgressEvaluations(
        "?filter.reviewStatus=SENT_TO_AUDIT&perPage=100",
      ),
    queryKey: ["progress-evaluations", "pending"],
  });
  const review = useMutation({
    mutationFn: ({
      action,
      id,
      officialStatus,
    }: {
      action: "approve" | "return";
      id: string;
      officialStatus: ActionPlanStatus;
    }) =>
      progressService.reviewProgressEvaluation(
        id,
        action,
        action === "approve"
          ? { officialStatus }
          : {
              comment: "Revisión requerida",
              officialStatus,
            },
      ),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["progress-evaluations"] }),
  });
  return (
    <div className="space-y-3">
      {query.data?.data.map((item) => (
        <article
          className="rounded-2xl border border-stone-200 bg-white p-5"
          key={item.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link
                className="text-xs font-semibold tracking-wider text-amber-700 uppercase hover:underline"
                href={buildObservationUrl({
                  advanceId: item.id,
                  observationId: item.observation.id,
                  planId: item.actionPlan.id,
                  tab: "plans",
                })}
              >
                {item.observation.displayCode}
              </Link>
              <h4 className="mt-2 font-semibold text-stone-950">
                Plan de acción
              </h4>
              <p className="mt-1 text-sm text-stone-500">
                {item.actionPlan.area.name} · {item.submittedByUser.name}
              </p>
            </div>
            <p className="text-2xl font-semibold">
              {item.reportedProgressPercent ?? 0}%
            </p>
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-700">
            {item.comment}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="nibol-btn-secondary px-3 py-2 text-xs"
              href={buildObservationUrl({
                advanceId: item.id,
                observationId: item.observation.id,
                planId: item.actionPlan.id,
                tab: "plans",
              })}
            >
              Ver
            </Link>
            {canApproveProgress ? (
              <button
                className="nibol-btn-primary px-3 py-2 text-xs"
                onClick={() =>
                  review.mutate({
                    action: "approve",
                    id: item.id,
                    officialStatus: item.officialStatus,
                  })
                }
                type="button"
              >
                <Check className="h-3.5 w-3.5" />
                Aprobar
              </button>
            ) : null}
            {canReturnProgress ? (
              <button
                className="nibol-btn-secondary px-3 py-2 text-xs"
                onClick={() =>
                  review.mutate({
                    action: "return",
                    id: item.id,
                    officialStatus: item.officialStatus,
                  })
                }
                type="button"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Devolver
              </button>
            ) : null}
          </div>
        </article>
      ))}
      {!query.isLoading && !query.data?.data.length ? (
        <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
          No hay evaluaciones pendientes.
        </p>
      ) : null}
    </div>
  );
}
