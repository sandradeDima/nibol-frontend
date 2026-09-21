"use client";

import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/lib/constants";
import { progressService } from "@/services/progress-service";
import { workflowRuntimeService } from "@/services/workflow-runtime-service";
import type { ActionPlanStatus, ProgressEvaluationItem } from "@/types";
import { getApiErrorMessage } from "@/utils";

import { getActionPlanStatusLabel } from "../remediation/presentation";

const statusOrder: ActionPlanStatus[] = [
  "NOT_STARTED",
  "STARTED",
  "WITH_PROGRESS",
  "CONCLUDED",
];

export const getValidProgressStatusOptions = (
  current: ActionPlanStatus,
  reportedProgressPercent: number | null,
) => {
  const currentIndex = statusOrder.indexOf(current);
  return statusOrder.filter(
    (status, index) =>
      index >= currentIndex &&
      (status !== "CONCLUDED" || reportedProgressPercent === 100),
  );
};

export const getProgressReviewCapabilities = (
  item: ProgressEvaluationItem | null,
  canApprove: boolean,
  canReturn: boolean,
) => {
  const task = item?.reviewTask;
  const canDecide =
    item?.reviewStatus === "SENT_TO_AUDIT" && Boolean(task?.canAct);
  const canApproveItem =
    canDecide &&
    canApprove &&
    Boolean(task?.allowedActions.includes("APPROVE"));
  const returnAction: "REQUEST_CORRECTION" | "REJECT" =
    task?.allowedActions.includes("REQUEST_CORRECTION")
      ? "REQUEST_CORRECTION"
      : "REJECT";
  const canReturnItem =
    canDecide &&
    canReturn &&
    Boolean(task?.allowedActions.includes(returnAction));

  return { canApproveItem, canDecide, canReturnItem, returnAction };
};

type DecisionAction = "approve" | "return";

type DecisionInput = {
  action: DecisionAction;
  comment: string;
  id: string;
  status: ActionPlanStatus;
  task: ProgressEvaluationItem["reviewTask"];
};

export function useProgressReviewDecision({
  canApprove,
  canReturn,
  item,
  onDecision,
}: {
  canApprove: boolean;
  canReturn: boolean;
  item: ProgressEvaluationItem | null;
  onDecision?: (input: {
    action: DecisionAction;
    id: string;
  }) => void | Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ActionPlanStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const capabilities = getProgressReviewCapabilities(
    item,
    canApprove,
    canReturn,
  );
  const decisionStatus =
    selectedStatus ?? item?.officialStatus ?? "NOT_STARTED";

  const reset = () => {
    setComment("");
    setSelectedStatus(null);
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: async (input: DecisionInput) => {
      if (input.task?.id) {
        if (input.action === "approve") {
          return workflowRuntimeService.actOnTask(input.task.id, "approve", {
            ...(input.comment.trim() ? { comment: input.comment.trim() } : {}),
          });
        }
        const endpoint = input.task.allowedActions.includes(
          "REQUEST_CORRECTION",
        )
          ? "request-correction"
          : "reject";
        return workflowRuntimeService.actOnTask(input.task.id, endpoint, {
          comment: input.comment.trim(),
        });
      }

      return progressService.reviewProgressEvaluation(input.id, input.action, {
        comment: input.comment.trim() || null,
        officialStatus: input.status,
      });
    },
    onError: (cause) => {
      const message = getApiErrorMessage(cause);
      setError(message);
      toast.error(message);
    },
    onSuccess: async (_, variables) => {
      toast.success(
        variables.action === "approve"
          ? "Avance aprobado."
          : "Avance devuelto.",
      );
      reset();
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.progressEvaluations,
        }),
        queryClient.invalidateQueries({
          queryKey: ["progress-evaluation", variables.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["action-plan"] }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.observations }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workflowTasks }),
      ]);
      await onDecision?.({ action: variables.action, id: variables.id });
    },
  });

  const decide = (action: DecisionAction) => {
    if (!item) return;
    if (action === "return" && !comment.trim()) {
      setError("Escriba un comentario para devolver el avance.");
      return;
    }
    if (
      !window.confirm(
        `¿Confirma ${action === "approve" ? "aprobar" : "devolver"} este avance?`,
      )
    )
      return;
    setError(null);
    mutation.mutate({
      action,
      comment,
      id: item.id,
      status: decisionStatus,
      task: item.reviewTask,
    });
  };

  return {
    ...capabilities,
    comment,
    decisionStatus,
    decide,
    error,
    isProcessing: mutation.isPending,
    reset,
    setComment,
    setSelectedStatus,
  };
}

