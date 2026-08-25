"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileText,
  History,
  MessageSquare,
  Pencil,
  RotateCcw,
  Send,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { extensionRequestService } from "@/services/extension-request-service";
import { observationService } from "@/services/observation-service";
import { progressService } from "@/services/progress-service";
import { remediationService } from "@/services/remediation-service";
import type {
  ActionPlanEvidenceItem,
  ExtensionRequestDetail,
  ProgressEvaluationItem,
} from "@/types";
import { cn, getApiErrorMessage } from "@/utils";

import {
  ActionPlanEditor,
  type ActionPlanEditorValues,
} from "./action-plan-editor";
import {
  formatRemediationDate,
  getActionPlanStatusClasses,
} from "./presentation";
import {
  formatFileSize,
  formatProgressDate,
  getProgressStatusClasses,
  getProgressStatusLabel,
  getProgressTypeClasses,
  getProgressTypeLabel,
} from "../progress/presentation";

const extensionStatusLabels: Record<ExtensionRequestDetail["status"], string> =
  {
    AUDIT_APPROVED: "Aprobada por Auditoría",
    AUDIT_REJECTED: "Rechazada por Auditoría",
    CANCELLED: "Cancelada",
    DRAFT: "Borrador",
    MANAGER_APPROVED: "Aprobada por Gerencia",
    MANAGER_REJECTED: "Rechazada por Gerencia",
    SENT_TO_AUDIT: "Pendiente de Auditoría",
    SENT_TO_MANAGER: "Pendiente de Gerencia",
  };

const evidenceStatusLabels: Record<
  ActionPlanEvidenceItem["reviewStatus"],
  string
> = {
  APPROVED: "Aprobado",
  DRAFT: "Sin enviar",
  PENDING: "En revisión",
  REJECTED: "Rechazado",
  RETURNED: "Con observaciones",
};

const evidenceStatusClasses: Record<
  ActionPlanEvidenceItem["reviewStatus"],
  string
> = {
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  DRAFT: "border-stone-200 bg-stone-50 text-stone-700",
  PENDING: "border-sky-200 bg-sky-50 text-sky-800",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-800",
  RETURNED: "border-amber-200 bg-amber-50 text-amber-900",
};

const isPendingExtension = (status: ExtensionRequestDetail["status"]) =>
  status === "SENT_TO_MANAGER" || status === "SENT_TO_AUDIT";

const getFileKind = (mimeType: string) => {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLS";
  if (mimeType.includes("word")) return "DOC";
  if (mimeType.startsWith("image/")) return "IMG";
  return "FILE";
};

