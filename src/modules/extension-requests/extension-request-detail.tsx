"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { extensionRequestService } from "@/services/extension-request-service";
import { progressService } from "@/services/progress-service";
import { getApiErrorMessage } from "@/utils";

import { ExtensionRequestReviewDetail } from "./extension-request-review-workspace";
import { ExtensionRequestSubmit } from "./extension-request-submit";

export function ExtensionRequestDetail({
  canApprove,
  canReject,
  canRequest,
  currentUserId,
  requestId,
  isAdmin = false,
}: {
  canApprove: boolean;
  canReject: boolean;
  canRequest: boolean;
  currentUserId: string;
  requestId: string;
  isAdmin?: boolean;
}) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
    queryFn: () => extensionRequestService.getById(requestId),
    queryKey: ["extension-request", requestId],
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["extension-request", requestId],
      }),
      queryClient.invalidateQueries({ queryKey: ["extension-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["action-plan"] }),
    ]);
  };
  const action = useMutation({
    mutationFn: async (kind: "approve" | "reject" | "cancel") => {
      if (kind === "cancel") return extensionRequestService.cancel(requestId);
      if (kind === "reject")
        return extensionRequestService.managerReject(requestId, {
          comment: comment.trim(),
        });
      return extensionRequestService.managerApprove(requestId, {
        comment: comment.trim() || null,
      });
    },
    onError: (cause) => {
      const message = getApiErrorMessage(cause);
      setError(message);
      toast.error(message);
    },
    onSuccess: async (_, variables) => {
      setError(null);
      setComment("");
      toast.success(
        variables === "approve"
          ? "Solicitud aprobada."
          : variables === "reject"
            ? "Solicitud rechazada."
            : "Solicitud actualizada.",
      );
      await refresh();
    },
  });
  const download = useMutation({
    mutationFn: (file: { downloadPath: string; originalName: string }) =>
      progressService.downloadEvidence(file),
    onError: (cause) => toast.error(getApiErrorMessage(cause)),
  });
  const request = query.data;

  if (!request)
    return (
      <section className="nibol-panel p-6 text-sm text-stone-500">
        Cargando solicitud…
      </section>
    );

  const isOwner = request.requestedByUser.id === currentUserId;
  const decide = (kind: "approve" | "reject") => {
    if (kind === "reject" && !comment.trim()) {
      setError("Escriba un comentario para rechazar la solicitud.");
      return;
    }
    if (
      !window.confirm(
        `¿Confirma ${kind === "approve" ? "aprobar" : "rechazar"} esta solicitud?`,
      )
    )
      return;
    action.mutate(kind);
  };

  return (
    <div className="space-y-5">
      <Link
        className="nibol-btn-secondary px-4 py-2.5 text-sm"
        href="/ampliaciones-plazo"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a ampliaciones
      </Link>
      <ExtensionRequestReviewDetail
        canApprove={canApprove}
        canReject={canReject}
        comment={comment}
        error={error}
        isProcessing={action.isPending || download.isPending}
        onApprove={() => decide("approve")}
        onCommentChange={setComment}
        onDownload={(file) => download.mutate(file)}
        onReject={() => decide("reject")}
        request={request}
      />
      <ExtensionRequestSubmit
        request={request}
        canRequest={canRequest}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
      {canRequest &&
      isOwner &&
      request.status !== "CANCELLED" &&
      !request.finalApprovedAt ? (
        <button
          className="nibol-btn-secondary px-4 py-2.5 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={action.isPending}
          onClick={() => {
            if (window.confirm("¿Confirma cancelar esta solicitud?"))
              action.mutate("cancel");
          }}
          type="button"
        >
          Cancelar solicitud
        </button>
      ) : null}
    </div>
  );
}
