"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  History,
  MessageSquare,
  Pencil,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QUERY_KEYS } from "@/lib/constants";
import { buildObservationUrl } from "@/lib/observation-links";
import { extensionRequestService } from "@/services/extension-request-service";
import { observationService } from "@/services/observation-service";
import { progressService } from "@/services/progress-service";
import { remediationService } from "@/services/remediation-service";
import type { ExtensionRequestDetail, ProgressEvaluationItem } from "@/types";
import { cn, getApiErrorMessage } from "@/utils";

import {
  ActionPlanEditor,
  type ActionPlanEditorValues,
} from "./action-plan-editor";
import {
  formatRemediationDate,
  getActionPlanStatusClasses,
  getActionPlanStatusLabel,
} from "./presentation";
import {
  formatFileSize,
  formatProgressDate,
  getProgressStatusClasses,
  getProgressStatusLabel,
  getProgressTypeClasses,
  getProgressTypeLabel,
} from "../progress/presentation";
import {
  ProgressReviewDecisionPanel,
  useProgressReviewDecision,
} from "../progress/progress-review-decision";

const extensionStatusLabels: Record<ExtensionRequestDetail["status"], string> =
  {
    CANCELLED: "Cancelada",
    DRAFT: "Borrador",
    MANAGER_APPROVED: "Aprobada por Gerencia",
    MANAGER_REJECTED: "Rechazada por Gerencia",
    SENT_TO_MANAGER: "Pendiente de Gerencia",
  };

const isPendingExtension = (status: ExtensionRequestDetail["status"]) =>
  status === "SENT_TO_MANAGER";

const getFileKind = (mimeType: string) => {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLS";
  if (mimeType.includes("word")) return "DOC";
  if (mimeType.startsWith("image/")) return "IMG";
  return "FILE";
};

