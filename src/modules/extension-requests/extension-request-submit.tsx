"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Save, Send } from "lucide-react";
import { toast } from "sonner";

import { extensionRequestService } from "@/services/extension-request-service";
import { progressService } from "@/services/progress-service";
import type {
  ExtensionRequestDetail,
  UpdateExtensionRequestInput,
} from "@/types";
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
  const [proposedDueDate, setProposedDueDate] = useState(
    request.proposedDueDate.slice(0, 10),
  );
  const [reason, setReason] = useState(request.reason);
  const [savedDueDate, setSavedDueDate] = useState(
    request.proposedDueDate.slice(0, 10),
  );
  const [savedReason, setSavedReason] = useState(request.reason);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedEvidence, setUploadedEvidence] = useState<
    Array<{ id: string; originalName: string }>
  >([]);
  const refresh = async () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["extension-request", request.id],
      }),
      queryClient.invalidateQueries({ queryKey: ["extension-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["action-plan"] }),
    ]);
  const submit = useMutation({
    mutationFn: () => extensionRequestService.sendToManager(request.id),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setError(null);
      toast.success("Solicitud enviada a revisión.");
    },
    onSettled: async () => refresh(),
  });
  const save = useMutation({
    mutationFn: async () => {
      if (reason.trim().length < 3)
        throw new Error("La justificación debe tener al menos 3 caracteres.");
      if (!proposedDueDate)
        throw new Error("Seleccione una nueva fecha solicitada.");

      let evidence = uploadedEvidence;
      if (files.length) {
        if (evidence.length + files.length > 10)
          throw new Error("Puede adjuntar hasta 10 documentos por corrección.");
        const uploadPath = request.actionPlan
          ? `/action-plans/${request.actionPlan.id}/evidence`
          : request.observation
            ? `/observations/${request.observation.id}/evidence`
            : null;
        if (!uploadPath)
          throw new Error("No se encontró la observación de esta solicitud.");
        const uploaded = await progressService.uploadEvidence(
          uploadPath,
          files,
          request.actionPlan ? "ACTION_PLAN" : "FINDING",
        );
        evidence = [...evidence, ...uploaded];
        setUploadedEvidence(evidence);
        setFiles([]);
      }

      const input: UpdateExtensionRequestInput = {};
      if (proposedDueDate !== savedDueDate)
        input.proposedDueDate = proposedDueDate;
      if (reason.trim() !== savedReason) input.reason = reason.trim();
      if (evidence.length)
        input.evidenceFileIds = evidence.map((file) => file.id);
      if (Object.keys(input).length === 0)
        throw new Error("No hay correcciones para guardar.");

      const updated = await extensionRequestService.update(request.id, input);
      setUploadedEvidence([]);
      return updated;
    },
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async (updated) => {
      setSavedDueDate(updated.proposedDueDate.slice(0, 10));
      setSavedReason(updated.reason);
      setError(null);
      toast.success(
        "Correcciones guardadas. Puede enviar la solicitud a revisión.",
      );
    },
    onSettled: async () => refresh(),
  });
  const isBusy = submit.isPending || save.isPending;
  if (
    !canRequest ||
    !["DRAFT", "MANAGER_REJECTED"].includes(request.status) ||
    (!isAdmin &&
      (request.requestedByUser.id !== currentUserId ||
        (request.actionPlan &&
          request.actionPlan.responsibleUser.id !== currentUserId)))
  )
    return null;

  const changedFields =
    proposedDueDate !== savedDueDate ||
    reason.trim() !== savedReason ||
    files.length > 0 ||
    uploadedEvidence.length > 0;
  const rejected =
    request.status === "MANAGER_REJECTED" || Boolean(request.managerComment);
  const maximumDate = request.classification
    ? (() => {
        const date = new Date(request.previousDueDate);
        date.setUTCDate(
          date.getUTCDate() + request.classification.maxAdditionalDays,
        );
        return date.toISOString().slice(0, 10);
      })()
    : undefined;
  const minimumDate = (() => {
    const date = new Date(
      Math.max(Date.parse(request.previousDueDate), Date.now()),
    );
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  })();

  return (
    <section className="nibol-panel mt-4 space-y-4 p-5">
      <div>
        <p className="text-sm font-semibold">
          {rejected
            ? "Solicitud devuelta para corrección"
            : "Solicitud en borrador"}
        </p>
        <p className="mt-2 text-sm text-stone-500">
          La solicitud está guardada y aún no fue enviada. Puede reintentar el
          envío sobre esta misma solicitud.
        </p>
      </div>
      {rejected ? (
        <div className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
          <p className="font-semibold">Motivo</p>
          <p className="mt-1 whitespace-pre-wrap">
            {request.managerComment ?? "El revisor no dejó un comentario."}
          </p>
        </div>
      ) : null}
      <div className="space-y-3 border-t border-stone-200 pt-4">
        <p className="text-sm font-semibold">Corregir solicitud</p>
        <label className="grid gap-1 text-sm font-semibold">
          Nueva fecha solicitada
          <input
            className="nibol-field"
            disabled={isBusy}
            max={maximumDate}
            min={minimumDate}
            onChange={(event) => {
              setError(null);
              setProposedDueDate(event.target.value);
            }}
            type="date"
            value={proposedDueDate}
          />
          {maximumDate ? (
            <span className="text-xs font-normal text-stone-500">
              Fecha máxima permitida: {maximumDate}
            </span>
          ) : null}
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Justificación
          <textarea
            className="nibol-field min-h-20 py-2"
            disabled={isBusy}
            onChange={(event) => {
              setError(null);
              setReason(event.target.value);
            }}
            value={reason}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Adjuntar documentos de sustento
          <input
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            className="nibol-field py-2 text-sm"
            disabled={isBusy}
            multiple
            onChange={(event) => {
              const selected = Array.from(event.currentTarget.files ?? []);
              if (
                files.length + uploadedEvidence.length + selected.length >
                10
              ) {
                setError("Puede adjuntar hasta 10 documentos por corrección.");
                event.currentTarget.value = "";
                return;
              }
              setError(null);
              setFiles((current) => [...current, ...selected]);
              event.currentTarget.value = "";
            }}
            type="file"
          />
        </label>
        {files.length || uploadedEvidence.length ? (
          <ul className="space-y-1 text-xs text-stone-600">
            {[...uploadedEvidence, ...files].map((file, index) => {
              const fileName = "name" in file ? file.name : file.originalName;
              return (
                <li
                  className="flex items-center gap-2"
                  key={`${fileName}-${index}`}
                >
                  <Paperclip className="h-3.5 w-3.5 shrink-0" />
                  {fileName}
                </li>
              );
            })}
          </ul>
        ) : null}
        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            No se pudo completar la acción: {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            className="nibol-btn-secondary px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBusy || !changedFields}
            onClick={() => save.mutate()}
            type="button"
          >
            <Save className="h-4 w-4" />
            {save.isPending ? "Guardando…" : "Guardar correcciones"}
          </button>
          <button
            className="nibol-btn-primary px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBusy || changedFields}
            onClick={() => submit.mutate()}
            type="button"
          >
            <Send className="h-4 w-4" />
            {submit.isPending ? "Enviando…" : "Enviar a revisión"}
          </button>
        </div>
        {changedFields ? (
          <p className="text-xs text-stone-500">
            Guarde las correcciones antes de enviar la solicitud.
          </p>
        ) : null}
      </div>
    </section>
  );
}