function DocumentRow({
  file,
  onDownload,
}: {
  file: ActionPlanEvidenceItem | ProgressEvaluationItem["evidence"][number];
  onDownload: (file: { downloadPath: string; originalName: string }) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-stone-200 bg-stone-50 text-[0.62rem] font-bold tracking-wide text-stone-600">
          {getFileKind(file.mimeType)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-950">
            {file.originalName}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {formatFileSize(file.sizeBytes)} ·{" "}
            {formatProgressDate(file.createdAt, false)}
            {file.description ? ` · ${file.description}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex border px-2.5 py-1 text-[0.62rem] font-bold tracking-wide uppercase",
            evidenceStatusClasses[file.reviewStatus],
          )}
        >
          {evidenceStatusLabels[file.reviewStatus]}
        </span>
        <button
          aria-label={`Descargar ${file.originalName}`}
          className="nibol-btn-secondary px-2.5 py-2 text-xs"
          onClick={() => onDownload(file)}
          title="Descargar documento"
          type="button"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function ApprovalActions({
  isPending,
  onAction,
}: {
  isPending: boolean;
  onAction: (action: "approve" | "return" | "reject") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="nibol-btn-primary px-3 py-2 text-xs"
        disabled={isPending}
        onClick={() => onAction("approve")}
        type="button"
      >
        <Check className="h-3.5 w-3.5" />
        Aprobar
      </button>
      <button
        className="nibol-btn-secondary px-3 py-2 text-xs"
        disabled={isPending}
        onClick={() => onAction("return")}
        type="button"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Devolver
      </button>
      <button
        className="nibol-btn-secondary px-3 py-2 text-xs text-rose-700"
        disabled={isPending}
        onClick={() => onAction("reject")}
        type="button"
      >
        <X className="h-3.5 w-3.5" />
        Rechazar
      </button>
    </div>
  );
}

export function ActionPlanDetailView({
  canEdit,
  canManageExtensions,
  canViewExtensions,
  canReviewProgress,
  actionPlanId,
  initialEditing = false,
}: {
  canEdit: boolean;
  canManageExtensions: boolean;
  canViewExtensions: boolean;
  canReviewProgress: boolean;
  actionPlanId: string;
  initialEditing?: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(canEdit && initialEditing);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const planQuery = useQuery({
    queryFn: () => remediationService.getActionPlan(actionPlanId),
    queryKey: ["action-plan", actionPlanId],
  });
  const evaluationsQuery = useQuery({
    queryFn: () =>
      progressService.listProgressEvaluations(
        `?filter.actionPlanId=${encodeURIComponent(actionPlanId)}&perPage=100`,
      ),
    queryKey: ["progress-evaluations", "action-plan", actionPlanId],
  });
  const plan = planQuery.data;
  const observationQuery = useQuery({
    enabled: Boolean(plan && editing),
    queryFn: () => observationService.getObservationById(plan!.observation.id),
    queryKey: plan
      ? QUERY_KEYS.observationDetails(plan.observation.id)
      : ["action-plan", actionPlanId, "observation"],
  });
  const optionsQuery = useQuery({
    enabled: Boolean(plan && editing),
    queryFn: observationService.getObservationOptions,
    queryKey: QUERY_KEYS.observationOptions,
  });
  const commentsQuery = useQuery({
    enabled: Boolean(plan),
    queryFn: () => progressService.getComments(plan!.observation.id),
    queryKey: ["observation-comments", plan?.observation.id],
  });
  const extensionsQuery = useQuery({
    enabled: Boolean(plan && canViewExtensions),
    queryFn: () =>
      extensionRequestService.list(
        `?filter.actionPlanId=${encodeURIComponent(actionPlanId)}&perPage=100`,
      ),
    queryKey: ["extension-requests", "action-plan", actionPlanId],
  });

  const refresh = async () => {
    if (!plan) return;
    await Promise.all([
      planQuery.refetch(),
      evaluationsQuery.refetch(),
      commentsQuery.refetch(),
      canViewExtensions ? extensionsQuery.refetch() : Promise.resolve(),
      queryClient.invalidateQueries({ queryKey: ["action-plans"] }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observationDetails(plan.observation.id),
      }),
    ]);
  };
  const update = useMutation({
    mutationFn: (input: ActionPlanEditorValues) =>
      remediationService.updateActionPlan(actionPlanId, input),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setEditing(false);
      setError(null);
      await refresh();
    },
  });
  const review = useMutation({
    mutationFn: async ({
      action,
      id,
    }: {
      action: "approve" | "return" | "reject";
      id: string;
    }) => {
      const reviewComment =
        action === "approve"
          ? undefined
          : (window.prompt("Comentario de revisión") ?? "Revisión requerida");
      return progressService.reviewProgressEvaluation(id, action, {
        comment: reviewComment,
      });
    },
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setError(null);
      await refresh();
    },
  });
  const reviewExtension = useMutation({
    mutationFn: async ({
      action,
      id,
    }: {
      action:
        "auditApprove" | "auditReject" | "managerApprove" | "managerReject";
      id: string;
    }) => {
      const reviewComment = action.endsWith("Reject")
        ? (window.prompt("Motivo del rechazo") ?? "Rechazado")
        : undefined;
      if (action === "auditApprove")
        return extensionRequestService.auditApprove(id);
      if (action === "auditReject")
        return extensionRequestService.auditReject(id, {
          comment: reviewComment,
        });
      if (action === "managerApprove")
        return extensionRequestService.managerApprove(id);
      return extensionRequestService.managerReject(id, {
        comment: reviewComment,
      });
    },
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setError(null);
      await refresh();
    },
  });
  const addComment = useMutation({
    mutationFn: () => {
      if (!plan || !comment.trim()) throw new Error("Escriba un comentario.");
      return progressService.createComment(plan.observation.id, {
        actionPlanId,
        body: comment.trim(),
        visibility: "AREA_VISIBLE",
      });
    },
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setComment("");
      setError(null);
      await commentsQuery.refetch();
    },
  });
  const download = useMutation({
    mutationFn: (file: { downloadPath: string; originalName: string }) =>
      progressService.downloadEvidence(file),
    onError: (cause) => setError(getApiErrorMessage(cause)),
  });

  const evaluations = evaluationsQuery.data?.data ?? [];
  const pendingEvaluations = evaluations.filter(
    (item) => item.reviewStatus === "SENT_TO_AUDIT",
  );
  const extensions = extensionsQuery.data?.data ?? [];
  const pendingExtensions = extensions.filter((item) =>
    isPendingExtension(item.status),
  );
  const pendingCount = pendingEvaluations.length + pendingExtensions.length;
  const comments = useMemo(
    () =>
      (commentsQuery.data ?? []).filter(
        (item) => item.actionPlanId === actionPlanId,
      ),
    [actionPlanId, commentsQuery.data],
  );
  const planEvidence = plan?.evidence ?? [];

  if (planQuery.isError) {
    return (
      <ErrorState
        description={getApiErrorMessage(planQuery.error)}
        title="No fue posible cargar el plan"
      />
    );
  }
  if (!plan)
    return (
      <section className="nibol-panel p-6 text-sm text-stone-500">
        Cargando plan de acción…
      </section>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="nibol-btn-secondary px-4 py-2.5 text-sm"
          href={`/observaciones/${plan.observation.id}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la observación
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {pendingCount ? (
            <span className="nibol-badge-accent px-3 py-2">
              {pendingCount} {pendingCount === 1 ? "pendiente" : "pendientes"}
            </span>
          ) : null}
          {canEdit ? (
            <button
              className="nibol-btn-secondary px-3 py-2 text-sm"
              onClick={() => {
                setError(null);
                setEditing((value) => !value);
              }}
              type="button"
            >
              <Pencil className="h-4 w-4" />
              {editing ? "Cerrar edición" : "Editar plan"}
            </button>
          ) : null}
          <span
            className={cn(
              "inline-flex border px-3 py-2 text-xs font-bold tracking-wide uppercase",
              getActionPlanStatusClasses(
                plan.isOverdue ? "OVERDUE" : plan.status,
              ),
            )}
          >
            {plan.isOverdue ? "Vencido" : plan.statusLabel}
          </span>
        </div>
      </div>

      <section className="nibol-panel overflow-hidden">
        <div className="bg-stone-950 p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-amber-400 uppercase">
                {plan.observation.displayCode} · {plan.area.name}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Plan de acción
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-300">
                {plan.description}
              </p>
            </div>
            <div className="min-w-36 border border-white/15 bg-white/5 p-4">
              <p className="text-xs tracking-wider text-stone-400 uppercase">
                Avance actual
              </p>
              <p className="mt-1 text-3xl font-semibold">
                {plan.progressPercent}%
              </p>
            </div>
          </div>
          <div
            aria-label={`Avance ${plan.progressPercent}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={plan.progressPercent}
            className="mt-7 h-2 bg-white/15"
            role="progressbar"
          >
            <div
              className="h-full bg-red-600 transition-[width] duration-500"
              style={{ width: `${plan.progressPercent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-stone-400">
            <span>Inicio del seguimiento</span>
            <span>{plan.progressEvaluationCount} evaluaciones registradas</span>
          </div>
        </div>
        <div className="grid gap-px bg-stone-200 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Ejecutor", plan.responsibleUser.name],
            ["Estado", plan.statusLabel],
            ["Fecha original", formatRemediationDate(plan.originalDueDate)],
            ["Fecha actual", formatRemediationDate(plan.currentDueDate)],
            ["Documentos", `${plan.evidenceCount} asociados`],
          ].map(([label, value]) => (
            <div className="bg-white p-5" key={label}>
              <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                {label}
              </p>
              <p className="mt-2 font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {editing ? (
        observationQuery.data && optionsQuery.data ? (
          <ActionPlanEditor
            areas={observationQuery.data.areas}
            error={error}
            initial={{
              description: plan.description,
              dueDate: plan.currentDueDate,
              observationAreaId: plan.observationAreaId,
              responsibleUserId: plan.responsibleUser.id,
            }}
            isSaving={update.isPending}
            key={`${plan.id}-${plan.updatedAt}`}
            onCancel={() => {
              setEditing(false);
              setError(null);
            }}
            onSubmit={(input) => update.mutate(input)}
            users={optionsQuery.data.users}
          />
        ) : (
          <section className="nibol-panel p-5 text-sm text-stone-500">
            Cargando opciones de edición…
          </section>
        )
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          <section className="nibol-panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <ClipboardCheck className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <p className="nibol-eyebrow">Seguimiento</p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Historial de avances
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Cada evaluación conserva su comentario, documentos y
                    decisión de Auditoría.
                  </p>
                </div>
              </div>
              {pendingEvaluations.length ? (
                <span className="nibol-badge-accent px-3 py-2">
                  {pendingEvaluations.length} por revisar
                </span>
              ) : null}
            </div>

            <div className="mt-6 space-y-4">
              {evaluations.map((item) => (
                <article
                  className="border border-stone-200 bg-stone-50/60 p-5"
                  key={item.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-2xl font-semibold text-stone-950">
                          {item.progressPercent}%
                        </span>
                        <span
                          className={cn(
                            "inline-flex border px-2.5 py-1 text-[0.62rem] font-bold tracking-wide uppercase",
                            getProgressTypeClasses(item.type),
                          )}
                        >
                          {getProgressTypeLabel(item.type)}
                        </span>
                        <span
                          className={cn(
                            "inline-flex border px-2.5 py-1 text-[0.62rem] font-bold tracking-wide uppercase",
                            getProgressStatusClasses(item.reviewStatus),
                          )}
                        >
                          {getProgressStatusLabel(item.reviewStatus)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-stone-500">
                        Registrado por {item.submittedByUser.name} ·{" "}
                        {formatProgressDate(item.submittedAt)}
                      </p>
                    </div>
                    <div className="text-right text-xs text-stone-500">
                      <p className="font-semibold text-stone-700">
                        {item.actionPlanStatus.replaceAll("_", " ")}
                      </p>
                      {item.reviewedAt ? (
                        <p className="mt-1">
                          Revisado {formatProgressDate(item.reviewedAt, false)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 bg-stone-200">
                    <div
                      className="h-full bg-stone-950"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-4 text-sm leading-7 whitespace-pre-wrap text-stone-700">
                    {item.comment}
                  </p>
                  {item.reviewComment ? (
                    <p className="mt-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                      <strong>Comentario de revisión:</strong>{" "}
                      {item.reviewComment}
                    </p>
                  ) : null}
                  {item.evidence.length ? (
                    <div className="mt-4 border-t border-stone-200 pt-3">
                      <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                        Documentos de esta evaluación ({item.evidence.length})
                      </p>
                      <div className="mt-1 divide-y divide-stone-200">
                        {item.evidence.map((file) => (
                          <DocumentRow
                            file={file}
                            key={file.id}
                            onDownload={(value) => download.mutate(value)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {item.history.length ? (
                    <details className="group mt-4 border-t border-stone-200 pt-3">
                      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold tracking-wide text-stone-600 uppercase">
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                        Ver historial de revisión
                      </summary>
                      <div className="mt-3 space-y-2 pl-6">
                        {item.history.map((history) => (
                          <div
                            className="text-xs text-stone-500"
                            key={history.id}
                          >
                            <span className="font-semibold text-stone-700">
                              {history.user.name}
                            </span>{" "}
                            · {history.action} ·{" "}
                            {formatProgressDate(history.createdAt)}
                            {history.comment ? ` · ${history.comment}` : ""}
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : null}
                  {item.reviewStatus === "SENT_TO_AUDIT" ? (
                    <div className="mt-5 border-t border-stone-200 pt-4">
                      {canReviewProgress ? (
                        <ApprovalActions
                          isPending={review.isPending}
                          onAction={(action) =>
                            review.mutate({ action, id: item.id })
                          }
                        />
                      ) : (
                        <p className="text-xs font-semibold tracking-wide text-sky-800 uppercase">
                          Pendiente de revisión de Auditoría
                        </p>
                      )}
                    </div>
                  ) : null}
                </article>
              ))}
              {evaluationsQuery.isLoading ? (
                <p className="border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
                  Cargando historial de avances…
                </p>
              ) : null}
              {!evaluationsQuery.isLoading && !evaluations.length ? (
                <p className="border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
                  Aún no hay avances registrados para este plan.
                </p>
              ) : null}
            </div>
          </section>

          <section className="nibol-panel p-6">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="nibol-eyebrow">Repositorio del plan</p>
                <h2 className="mt-2 text-xl font-semibold">
                  Documentos asociados
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Evidencia cargada directamente al plan, disponible para
                  consulta y descarga.
                </p>
              </div>
            </div>
            <div className="mt-5">
              {planEvidence.length ? (
                <div className="divide-y divide-stone-200">
                  {planEvidence.map((file) => (
                    <DocumentRow
                      file={file}
                      key={file.id}
                      onDownload={(value) => download.mutate(value)}
                    />
                  ))}
                </div>
              ) : (
                <p className="border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
                  No hay documentos asociados directamente al plan.
                </p>
              )}
            </div>
          </section>

          <section className="nibol-panel p-6">
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="nibol-eyebrow">Colaboración</p>
                <h2 className="mt-2 text-xl font-semibold">
                  Comentarios del plan
                </h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {comments.map((item) => (
                <div
                  className="border-b border-stone-200 pb-3 last:border-b-0"
                  key={item.id}
                >
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-stone-500">
                    <span className="font-semibold text-stone-700">
                      {item.authorUser.name}
                    </span>
                    <span>{formatProgressDate(item.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-stone-700">
                    {item.body}
                  </p>
                </div>
              ))}
              {!commentsQuery.isLoading && !comments.length ? (
                <p className="text-sm text-stone-500">
                  Todavía no hay comentarios en este plan.
                </p>
              ) : null}
            </div>
            <form
              className="mt-5 border-t border-stone-200 pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                addComment.mutate();
              }}
            >
              <label
                className="grid gap-2 text-sm font-semibold"
                htmlFor="action-plan-comment"
              >
                Agregar comentario
                <textarea
                  className="nibol-field min-h-24 resize-y py-3"
                  id="action-plan-comment"
                  placeholder="Comparta una actualización o una observación…"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </label>
              <div className="mt-3 flex justify-end">
                <button
                  className="nibol-btn-secondary px-4 py-2.5 text-sm"
                  disabled={addComment.isPending || !comment.trim()}
                  type="submit"
                >
                  <Send className="h-4 w-4" />
                  {addComment.isPending ? "Guardando…" : "Publicar comentario"}
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="nibol-panel p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="nibol-eyebrow">Bandeja contextual</p>
                <h2 className="mt-2 text-xl font-semibold">Aprobaciones</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Resuelva aquí las decisiones relacionadas con este plan.
                </p>
              </div>
            </div>
            {pendingCount ? (
              <div className="mt-5 space-y-3">
                {pendingEvaluations.map((item) => (
                  <div
                    className="border border-sky-200 bg-sky-50 p-4"
                    key={`approval-${item.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold tracking-wider text-sky-800 uppercase">
                          Avance por revisar
                        </p>
                        <p className="mt-1 font-semibold text-stone-950">
                          {item.progressPercent}% ·{" "}
                          {getProgressTypeLabel(item.type)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-sky-800">
                        {formatProgressDate(item.submittedAt, false)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-stone-600">
                      {item.submittedByUser.name}: {item.comment}
                    </p>
                    {canReviewProgress ? (
                      <div className="mt-3">
                        <ApprovalActions
                          isPending={review.isPending}
                          onAction={(action) =>
                            review.mutate({ action, id: item.id })
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
                {pendingExtensions.map((item) => (
                  <div
                    className="border border-amber-200 bg-amber-50 p-4"
                    key={`extension-${item.id}`}
                  >
                    <p className="text-xs font-semibold tracking-wider text-amber-900 uppercase">
                      Ampliación de plazo
                    </p>
                    <p className="mt-1 font-semibold text-stone-950">
                      +{item.impactDays} días ·{" "}
                      {extensionStatusLabels[item.status]}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-stone-600">
                      {item.reason}
                    </p>
                    {canManageExtensions ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="nibol-btn-primary px-3 py-2 text-xs"
                          disabled={reviewExtension.isPending}
                          onClick={() =>
                            reviewExtension.mutate({
                              action:
                                item.status === "SENT_TO_AUDIT"
                                  ? "auditApprove"
                                  : "managerApprove",
                              id: item.id,
                            })
                          }
                          type="button"
                        >
                          <Check className="h-3.5 w-3.5" /> Aprobar
                        </button>
                        <button
                          className="nibol-btn-secondary px-3 py-2 text-xs text-rose-700"
                          disabled={reviewExtension.isPending}
                          onClick={() =>
                            reviewExtension.mutate({
                              action:
                                item.status === "SENT_TO_AUDIT"
                                  ? "auditReject"
                                  : "managerReject",
                              id: item.id,
                            })
                          }
                          type="button"
                        >
                          <X className="h-3.5 w-3.5" /> Rechazar
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Todo al día
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  No hay avances ni solicitudes de plazo pendientes.
                </p>
              </div>
            )}
          </section>

          <section className="nibol-panel p-5">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="nibol-eyebrow">Responsabilidad</p>
                <h2 className="mt-2 font-semibold">Personas a cargo</h2>
              </div>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-stone-500">Ejecutor</dt>
                <dd className="mt-1 font-semibold">
                  {plan.responsibleUser.name}
                </dd>
                <dd className="text-xs text-stone-500">
                  {plan.responsibleUser.jobTitle ?? plan.responsibleUser.email}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">Dueño del proceso</dt>
                <dd className="mt-1 font-semibold">{plan.processOwner.name}</dd>
                <dd className="text-xs text-stone-500">
                  {plan.processOwner.jobTitle ?? plan.processOwner.email}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">Responsable del área</dt>
                <dd className="mt-1 font-semibold">
                  {plan.areaResponsible.name}
                </dd>
                <dd className="text-xs text-stone-500">
                  {plan.areaResponsible.jobTitle ?? plan.areaResponsible.email}
                </dd>
              </div>
            </dl>
          </section>

          <section className="nibol-panel p-5">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="nibol-eyebrow">Plazo</p>
                <h2 className="mt-2 font-semibold">Fechas del plan</h2>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-stone-500">Original</dt>
                <dd className="mt-1 font-semibold">
                  {formatRemediationDate(plan.originalDueDate)}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">Actual</dt>
                <dd className="mt-1 font-semibold">
                  {formatRemediationDate(plan.currentDueDate)}
                </dd>
              </div>
            </dl>
            <p
              className={cn(
                "mt-5 text-sm leading-6",
                plan.isOverdue ? "text-rose-700" : "text-stone-500",
              )}
            >
              {plan.isOverdue
                ? "El plan está vencido y requiere atención."
                : "El plan se encuentra dentro del plazo actual."}
            </p>
          </section>

          {extensions.length ? (
            <section className="nibol-panel p-5">
              <div className="flex items-start gap-3">
                <History className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <p className="nibol-eyebrow">Historial de plazo</p>
                  <h2 className="mt-2 font-semibold">
                    Solicitudes de ampliación
                  </h2>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {extensions.map((item) => (
                  <Link
                    className="block border-b border-stone-200 pb-3 last:border-b-0"
                    href={`/ampliaciones-plazo/${item.id}`}
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold">
                        +{item.impactDays} días
                      </p>
                      <span className="text-[0.62rem] font-bold tracking-wide text-stone-500 uppercase">
                        {extensionStatusLabels[item.status]}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-stone-500">
                      {item.reason}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      {error ? (
        <p
          aria-live="assertive"
          className="border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
