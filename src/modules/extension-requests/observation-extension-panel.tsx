"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Send } from "lucide-react";
import Link from "next/link";

import { extensionRequestService } from "@/services/extension-request-service";
import { getApiErrorMessage } from "@/utils";

export function ObservationExtensionPanel({
  observationId,
}: {
  observationId: string;
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [proposedDueDate, setProposedDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
    queryFn: () =>
      extensionRequestService.list(
        `?filter.observationId=${encodeURIComponent(observationId)}&perPage=100`,
      ),
    queryKey: ["extension-requests", observationId],
  });
  const create = useMutation({
    mutationFn: async (submit: boolean) => {
      const record = await extensionRequestService.createForObservation(
        observationId,
        { proposedDueDate, reason },
      );
      return submit ? extensionRequestService.sendToManager(record.id) : record;
    },
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setShowForm(false);
      setReason("");
      setProposedDueDate("");
      await queryClient.invalidateQueries({
        queryKey: ["extension-requests", observationId],
      });
    },
  });
  return (
    <section className="nibol-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-700 uppercase">
            Control de fechas
          </p>
          <h3 className="mt-2 text-2xl font-semibold">
            Solicitudes de ampliación
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Una aprobación modifica solo la fecha actual; la fecha original
            permanece intacta.
          </p>
        </div>
        <button
          className="nibol-btn-secondary px-4 py-2.5 text-sm"
          onClick={() => setShowForm((value) => !value)}
          type="button"
        >
          <CalendarPlus className="h-4 w-4" />
          Solicitar ampliación
        </button>
      </div>
      {showForm ? (
        <form
          className="mt-5 grid gap-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:grid-cols-[220px_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(true);
          }}
        >
          <label className="space-y-2 text-sm font-semibold">
            Nueva fecha
            <input
              className="nibol-field"
              min={new Date().toISOString().slice(0, 10)}
              required
              type="date"
              value={proposedDueDate}
              onChange={(event) => setProposedDueDate(event.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm font-semibold">
            Justificación
            <input
              className="nibol-field"
              minLength={3}
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              className="nibol-btn-secondary px-3 py-2.5 text-sm"
              onClick={() => create.mutate(false)}
              type="button"
            >
              Guardar borrador
            </button>
            <button
              className="nibol-btn-primary px-3 py-2.5 text-sm"
              type="submit"
            >
              <Send className="h-4 w-4" />
              Enviar
            </button>
          </div>
        </form>
      ) : null}
      <div className="mt-5 space-y-3">
        {query.data?.data.map((request) => (
          <Link
            className="grid gap-3 rounded-xl border border-stone-200 p-4 transition hover:border-amber-300 sm:grid-cols-[1fr_auto_auto] sm:items-center"
            href={`/ampliaciones-plazo/${request.id}`}
            key={request.id}
          >
            <div>
              <p className="font-semibold">
                {request.targetType === "ACTION_PLAN"
                  ? request.actionPlan?.title
                  : request.observation?.displayCode}
              </p>
              <p className="mt-1 line-clamp-1 text-sm text-stone-500">
                {request.reason}
              </p>
            </div>
            <div className="text-sm">
              <span className="text-stone-500">
                {request.previousDueDate.slice(0, 10)}
              </span>{" "}
              → <strong>{request.proposedDueDate.slice(0, 10)}</strong>
            </div>
            <span className="nibol-badge">
              {request.status.replaceAll("_", " ")}
            </span>
          </Link>
        ))}
      </div>
      {error ? (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
