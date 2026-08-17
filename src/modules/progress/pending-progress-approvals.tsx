"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, RotateCcw, X } from "lucide-react";
import Link from "next/link";

import { progressService } from "@/services/progress-service";

export function PendingProgressApprovals() {
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
    }: {
      action: "approve" | "return" | "reject";
      id: string;
    }) =>
      progressService.reviewProgressEvaluation(
        id,
        action,
        action === "approve"
          ? {}
          : {
              comment:
                window.prompt("Comentario de revisión") ?? "Revisión requerida",
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
                href={`/observaciones/${item.observation.id}`}
              >
                {item.observation.displayCode}
              </Link>
              <h4 className="mt-2 font-semibold text-stone-950">
                {item.actionPlan.title}
              </h4>
              <p className="mt-1 text-sm text-stone-500">
                {item.actionPlan.area.name} · {item.submittedByUser.name}
              </p>
            </div>
            <p className="text-2xl font-semibold">{item.progressPercent}%</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-700">
            {item.comment}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="nibol-btn-primary px-3 py-2 text-xs"
              onClick={() => review.mutate({ action: "approve", id: item.id })}
              type="button"
            >
              <Check className="h-3.5 w-3.5" />
              Aprobar
            </button>
            <button
              className="nibol-btn-secondary px-3 py-2 text-xs"
              onClick={() => review.mutate({ action: "return", id: item.id })}
              type="button"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Devolver
            </button>
            <button
              className="nibol-btn-secondary px-3 py-2 text-xs text-rose-700"
              onClick={() => review.mutate({ action: "reject", id: item.id })}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
              Rechazar
            </button>
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