function DocumentRow({
  canDownload,
  file,
  onDownload,
}: {
  canDownload: boolean;
  file: ProgressEvaluationItem["evidence"][number];
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
        {canDownload ? (
          <button
            aria-label={`Descargar ${file.originalName}`}
            className="nibol-btn-secondary px-2.5 py-2 text-xs"
            onClick={() => onDownload(file)}
            title="Descargar documento"
            type="button"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PendingAdvanceReviewCard({
  canApprove,
  canReturn,
  canViewWorkflowTasks,
  item,
  onChanged,
}: {
  canApprove: boolean;
  canReturn: boolean;
  canViewWorkflowTasks: boolean;
  item: ProgressEvaluationItem;
  onChanged: () => Promise<void>;
}) {
  const detailQuery = useQuery({
    queryFn: () => progressService.getProgressEvaluation(item.id),
    queryKey: ["progress-evaluation", item.id],
  });
  const decision = useProgressReviewDecision({
    canApprove,
    canReturn,
    item: detailQuery.data ?? null,
    onDecision: () => onChanged(),
  });

  return (
    <div className="border border-sky-200 bg-sky-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-sky-800 uppercase">
            Avance por revisar
          </p>
          <p className="mt-1 font-semibold text-stone-950">
            {item.reportedProgressPercent ?? 0}% reportado ·{" "}
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
      {detailQuery.isPending ? (
        <p className="mt-4 text-xs text-sky-800">Cargando acciones…</p>
      ) : detailQuery.isError ? (
        <p className="mt-4 text-xs text-rose-700" role="alert">
          {getApiErrorMessage(detailQuery.error)}
        </p>
      ) : detailQuery.data ? (
        <ProgressReviewDecisionPanel
          canApprove={canApprove}
          canReturn={canReturn}
          comment={decision.comment}
          compact
          error={decision.error}
          isProcessing={decision.isProcessing}
          item={detailQuery.data}
          onApprove={() => decision.decide("approve")}
          onCommentChange={decision.setComment}
          onReturn={() => decision.decide("return")}
          onStatusChange={decision.setSelectedStatus}
          selectedStatus={decision.decisionStatus}
        />
      ) : null}
      {canViewWorkflowTasks ? (
        <Link
          className="nibol-btn-secondary mt-3 px-3 py-2 text-xs"
          href="/aprobaciones/pendientes"
        >
          Abrir bandeja de aprobaciones
        </Link>
      ) : null}
    </div>
  );
}

export function ActionPlanDetailView({
  canApproveProgress,
  canDelete,
  canEdit,
  canRequestExtension,
  canReturnProgress,
  canUploadEvidence,
  canViewObservation,
  canViewExtensions,
  canViewWorkflowTasks,
  actionPlanId,
  currentUserId,
  initialEditing = false,
  isAdmin,
}: {
  canApproveProgress: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canRequestExtension: boolean;
  canReturnProgress: boolean;
  canUploadEvidence: boolean;
  canViewObservation: boolean;
  canViewExtensions: boolean;
  canViewWorkflowTasks: boolean;
  actionPlanId: string;
  currentUserId: string;
  initialEditing?: boolean;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [editing, setEditing] = useState(canEdit && initialEditing);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [extensionOpen, setExtensionOpen] = useState(
    searchParams.get("extension") === "1",
  );
  const [extensionClassification, setExtensionClassification] = useState("");
  const [extensionDate, setExtensionDate] = useState("");
  const [extensionReason, setExtensionReason] = useState("");
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
  const canRequestExtensionForPlan = Boolean(
    canRequestExtension &&
    plan &&
    (isAdmin || plan.responsibleUser.id === currentUserId),
  );
  const observationQuery = useQuery({
    enabled: Boolean(plan && editing),
    queryFn: () => observationService.getObservationById(plan!.observation.id),
    queryKey: plan
      ? QUERY_KEYS.observationDetails(plan.observation.id)
      : ["action-plan", actionPlanId, "observation"],
  });
  const executorOptionsQuery = useQuery({
    enabled: Boolean(plan && editing),
    queryFn: () =>
      remediationService.getActionPlanOptions(
        `?observationId=${encodeURIComponent(plan!.observation.id)}&observationAreaId=${encodeURIComponent(plan!.observationAreaId)}`,
      ),
    queryKey: [
      "action-plan-executor-options",
      plan?.observation.id,
      plan?.observationAreaId,
    ],
  });
  const commentsQuery = useQuery({
    enabled: Boolean(plan && canViewObservation),
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
  const classificationsQuery = useQuery({
    enabled: canRequestExtensionForPlan,
    queryFn: extensionRequestService.listClassifications,
    queryKey: ["deadline-extension-classifications"],
  });

  const refresh = async () => {
    if (!plan) return;
    await Promise.all([
      planQuery.refetch(),
      evaluationsQuery.refetch(),
      canViewObservation ? commentsQuery.refetch() : Promise.resolve(),
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
  const remove = useMutation({
    mutationFn: () => remediationService.deleteActionPlan(actionPlanId),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setConfirmDelete(false);
      await queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      window.location.assign("/planes-accion");
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
  const requestExtension = useMutation({
    mutationFn: async () => {
      if (!extensionClassification || !extensionDate || !extensionReason.trim())
        throw new Error("Complete la clasificación, fecha y justificación.");
      const request = await extensionRequestService.createForActionPlan(
        actionPlanId,
        {
          classificationCode: extensionClassification,
          proposedDueDate: extensionDate,
          reason: extensionReason.trim(),
        },
      );
      return extensionRequestService.sendToManager(request.id);
    },
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setExtensionOpen(false);
      setExtensionClassification("");
      setExtensionDate("");
      setExtensionReason("");
      setError(null);
      await refresh();
    },
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

  const selectedExtensionClass = classificationsQuery.data?.find(
    (item) => item.code === extensionClassification,
  );
  const maxExtensionDate = selectedExtensionClass
    ? (() => {
        const date = new Date(plan.effectiveDueDate);
        date.setUTCDate(
          date.getUTCDate() + selectedExtensionClass.maxAdditionalDays,
        );
        return date.toISOString().slice(0, 10);
      })()
    : "";

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="nibol-btn-secondary shrink-0 px-4 py-2.5 text-sm whitespace-nowrap"
          href={buildObservationUrl({
            observationId: plan.observation.id,
            planId: plan.id,
            tab: "plans",
          })}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la observación
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {canViewObservation && canUploadEvidence ? (
            <Link
              className="nibol-btn-primary shrink-0 px-3 py-2 text-sm whitespace-nowrap"
              href={`${buildObservationUrl({
                observationId: plan.observation.id,
                planId: plan.id,
                tab: "plans",
              })}#avances-evidencias`}
            >
              Subir evidencias
            </Link>
          ) : null}
          {pendingCount ? (
            <span className="nibol-badge-accent px-3 py-2">
              {pendingCount} {pendingCount === 1 ? "pendiente" : "pendientes"}
            </span>
          ) : null}
          {canEdit ? (
            <button
              className="nibol-btn-secondary shrink-0 px-3 py-2 text-sm whitespace-nowrap"
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
          {canDelete ? (
            <button
              className="nibol-btn-secondary shrink-0 px-3 py-2 text-sm whitespace-nowrap text-rose-700"
              onClick={() => setConfirmDelete(true)}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar plan
            </button>
          ) : null}
          <span
            className={cn(
              "inline-flex border px-3 py-2 text-xs font-bold tracking-wide uppercase",
              getActionPlanStatusClasses(plan.status),
            )}
          >
            {plan.statusLabel}
          </span>
        </div>
      </div>

      <div className="sticky top-0 z-10 -mx-4 bg-[var(--background)] pb-1 sm:-mx-6 lg:-mx-8">
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
                  Avance oficial
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
                className="h-full bg-white transition-[width] duration-500"
                style={{ width: `${plan.progressPercent}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-stone-400">
              <span>Inicio del seguimiento</span>
              <span>
                {plan.progressEvaluationCount} evaluaciones registradas
              </span>
            </div>
          </div>
          <div className="grid gap-px bg-stone-200 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Ejecutor", plan.responsibleUser.name],
              ["Estado", plan.statusLabel],
              [
                "Estado de plazo",
                plan.deadlineStatus === "VENCIDO" ? "Vencido" : "Vigente",
              ],
              ["Fecha original", formatRemediationDate(plan.originalDueDate)],
              ["Fecha efectiva", formatRemediationDate(plan.effectiveDueDate)],
              ["Reprogramado", plan.reprogrammed ? "Sí" : "No"],
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
      </div>

      {editing ? (
        observationQuery.data && executorOptionsQuery.data ? (
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
            users={[
              ...executorOptionsQuery.data.executorCandidates,
              ...(executorOptionsQuery.data.executorCandidates.some(
                (user) => user.id === plan.responsibleUser.id,
              )
                ? []
                : [plan.responsibleUser]),
            ]}
          />
        ) : (
          <section className="nibol-panel p-5 text-sm text-stone-500">
            Cargando opciones de edición…
          </section>
        )
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <div className="min-w-0 space-y-6">
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
                          {item.reportedProgressPercent ?? 0}% reportado
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
                        Estado oficial:{" "}
                        {getActionPlanStatusLabel(item.officialStatus)}
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
                      style={{ width: `${item.reportedProgressPercent ?? 0}%` }}
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
                            canDownload={canViewObservation}
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
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-semibold tracking-wide text-sky-800 uppercase">
                          Pendiente de revisión de Auditoría
                        </p>
                        {canViewWorkflowTasks ? (
                          <Link
                            className="nibol-btn-secondary px-3 py-2 text-xs"
                            href="/aprobaciones/pendientes"
                          >
                            Abrir bandeja
                          </Link>
                        ) : null}
                      </div>
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

          {canViewObservation ? (
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
                    {addComment.isPending
                      ? "Guardando…"
                      : "Publicar comentario"}
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-6">
          <section className="nibol-panel p-5" id="plazo">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="nibol-eyebrow">Bandeja contextual</p>
                <h2 className="mt-2 text-xl font-semibold">Aprobaciones</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Consulte el estado y resuelva los pendientes en la bandeja
                  central.
                </p>
              </div>
            </div>
            {pendingCount ? (
              <div className="mt-5 space-y-3">
                {pendingEvaluations.map((item) => (
                  <PendingAdvanceReviewCard
                    canApprove={canApproveProgress}
                    canReturn={canReturnProgress}
                    canViewWorkflowTasks={canViewWorkflowTasks}
                    key={`approval-${item.id}`}
                    item={item}
                    onChanged={refresh}
                  />
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
                    {canViewWorkflowTasks ? (
                      <Link
                        className="nibol-btn-secondary mt-3 px-3 py-2 text-xs"
                        href="/aprobaciones/pendientes"
                      >
                        Abrir bandeja de aprobaciones
                      </Link>
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
                  {formatRemediationDate(plan.effectiveDueDate)}
                </dd>
              </div>
            </dl>
            <p
              className={cn(
                "mt-5 text-sm leading-6",
                plan.deadlineStatus === "VENCIDO"
                  ? "text-rose-700"
                  : "text-stone-500",
              )}
            >
              {plan.deadlineStatus === "VENCIDO"
                ? "El plan está vencido y requiere atención."
                : `El plan se encuentra dentro del plazo efectivo${plan.reprogrammed ? " reprogramado" : ""}.`}
            </p>
            {canRequestExtensionForPlan && !extensions.length ? (
              <div className="mt-5 border-t border-stone-200 pt-5">
                <button
                  className="nibol-btn-secondary px-4 py-2.5 text-sm"
                  onClick={() => setExtensionOpen((value) => !value)}
                  type="button"
                >
                  Solicitar ampliación de plazo
                </button>
                {extensionOpen ? (
                  <form
                    className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      requestExtension.mutate();
                    }}
                  >
                    <label className="grid gap-1 text-sm font-semibold">
                      Clasificación
                      <select
                        className="nibol-field"
                        required
                        value={extensionClassification}
                        onChange={(event) =>
                          setExtensionClassification(event.target.value)
                        }
                      >
                        <option value="">Seleccione una clasificación</option>
                        {classificationsQuery.data?.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.name} · máximo {item.maxAdditionalDays} días
                          </option>
                        ))}
                      </select>
                    </label>
                    {selectedExtensionClass ? (
                      <div className="rounded-lg border border-amber-200 bg-white/70 p-3 text-xs text-stone-700">
                        <p>{selectedExtensionClass.description}</p>
                        <p className="mt-1">
                          Fecha actual: {plan.effectiveDueDate.slice(0, 10)} ·
                          Fecha máxima permitida: {maxExtensionDate}
                        </p>
                      </div>
                    ) : null}
                    <label className="grid gap-1 text-sm font-semibold">
                      Nueva fecha solicitada
                      <input
                        className="nibol-field"
                        max={maxExtensionDate || undefined}
                        min={plan.effectiveDueDate.slice(0, 10)}
                        required
                        type="date"
                        value={extensionDate}
                        onInput={(event) =>
                          setExtensionDate(event.currentTarget.value)
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold">
                      Justificación
                      <textarea
                        className="nibol-field min-h-20 py-2"
                        required
                        value={extensionReason}
                        onChange={(event) =>
                          setExtensionReason(event.target.value)
                        }
                      />
                    </label>
                    <button
                      className="nibol-btn-primary px-4 py-2.5 text-sm"
                      disabled={requestExtension.isPending}
                      type="submit"
                    >
                      {requestExtension.isPending
                        ? "Enviando…"
                        : "Enviar solicitud"}
                    </button>
                  </form>
                ) : null}
              </div>
            ) : null}
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
                    href={buildObservationUrl({
                      extensionId: item.id,
                      observationId: plan.observation.id,
                      planId: plan.id,
                      tab: "plans",
                    })}
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
      <ConfirmDialog
        confirmLabel="Eliminar plan"
        description="Se dejará de mostrar este plan de acción. Sus avances, evidencias e historial se conservarán."
        isLoading={remove.isPending}
        onConfirm={async () => remove.mutateAsync()}
        onOpenChange={setConfirmDelete}
        open={confirmDelete}
        title="¿Eliminar plan de acción?"
        tone="danger"
      />
    </div>
  );
}
