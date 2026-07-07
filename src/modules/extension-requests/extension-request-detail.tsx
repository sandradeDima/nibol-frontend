"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  CheckCheck,
  FileDown,
  Save,
  Send,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { extensionRequestService } from "@/services/extension-request-service";
import { progressService } from "@/services/progress-service";
import { cn, getApiErrorMessage } from "@/utils";

import { formatObservationDate, getRiskLevelClasses } from "../observations/presentation";
import {
  formatExtensionRequestDate,
  getExtensionRequestStatusClasses,
  getExtensionRequestStatusLabel,
  getFlowTone,
} from "./presentation";

type ExtensionRequestDetailProps = {
  requestId: string;
};

const editableStatuses = new Set(["DRAFT", "MANAGER_REJECTED", "AUDIT_REJECTED"]);

export function ExtensionRequestDetail({ requestId }: ExtensionRequestDetailProps) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [decisionComment, setDecisionComment] = useState("");
  const [requestedDueDate, setRequestedDueDate] = useState("");
  const [reason, setReason] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);

  const detailQuery = useQuery({
    queryFn: () => extensionRequestService.getById(requestId),
    queryKey: QUERY_KEYS.extensionRequestDetails(requestId),
  });

  useEffect(() => {
    const detail = detailQuery.data;

    if (!detail) {
      return;
    }

    setRequestedDueDate(detail.requestedDueDate.slice(0, 10));
    setReason(detail.reason);
    setAttachmentIds(detail.attachments.map((attachment) => attachment.id));
    setSelectedFiles([]);
    setDecisionComment("");
  }, [detailQuery.data?.id, detailQuery.data?.updatedAt]);

  const invalidateRelatedQueries = async (observationId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.extensionRequests,
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.extensionRequestDetails(requestId),
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observationDetails(observationId),
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observations,
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.commitmentSchedule,
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.remediationPlans,
      }),
    ]);
  };

  const actionMutation = useMutation({
    mutationFn: async (action: "audit-approve" | "audit-reject" | "cancel" | "manager-approve" | "manager-reject" | "save" | "send") => {
      const detail = detailQuery.data;

      if (!detail) {
        throw new Error("La solicitud aún no está disponible.");
      }

      if (action === "save") {
        let nextAttachmentIds = attachmentIds;

        if (selectedFiles.length > 0) {
          const uploadedEvidence = await progressService.uploadObservationEvidence(
            detail.observation.id,
            selectedFiles,
            "Respaldo de ampliacion de plazo",
          );
          nextAttachmentIds = [
            ...new Set([...attachmentIds, ...uploadedEvidence.map((item) => item.id)]),
          ];
        }

        return extensionRequestService.update(requestId, {
          evidenceFileIds: nextAttachmentIds,
          reason,
          requestedDueDate,
        });
      }

      if (action === "send") {
        return detail.nextSubmissionTarget === "manager"
          ? extensionRequestService.sendToManager(requestId)
          : extensionRequestService.sendToAudit(requestId);
      }

      if (action === "manager-approve") {
        return extensionRequestService.managerApprove(requestId, {
          comment: decisionComment.trim() || null,
        });
      }

      if (action === "manager-reject") {
        return extensionRequestService.managerReject(requestId, {
          comment: decisionComment.trim(),
        });
      }

      if (action === "audit-approve") {
        return extensionRequestService.auditApprove(requestId, {
          comment: decisionComment.trim() || null,
        });
      }

      if (action === "audit-reject") {
        return extensionRequestService.auditReject(requestId, {
          comment: decisionComment.trim(),
        });
      }

      return extensionRequestService.cancel(requestId);
    },
    onError: (error) => {
      setActionSuccess(null);
      setActionError(getApiErrorMessage(error));
    },
    onSuccess: async (detail, action) => {
      setActionError(null);
      setActionSuccess(
        action === "save"
          ? "La solicitud fue actualizada."
          : action === "send"
            ? "La solicitud fue enviada correctamente."
            : action === "cancel"
              ? "La solicitud fue cancelada."
              : action === "manager-approve" || action === "audit-approve"
                ? "La solicitud fue aprobada."
                : "La solicitud fue rechazada.",
      );
      setCancelOpen(false);
      setDecisionComment("");
      setSelectedFiles([]);
      await invalidateRelatedQueries(detail.observation.id);
    },
  });

  if (detailQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void detailQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={detailQuery.error.message}
        title="No fue posible cargar esta ampliación"
      />
    );
  }

  const detail = detailQuery.data;

  if (!detail) {
    return (
      <section className="nibol-panel p-6 text-sm text-stone-600">
        Cargando detalle de la ampliación...
      </section>
    );
  }

  const canEditPayload = detail.canEdit && editableStatuses.has(detail.status);
  const flowState = {
    audit:
      detail.status === "AUDIT_REJECTED"
        ? "rejected"
        : detail.auditReviewedAt
          ? "done"
          : detail.status === "SENT_TO_AUDIT"
            ? "pending"
            : "idle",
    final:
      detail.status === "AUDIT_APPROVED" || detail.status === "MANAGER_APPROVED"
        ? "done"
        : detail.status === "CANCELLED"
          ? "rejected"
          : "idle",
    manager:
      detail.status === "MANAGER_REJECTED"
        ? "rejected"
        : detail.managerReviewedAt
          ? "done"
          : detail.status === "SENT_TO_MANAGER"
            ? "pending"
            : "idle",
  } as const;

  return (
    <div className="space-y-6">
      <section className="nibol-panel p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                {detail.observation.code}
              </p>
              <h2 className="max-w-4xl text-3xl font-semibold tracking-tight text-stone-950">
                {detail.observation.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                  getRiskLevelClasses(detail.observation.riskLevel.colorToken),
                )}
              >
                {detail.observation.riskLevel.name}
              </span>
              <span
                className={cn(
                  "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                  getExtensionRequestStatusClasses(detail.status),
                )}
              >
                {getExtensionRequestStatusLabel(detail.status)}
              </span>
              {detail.commitment ? (
                <span className="inline-flex items-center border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-700">
                  Compromiso: {detail.commitment.title}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="nibol-btn-secondary px-4 py-2.5 text-sm" href="/ampliaciones-plazo">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            {detail.canSend ? (
              <button
                className="nibol-btn-primary px-4 py-2.5 text-sm"
                disabled={actionMutation.isPending}
                onClick={async () => {
                  await actionMutation.mutateAsync("send");
                }}
                type="button"
              >
                <Send className="h-4 w-4" />
                Enviar solicitud
              </button>
            ) : null}
            {detail.canCancel ? (
              <button
                className="nibol-btn-secondary px-4 py-2.5 text-sm text-rose-700"
                onClick={() => {
                  setCancelOpen(true);
                }}
                type="button"
              >
                <XCircle className="h-4 w-4" />
                Cancelar
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="nibol-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Fecha actual
          </p>
          <p className="mt-3 text-xl font-semibold text-stone-950">
            {formatExtensionRequestDate(detail.currentDueDate)}
          </p>
        </article>

        <article className="nibol-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Nueva fecha solicitada
          </p>
          <p className="mt-3 text-xl font-semibold text-stone-950">
            {formatExtensionRequestDate(detail.requestedDueDate)}
          </p>
        </article>

        <article className="nibol-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Impacto en plazo
          </p>
          <p className="mt-3 text-xl font-semibold text-stone-950">
            +{detail.impactDays} días
          </p>
        </article>

        <article className="nibol-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Última actualización
          </p>
          <p className="mt-3 text-xl font-semibold text-stone-950">
            {formatObservationDate(detail.updatedAt, {
              timeStyle: "short",
            })}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <section className="nibol-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Sustento de reprogramación
            </p>
            {canEditPayload ? (
              <div className="mt-5 space-y-4">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Nueva fecha propuesta
                  </span>
                  <input
                    className="nibol-field h-11 text-sm"
                    onChange={(event) => {
                      setRequestedDueDate(event.target.value);
                    }}
                    type="date"
                    value={requestedDueDate}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Sustento
                  </span>
                  <textarea
                    className="nibol-field min-h-[10rem] py-3 text-sm"
                    onChange={(event) => {
                      setReason(event.target.value);
                    }}
                    value={reason}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Adjuntar respaldo adicional
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
                <button
                  className="nibol-btn-secondary px-4 py-2.5 text-sm"
                  disabled={actionMutation.isPending}
                  onClick={async () => {
                    await actionMutation.mutateAsync("save");
                  }}
                  type="button"
                >
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-stone-700">{detail.reason}</p>
            )}
          </section>

          <section className="nibol-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Documentos de respaldo
            </p>
            <div className="mt-5 space-y-3">
              {detail.attachments.length > 0 ? (
                detail.attachments
                  .filter((attachment) =>
                    canEditPayload ? attachmentIds.includes(attachment.id) : true,
                  )
                  .map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-stone-950">
                          {attachment.originalName}
                        </p>
                        <p className="text-xs text-stone-500">
                          {attachment.uploadedByUser.name} ·{" "}
                          {formatExtensionRequestDate(attachment.createdAt, {
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {canEditPayload ? (
                          <button
                            className="nibol-btn-secondary px-3 py-2 text-sm text-rose-700"
                            onClick={() => {
                              setAttachmentIds((current) =>
                                current.filter((item) => item !== attachment.id),
                              );
                            }}
                            type="button"
                          >
                            Quitar
                          </button>
                        ) : null}
                        <button
                          className="nibol-btn-secondary px-3 py-2 text-sm"
                          onClick={async () => {
                            await progressService.downloadEvidence(attachment);
                          }}
                          type="button"
                        >
                          <FileDown className="h-4 w-4" />
                          Descargar
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-[var(--surface-soft)] px-4 py-4 text-sm text-stone-600">
                  No se adjuntaron respaldos a esta solicitud.
                </div>
              )}
            </div>
          </section>

          {detail.canManagerApprove ||
          detail.canManagerReject ||
          detail.canAuditApprove ||
          detail.canAuditReject ? (
            <section className="nibol-panel p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Comentario de decisión
              </p>
              <textarea
                className="nibol-field mt-5 min-h-[8rem] py-3 text-sm"
                onChange={(event) => {
                  setDecisionComment(event.target.value);
                }}
                placeholder="Registre el comentario que acompañará su decisión."
                value={decisionComment}
              />

              <div className="mt-5 flex flex-wrap gap-3">
                {detail.canManagerApprove ? (
                  <button
                    className="nibol-btn-primary px-4 py-2.5 text-sm"
                    disabled={actionMutation.isPending}
                    onClick={async () => {
                      await actionMutation.mutateAsync("manager-approve");
                    }}
                    type="button"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Aprobar como Gerencia
                  </button>
                ) : null}
                {detail.canManagerReject ? (
                  <button
                    className="nibol-btn-secondary px-4 py-2.5 text-sm text-rose-700"
                    disabled={actionMutation.isPending}
                    onClick={async () => {
                      await actionMutation.mutateAsync("manager-reject");
                    }}
                    type="button"
                  >
                    <XCircle className="h-4 w-4" />
                    Rechazar como Gerencia
                  </button>
                ) : null}
                {detail.canAuditApprove ? (
                  <button
                    className="nibol-btn-primary px-4 py-2.5 text-sm"
                    disabled={actionMutation.isPending}
                    onClick={async () => {
                      await actionMutation.mutateAsync("audit-approve");
                    }}
                    type="button"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Aprobar como Auditoría
                  </button>
                ) : null}
                {detail.canAuditReject ? (
                  <button
                    className="nibol-btn-secondary px-4 py-2.5 text-sm text-rose-700"
                    disabled={actionMutation.isPending}
                    onClick={async () => {
                      await actionMutation.mutateAsync("audit-reject");
                    }}
                    type="button"
                  >
                    <XCircle className="h-4 w-4" />
                    Rechazar como Auditoría
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}
        </section>

        <section className="space-y-6">
          <section className="nibol-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Flujo de aprobación
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Solicitud registrada
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-950">
                  {detail.requestedByUser.name}
                </p>
                <p className="text-sm text-stone-600">
                  {formatExtensionRequestDate(detail.createdAt, {
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <div
                className={cn(
                  "rounded-[1.2rem] border px-4 py-4",
                  getFlowTone(flowState.manager),
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Gerencia
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {detail.area.managerUser?.name ?? "Gerencia no asignada"}
                </p>
                <p className="text-sm">
                  {detail.managerReviewedAt
                    ? formatExtensionRequestDate(detail.managerReviewedAt, {
                        timeStyle: "short",
                      })
                    : detail.status === "SENT_TO_MANAGER"
                      ? "Pendiente de revisión"
                      : "Sin acción registrada"}
                </p>
              </div>

              <div
                className={cn(
                  "rounded-[1.2rem] border px-4 py-4",
                  getFlowTone(flowState.audit),
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Auditoría
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {detail.observation.auditorUser.name}
                </p>
                <p className="text-sm">
                  {detail.auditReviewedAt
                    ? formatExtensionRequestDate(detail.auditReviewedAt, {
                        timeStyle: "short",
                      })
                    : detail.status === "SENT_TO_AUDIT"
                      ? "Pendiente de revisión"
                      : "Sin acción registrada"}
                </p>
              </div>

              <div
                className={cn(
                  "rounded-[1.2rem] border px-4 py-4",
                  getFlowTone(flowState.final),
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Resultado final
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {detail.finalApprovedAt
                    ? "Fecha límite actualizada"
                    : detail.status === "CANCELLED"
                      ? "Solicitud cancelada"
                      : "Pendiente"}
                </p>
                <p className="text-sm">
                  {detail.finalApprovedAt
                    ? formatExtensionRequestDate(detail.finalApprovedAt, {
                        timeStyle: "short",
                      })
                    : "Sin cierre definitivo"}
                </p>
              </div>
            </div>
          </section>

          <section className="nibol-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Comentarios de decisión
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Comentario de Gerencia
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-700">
                  {detail.managerComment || "Sin comentario registrado."}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Comentario de Auditoría
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-700">
                  {detail.auditComment || "Sin comentario registrado."}
                </p>
              </div>
            </div>
          </section>

          <section className="nibol-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Responsables y control
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-[0.9rem] bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Solicitante
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950">
                      {detail.requestedByUser.name}
                    </p>
                    <p className="text-sm text-stone-600">{detail.requestedByUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-[0.9rem] bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Área originadora
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950">
                      {detail.area.name}
                    </p>
                    <p className="text-sm text-stone-600">
                      Responsable principal: {detail.observation.responsibleUser?.name ?? "Sin asignación"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {actionError ? (
            <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
          {actionSuccess ? (
            <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {actionSuccess}
            </div>
          ) : null}
        </section>
      </section>

      <ConfirmDialog
        confirmLabel="Cancelar solicitud"
        description="La solicitud saldrá del circuito de aprobación y conservará trazabilidad en los logs."
        isLoading={actionMutation.isPending}
        onConfirm={() => {
          void actionMutation.mutateAsync("cancel");
        }}
        onOpenChange={setCancelOpen}
        open={cancelOpen}
        title="¿Cancelar solicitud?"
        tone="danger"
      />
    </div>
  );
}
