"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, RotateCcw, Send, X } from "lucide-react";
import Link from "next/link";

import { extensionRequestService } from "@/services/extension-request-service";
import { getApiErrorMessage } from "@/utils";

export function ExtensionRequestDetail({ requestId }: { requestId: string }) {
  const queryClient = useQueryClient();
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
    ]);
  };
  const action = useMutation({
    mutationFn: async (
      kind:
        | "submit"
        | "managerApprove"
        | "managerReject"
        | "auditApprove"
        | "auditReject"
        | "cancel",
    ) => {
      const comment = kind.endsWith("Reject")
        ? (window.prompt("Motivo del rechazo") ?? "Rechazado")
        : undefined;
      if (kind === "submit")
        return extensionRequestService.sendToManager(requestId);
      if (kind === "managerApprove")
        return extensionRequestService.managerApprove(requestId);
      if (kind === "managerReject")
        return extensionRequestService.managerReject(requestId, { comment });
      if (kind === "auditApprove")
        return extensionRequestService.auditApprove(requestId);
      if (kind === "auditReject")
        return extensionRequestService.auditReject(requestId, { comment });
      return extensionRequestService.cancel(requestId);
    },
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: refresh,
  });
  const request = query.data;
  if (!request)
    return (
      <section className="nibol-panel p-6 text-sm text-stone-500">
        Cargando solicitud…
      </section>
    );
  const observationHref = request.observation
    ? `/observaciones/${request.observation.id}`
    : "/observaciones";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="nibol-btn-secondary px-4 py-2.5 text-sm"
          href="/ampliaciones-plazo"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <span className="nibol-badge">
          {request.status.replaceAll("_", " ")}
        </span>
      </div>
      <section className="nibol-panel overflow-hidden">
        <div className="border-b border-stone-200 bg-stone-950 p-6 text-white">
          <p className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
            {request.targetType === "ACTION_PLAN"
              ? "Plan de acción"
              : "Observación"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {request.targetType === "ACTION_PLAN"
              ? "Plan de acción"
              : (request.observation?.displayCode ?? "Solicitud de ampliación")}
          </h2>
          <Link
            className="mt-2 inline-block text-sm text-stone-300 hover:text-white"
            href={observationHref}
          >
            {request.observation?.title ?? "Ver observación relacionada"}
          </Link>
        </div>
        <div className="grid gap-px bg-stone-200 sm:grid-cols-4">
          <div className="bg-white p-5">
            <p className="text-xs tracking-wider text-stone-500 uppercase">
              Fecha anterior
            </p>
            <p className="mt-2 font-semibold">
              {request.previousDueDate.slice(0, 10)}
            </p>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs tracking-wider text-stone-500 uppercase">
              Fecha propuesta
            </p>
            <p className="mt-2 font-semibold">
              {request.proposedDueDate.slice(0, 10)}
            </p>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs tracking-wider text-stone-500 uppercase">
              Impacto
            </p>
            <p className="mt-2 font-semibold">+{request.impactDays} días</p>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs tracking-wider text-stone-500 uppercase">
              Solicitante
            </p>
            <p className="mt-2 font-semibold">{request.requestedByUser.name}</p>
          </div>
        </div>
      </section>
      <section className="nibol-panel p-6">
        <h3 className="text-lg font-semibold">Justificación</h3>
        <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-stone-700">
          {request.reason}
        </p>
        {request.observationArea ? (
          <div className="mt-5 rounded-xl bg-stone-50 p-4 text-sm">
            <strong>{request.observationArea.area.name}</strong>
            <p className="mt-1 text-stone-500">
              Dueño del proceso: {request.observationArea.processOwner.name} ·
              Responsable: {request.observationArea.areaResponsible.name}
            </p>
          </div>
        ) : null}
      </section>
      <section className="nibol-panel p-6">
        <h3 className="text-lg font-semibold">Decisiones y flujo</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-stone-200 p-4">
            <p className="text-xs tracking-wider text-stone-500 uppercase">
              Gerencia
            </p>
            <p className="mt-2 text-sm">
              {request.managerComment ??
                (request.managerReviewedAt ? "Revisado" : "Pendiente")}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 p-4">
            <p className="text-xs tracking-wider text-stone-500 uppercase">
              Auditoría
            </p>
            <p className="mt-2 text-sm">
              {request.auditComment ??
                (request.auditReviewedAt ? "Revisado" : "Pendiente")}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {["DRAFT", "MANAGER_REJECTED", "AUDIT_REJECTED"].includes(
            request.status,
          ) ? (
            <button
              className="nibol-btn-primary px-4 py-2 text-sm"
              onClick={() => action.mutate("submit")}
              type="button"
            >
              <Send className="h-4 w-4" />
              Enviar a aprobación
            </button>
          ) : null}
          {request.status === "SENT_TO_MANAGER" ? (
            <>
              <button
                className="nibol-btn-primary px-4 py-2 text-sm"
                onClick={() => action.mutate("managerApprove")}
                type="button"
              >
                <Check className="h-4 w-4" />
                Aprobar como Gerencia
              </button>
              <button
                className="nibol-btn-secondary px-4 py-2 text-sm"
                onClick={() => action.mutate("managerReject")}
                type="button"
              >
                <RotateCcw className="h-4 w-4" />
                Rechazar
              </button>
            </>
          ) : null}
          {request.status === "SENT_TO_AUDIT" ? (
            <>
              <button
                className="nibol-btn-primary px-4 py-2 text-sm"
                onClick={() => action.mutate("auditApprove")}
                type="button"
              >
                <Check className="h-4 w-4" />
                Aprobar como Auditoría
              </button>
              <button
                className="nibol-btn-secondary px-4 py-2 text-sm"
                onClick={() => action.mutate("auditReject")}
                type="button"
              >
                <X className="h-4 w-4" />
                Rechazar
              </button>
            </>
          ) : null}
          {!request.finalApprovedAt && request.status !== "CANCELLED" ? (
            <button
              className="nibol-btn-secondary px-4 py-2 text-sm text-rose-700"
              onClick={() => action.mutate("cancel")}
              type="button"
            >
              Cancelar solicitud
            </button>
          ) : null}
        </div>
      </section>
      {error ? (
        <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