export function ProgressReviewDecisionPanel({
  canApprove,
  canReturn,
  comment,
  compact = false,
  error,
  isProcessing,
  item,
  onApprove,
  onCommentChange,
  onReturn,
  onStatusChange,
  selectedStatus,
}: {
  canApprove: boolean;
  canReturn: boolean;
  comment: string;
  compact?: boolean;
  error: string | null;
  isProcessing: boolean;
  item: ProgressEvaluationItem;
  onApprove: () => void;
  onCommentChange: (value: string) => void;
  onReturn: () => void;
  onStatusChange: (status: ActionPlanStatus) => void;
  selectedStatus: ActionPlanStatus;
}) {
  const { canApproveItem, canReturnItem, returnAction } =
    getProgressReviewCapabilities(item, canApprove, canReturn);
  const validStatuses = getValidProgressStatusOptions(
    item.officialStatus,
    item.reportedProgressPercent,
  );
  const commentId = `progress-decision-comment-${item.id}`;

  return canApproveItem || canReturnItem ? (
    <div
      className={`${compact ? "mt-4 border-t border-sky-200 pt-4" : "mt-6 border-t border-stone-200 pt-5"}`}
    >
      <label className="grid gap-2 text-sm font-semibold" htmlFor={commentId}>
        Comentario de decisión
        <textarea
          className={`nibol-field resize-y py-3 ${compact ? "min-h-20" : "min-h-24"}`}
          disabled={isProcessing}
          id={commentId}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder="Opcional al aprobar; obligatorio al devolver o rechazar."
          value={comment}
        />
      </label>
      {canApproveItem && !item.reviewTask?.id ? (
        <label
          className={`${compact ? "mt-3" : "mt-4"} grid max-w-xs gap-2 text-sm font-semibold`}
        >
          Cambiar estado oficial
          <select
            className="nibol-field h-12"
            disabled={isProcessing}
            onChange={(event) =>
              onStatusChange(event.target.value as ActionPlanStatus)
            }
            value={selectedStatus}
          >
            {validStatuses.map((status) => (
              <option key={status} value={status}>
                {getActionPlanStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className={`${compact ? "mt-3" : "mt-4"} flex flex-wrap gap-2`}>
        {canApproveItem ? (
          <button
            className="nibol-btn-primary px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isProcessing}
            onClick={onApprove}
            type="button"
          >
            <Check className="h-4 w-4" />{" "}
            {isProcessing ? "Procesando…" : "Aprobar"}
          </button>
        ) : null}
        {canReturnItem ? (
          <button
            className="nibol-btn-secondary px-4 py-2.5 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isProcessing}
            onClick={onReturn}
            type="button"
          >
            <RotateCcw className="h-4 w-4" />{" "}
            {returnAction === "REQUEST_CORRECTION" ? "Devolver" : "Rechazar"}
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-stone-500">
        El estado se cambia únicamente al aprobar y solo dentro de las
        transiciones válidas.
      </p>
      {error ? (
        <p
          className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  ) : item.reviewStatus === "SENT_TO_AUDIT" ? (
    <p
      className={`${compact ? "mt-4 border-t border-sky-200 pt-4" : "mt-5 border-t border-stone-200 pt-5"} text-sm text-stone-500`}
    >
      Este avance está pendiente, pero no tiene una tarea de decisión asignada a
      este usuario.
    </p>
  ) : null;
}
