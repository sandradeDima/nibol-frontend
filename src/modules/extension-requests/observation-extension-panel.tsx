"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus2, FileUp, Send } from "lucide-react";

import { FormDialog } from "@/components/ui/form-dialog";
import { QUERY_KEYS } from "@/lib/constants";
import { extensionRequestService } from "@/services/extension-request-service";
import { progressService } from "@/services/progress-service";
import { getApiErrorMessage } from "@/utils";
import { cn } from "@/utils";

import {
  formatExtensionRequestDate,
  getExtensionRequestStatusClasses,
  getExtensionRequestStatusLabel,
} from "./presentation";

type ObservationExtensionPanelProps = {
  observationId: string;
};

const activeStatuses = new Set([
  "DRAFT",
  "SENT_TO_MANAGER",
  "SENT_TO_AUDIT",
]);

export function ObservationExtensionPanel({
  observationId,
}: ObservationExtensionPanelProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    requestedDueDate: "",
    reason: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const requestsQuery = useQuery({
    queryFn: async () => {
      return extensionRequestService.list(
        `?filter.observationId=${encodeURIComponent(observationId)}&perPage=20&sortBy=updatedAt&sortDirection=desc`,
      );
    },
    queryKey: [...QUERY_KEYS.extensionRequests, "observation", observationId],
  });

  const currentRequest = useMemo(() => {
    const rows = requestsQuery.data?.data ?? [];

    return (
      rows.find((row) => activeStatuses.has(row.status)) ??
      rows.find((row) =>
        ["MANAGER_REJECTED", "AUDIT_REJECTED"].includes(row.status),
      ) ??
      rows[0] ??
      null
    );
  }, [requestsQuery.data?.data]);

  const createMutation = useMutation({
    mutationFn: async (mode: "draft" | "send") => {
      const created = await extensionRequestService.createForObservation(observationId, {
        reason: formState.reason,
        requestedDueDate: formState.requestedDueDate,
      });

      let current = created;

      if (selectedFiles.length > 0) {
        const uploadedEvidence = await progressService.uploadObservationEvidence(
          observationId,
          selectedFiles,
          "Respaldo de ampliacion de plazo",
        );

        current = await extensionRequestService.update(created.id, {
          evidenceFileIds: uploadedEvidence.map((evidence) => evidence.id),
        });
      }

      if (mode === "send") {
        current =
          current.nextSubmissionTarget === "manager"
            ? await extensionRequestService.sendToManager(current.id)
            : await extensionRequestService.sendToAudit(current.id);
      }

      return current;
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setDialogOpen(false);
      setFormError(null);
      setSelectedFiles([]);
      setFormState({
        requestedDueDate: "",
        reason: "",
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.extensionRequests,
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.observationDetails(observationId),
        }),
      ]);
    },
  });

  return (
    <>
      <section className="nibol-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Ampliación de plazo
            </p>
            <p className="text-sm leading-7 text-stone-600">
              Registre reprogramaciones con sustento y trazabilidad para revisión de
              Gerencia y Auditoría.
            </p>
          </div>

          {!currentRequest || !activeStatuses.has(currentRequest.status) ? (
            <button
              className="nibol-btn-primary px-4 py-2.5 text-sm"
              onClick={() => {
                setDialogOpen(true);
              }}
              type="button"
            >
              <CalendarPlus2 className="h-4 w-4" />
              Solicitar ampliación
            </button>
          ) : null}
        </div>

        {requestsQuery.isLoading ? (
          <div className="mt-5 rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4 text-sm text-stone-600">
            Cargando solicitudes de ampliación...
          </div>
        ) : null}

        {requestsQuery.isError ? (
          <div className="mt-5 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {requestsQuery.error.message}
          </div>
        ) : null}

        {!requestsQuery.isLoading && !requestsQuery.isError ? (
          currentRequest ? (
            <div className="mt-5 rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                        getExtensionRequestStatusClasses(currentRequest.status),
                      )}
                    >
                      {getExtensionRequestStatusLabel(currentRequest.status)}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                      {currentRequest.commitment
                        ? `Compromiso: ${currentRequest.commitment.title}`
                        : "Nivel observación"}
                    </span>
                  </div>
                  <p className="text-sm text-stone-700">
                    Fecha actual: {formatExtensionRequestDate(currentRequest.currentDueDate)}
                  </p>
                  <p className="text-sm text-stone-700">
                    Nueva fecha propuesta: {formatExtensionRequestDate(currentRequest.requestedDueDate)}
                  </p>
                </div>

                <Link
                  className="nibol-btn-secondary px-4 py-2.5 text-sm"
                  href={`/ampliaciones-plazo/${currentRequest.id}`}
                >
                  Ver detalle
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.2rem] border border-dashed border-stone-300 bg-[var(--surface-soft)] px-4 py-4 text-sm text-stone-600">
              No hay solicitudes registradas para esta observación.
            </div>
          )
        ) : null}
      </section>

      <FormDialog
        description="Defina la nueva fecha comprometida, explique la reprogramación y adjunte respaldo opcional para dejar la solicitud lista."
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              className="nibol-btn-secondary justify-center px-4 py-2.5 text-sm"
              onClick={() => {
                setDialogOpen(false);
              }}
              type="button"
            >
              Cerrar
            </button>
            <button
              className="nibol-btn-secondary justify-center px-4 py-2.5 text-sm"
              disabled={createMutation.isPending}
              onClick={async () => {
                await createMutation.mutateAsync("draft");
              }}
              type="button"
            >
              <FileUp className="h-4 w-4" />
              Guardar borrador
            </button>
            <button
              className="nibol-btn-primary justify-center px-4 py-2.5 text-sm"
              disabled={createMutation.isPending}
              onClick={async () => {
                await createMutation.mutateAsync("send");
              }}
              type="button"
            >
              <Send className="h-4 w-4" />
              Enviar solicitud
            </button>
          </div>
        }
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        title="Solicitar ampliación"
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Nueva fecha
              </span>
              <input
                className="nibol-field h-11 text-sm"
                onChange={(event) => {
                  setFormState((current) => ({
                    ...current,
                    requestedDueDate: event.target.value,
                  }));
                }}
                type="date"
                value={formState.requestedDueDate}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Archivos de respaldo
              </span>
              <input
                className="nibol-field h-11 pt-2.5 text-sm"
                multiple
                onChange={(event) => {
                  setSelectedFiles(Array.from(event.target.files ?? []));
                }}
                type="file"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Sustento de reprogramación
            </span>
            <textarea
              className="nibol-field min-h-[9rem] py-3 text-sm"
              onChange={(event) => {
                setFormState((current) => ({
                  ...current,
                  reason: event.target.value,
                }));
              }}
              value={formState.reason}
            />
          </label>

          {selectedFiles.length > 0 ? (
            <div className="rounded-[1.2rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              {selectedFiles.length} archivo(s) listos para adjuntar.
            </div>
          ) : null}

          {formError ? (
            <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}
        </div>
      </FormDialog>
    </>
  );
}
