"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { extensionRequestService } from "@/services/extension-request-service";
import type { ExtensionRequestDetail } from "@/types";
import { getApiErrorMessage } from "@/utils";

export function ExtensionRequestSubmit({
  request,
  canRequest,
  currentUserId,
  isAdmin = false,
}: {
  request: ExtensionRequestDetail;
  canRequest: boolean;
  currentUserId: string;
  isAdmin?: boolean;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const submit = useMutation({
    mutationFn: () => extensionRequestService.sendToManager(request.id),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setError(null);
      toast.success("Solicitud enviada a revisión.");
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["extension-request", request.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["extension-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["action-plan"] }),
      ]);
    },
  });
  if (
    !canRequest ||
    !["DRAFT", "MANAGER_REJECTED"].includes(request.status) ||
    (!isAdmin &&
      (request.requestedByUser.id !== currentUserId ||
        (request.actionPlan &&
          request.actionPlan.responsibleUser.id !== currentUserId)))
  )
    return null;
  return (
    <section className="nibol-panel mt-4 space-y-3 p-5">
      <p className="text-sm font-semibold">
        {request.status === "DRAFT"
          ? "Solicitud en borrador"
          : "Solicitud devuelta para corrección"}
      </p>
      <p className="text-sm text-stone-500">
        La solicitud está guardada y aún no fue enviada. Puede reintentar el
        envío sobre esta misma solicitud.
      </p>
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          No se pudo confirmar el envío: {error}
        </p>
      ) : null}
      <button
        className="nibol-btn-primary px-4 py-2.5 text-sm disabled:opacity-60"
        disabled={submit.isPending}
        onClick={() => submit.mutate()}
        type="button"
      >
        <Send className="h-4 w-4" /> Enviar a revisión
      </button>
    </section>
  );
}
