"use client";

import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileUp, MessageSquare, Send, ShieldCheck } from "lucide-react";

import { FilePicker } from "@/components/ui/file-picker";
import { QUERY_KEYS } from "@/lib/constants";
import { apiClient } from "@/services/api-client";
import { progressService } from "@/services/progress-service";
import { remediationService } from "@/services/remediation-service";
import type {
  ActionPlanStatus,
  EvidenceFileItem,
  ProgressEvaluationType,
} from "@/types";
import { getApiErrorMessage, getUploadErrorMessage } from "@/utils";
import { getProgressStatusLabel } from "./presentation";

const contextLabels: Record<EvidenceFileItem["context"], string> = {
  ACTION_PLAN: "Plan de acción",
  CLOSURE: "Cierre",
  FINDING: "Documentos de respaldo y evidencias",
  PROGRESS_EVALUATION: "Evaluación",
};
const evidenceReviewLabels: Record<EvidenceFileItem["reviewStatus"], string> = {
  APPROVED: "Aprobada",
  DRAFT: "Sin enviar",
  PENDING: "En revisión",
  REJECTED: "Rechazada",
  RETURNED: "Con observaciones",
};

export function ObservationCollaborationWorkspace({
  activeEvidenceId,
  activeEvaluationId,
  canApproveProgress,
  canReviewEvidence,
  canReturnProgress,
  canSubmitProgress,
  canUploadEvidence,
  currentUserId,
  observationId,
  isAdmin,
  section = "all",
}: {
  activeEvidenceId?: string | null;
  activeEvaluationId?: string | null;
  canApproveProgress: boolean;
  canReviewEvidence: boolean;
  canReturnProgress: boolean;
  canSubmitProgress: boolean;
  canUploadEvidence: boolean;
  currentUserId: string;
  observationId: string;
  isAdmin: boolean;
  section?: "all" | "plans" | "evidence" | "history";
}) {
  const showPlans = section === "all" || section === "plans";
  const showEvidence = section === "all" || section === "evidence";
  const showHistory = section === "all" || section === "history";
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [evaluation, setEvaluation] = useState<{
    comment: string;
    reportedProgressPercent: number;
    type: ProgressEvaluationType;
  }>({
    comment: "",
    reportedProgressPercent: 0,
    type: "ADVANCE",
  });
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [evaluationFiles, setEvaluationFiles] = useState<File[]>([]);
  const [evidenceContext, setEvidenceContext] =
    useState<EvidenceFileItem["context"]>("FINDING");
  const [error, setError] = useState<string | null>(null);
  const plans = useQuery({
    queryFn: () =>
      remediationService.listActionPlans(
        `?filter.observationId=${encodeURIComponent(observationId)}&perPage=100`,
      ),
    queryKey: ["action-plans", observationId],
  });
  const evaluations = useQuery({
    queryFn: () =>
      progressService.listProgressEvaluations(
        `?filter.observationId=${encodeURIComponent(observationId)}&perPage=100`,
      ),
    queryKey: ["progress-evaluations", observationId],
  });
  const evidence = useQuery({
    queryFn: () => progressService.getObservationEvidence(observationId),
    queryKey: ["observation-evidence", observationId],
  });
  const comments = useQuery({
    queryFn: () => progressService.getComments(observationId),
    queryKey: ["observation-comments", observationId],
  });
  const refresh = async () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["progress-evaluations", observationId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["action-plans", observationId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["observation-evidence", observationId],
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observationDetails(observationId),
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observationActionItems(observationId),
      }),
    ]);
  const createEvaluation = useMutation({
    mutationFn: async () => {
      const created = await progressService.createProgressEvaluation(
        selectedPlanId,
        evaluation,
      );
      if (evaluationFiles.length > 0) {
        await progressService.uploadEvidence(
          `/progress-evaluations/${created.id}/evidence`,
          evaluationFiles,
          "PROGRESS_EVALUATION",
          "Evidencia presentada con la evaluación de avance.",
        );
      }
      return created;
    },
    onError: (cause) => setError(getUploadErrorMessage(cause, evaluationFiles)),
    onSuccess: async () => {
      setEvaluation({
        comment: "",
        reportedProgressPercent: 0,
        type: "ADVANCE",
      });
      setEvaluationFiles([]);
      setError(null);
      await refresh();
    },
  });
  const submit = useMutation({
    mutationFn: (id: string) => progressService.submitProgressEvaluation(id),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setError(null);
      await refresh();
    },
  });
  const review = useMutation({
    mutationFn: ({
      action,
      id,
      officialStatus,
    }: {
      action: "approve" | "return";
      id: string;
      officialStatus: ActionPlanStatus;
    }) =>
      progressService.reviewProgressEvaluation(id, action, {
        comment: action === "approve" ? null : "Revisión requerida",
        officialStatus,
      }),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setError(null);
      await refresh();
    },
  });
  const upload = useMutation({
    mutationFn: () => {
      if (evidenceContext === "ACTION_PLAN") {
        if (!selectedPlanId) {
          throw new Error(
            "Seleccione un plan de acción para asociar la evidencia.",
          );
        }
        return progressService.uploadEvidence(
          `/action-plans/${selectedPlanId}/evidence`,
          files,
          "ACTION_PLAN",
        );
      }
      return progressService.uploadEvidence(
        `/observations/${observationId}/evidence`,
        files,
        evidenceContext,
      );
    },
    onError: (cause) => setError(getUploadErrorMessage(cause, files)),
    onSuccess: async () => {
      setFiles([]);
      await refresh();
    },
  });
  const submitEvidence = useMutation({
    mutationFn: (id: string) => progressService.submitEvidenceForReview(id),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setError(null);
      await refresh();
    },
  });
  const reviewEvidence = useMutation({
    mutationFn: ({
      action,
      id,
    }: {
      action: "approve" | "return";
      id: string;
    }) =>
      progressService.reviewEvidence(
        id,
        action,
        action === "return" ? "" : null,
      ),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setError(null);
      await refresh();
    },
  });
  const addComment = useMutation({
    mutationFn: () =>
      progressService.createComment(observationId, {
        body: comment,
        visibility: "AREA_VISIBLE",
      }),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setComment("");
      await queryClient.invalidateQueries({
        queryKey: ["observation-comments", observationId],
      });
    },
  });
  const groupedEvidence = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(contextLabels).map((context) => [
          context,
          (evidence.data ?? []).filter((item) => item.context === context),
        ]),
      ) as Record<EvidenceFileItem["context"], EvidenceFileItem[]>,
    [evidence.data],
  );

  useEffect(() => {
    if (section !== "evidence" || !activeEvidenceId || !evidence.data) return;
    document
      .getElementById(`evidence-${activeEvidenceId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeEvidenceId, evidence.data, section]);

  useEffect(() => {
    if (section !== "plans" || !activeEvaluationId || !evaluations.data) return;
    document
      .getElementById(`progress-evaluation-${activeEvaluationId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeEvaluationId, evaluations.data, section]);

  return (
    <section className="nibol-panel p-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-amber-700 uppercase">
          {showPlans && showEvidence
            ? "Seguimiento independiente"
            : showPlans
              ? "Planes y avances"
              : showEvidence
                ? "Evidencias y documentos"
                : "Historial y comentarios"}
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-stone-950">
          {showPlans && showEvidence
            ? "Evaluaciones, evidencia y comentarios"
            : showPlans
              ? "Evaluaciones y avances por plan"
              : showEvidence
                ? "Documentos de respaldo y evidencias"
                : "Comentarios del equipo"}
        </h3>
        <p className="mt-1 text-sm text-stone-500">
          {showHistory
            ? "Conserve aquí las conversaciones y la trazabilidad de la observación."
            : "Cada avance pertenece a un único plan de acción; el progreso de la observación se agrega solo desde evaluaciones aprobadas."}
        </p>
      </div>
      {error ? (
        <p
          aria-live="assertive"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {showPlans ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.25fr]">
          {canSubmitProgress ? (
            <form
              className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
              onSubmit={(event) => {
                event.preventDefault();
                createEvaluation.mutate();
              }}
            >
              <h4 className="font-semibold text-stone-950">Registrar avance</h4>
              <div className="mt-4 space-y-4">
                <label className="space-y-2 text-sm font-semibold">
                  Plan de acción
                  <select
                    className="nibol-field"
                    required
                    value={selectedPlanId}
                    onChange={(event) => setSelectedPlanId(event.target.value)}
                  >
                    <option value="">Seleccione el plan</option>
                    {plans.data?.data.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.area.name} · {plan.description}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedPlanId ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-stone-700">
                    {
                      plans.data?.data.find(
                        (plan) => plan.id === selectedPlanId,
                      )?.observation.displayCode
                    }
                    <br />
                    Área:{" "}
                    {
                      plans.data?.data.find(
                        (plan) => plan.id === selectedPlanId,
                      )?.area.name
                    }
                    <br />
                    Ejecutor:{" "}
                    {
                      plans.data?.data.find(
                        (plan) => plan.id === selectedPlanId,
                      )?.responsibleUser.name
                    }
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-2 text-sm font-semibold">
                    Avance %
                    <input
                      className="nibol-field"
                      max={100}
                      min={0}
                      required
                      type="number"
                      value={evaluation.reportedProgressPercent}
                      onChange={(event) =>
                        setEvaluation((current) => ({
                          ...current,
                          reportedProgressPercent: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                </div>
                <label className="space-y-2 text-sm font-semibold">
                  Tipo de actualización
                  <select
                    className="nibol-field"
                    value={evaluation.type}
                    onChange={(event) =>
                      setEvaluation((current) => ({
                        ...current,
                        type: event.target.value as ProgressEvaluationType,
                      }))
                    }
                  >
                    <option value="ADVANCE">Avance</option>
                    <option value="FINALIZATION">Finalización</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-semibold">
                  Comentario
                  <textarea
                    className="nibol-field min-h-24 resize-y py-3"
                    required
                    value={evaluation.comment}
                    onChange={(event) =>
                      setEvaluation((current) => ({
                        ...current,
                        comment: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="space-y-2 text-sm font-semibold">
                  Evidencia de la evaluación
                  <FilePicker
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    files={evaluationFiles}
                    id="progress-evaluation-evidence"
                    onChange={setEvaluationFiles}
                    onRemove={(file) =>
                      setEvaluationFiles((current) =>
                        current.filter((candidate) => candidate !== file),
                      )
                    }
                  />
                  <span className="block text-xs font-normal text-stone-500">
                    Los archivos quedarán vinculados únicamente a esta
                    evaluación.
                  </span>
                </div>
                <button
                  className="nibol-btn-primary w-full justify-center px-4 py-2.5 text-sm"
                  disabled={createEvaluation.isPending}
                  type="submit"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Guardar evaluación
                </button>
              </div>
            </form>
          ) : null}
          <div>
            <h4 className="font-semibold text-stone-950">Historial por plan</h4>
            <div className="mt-4 space-y-3">
              {evaluations.data?.data.length ? (
                evaluations.data.data.map((item) => (
                  <article
                    className={`rounded-2xl border p-5 ${activeEvaluationId === item.id ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-200" : "border-stone-200"}`}
                    id={`progress-evaluation-${item.id}`}
                    key={item.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
                          {item.actionPlan.area.name} · Plan de acción
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                          {item.reportedProgressPercent ?? 0}% reportado
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {item.submittedByUser.name} ·{" "}
                          {new Date(item.submittedAt).toLocaleDateString(
                            "es-BO",
                          )}
                        </p>
                      </div>
                      <span className="nibol-badge">
                        {getProgressStatusLabel(item.reviewStatus)}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-stone-700">
                      {item.comment}
                    </p>
                    {item.reviewComment ? (
                      <p className="mt-3 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
                        Auditoría: {item.reviewComment}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {canSubmitProgress &&
                      item.submittedByUser.id === currentUserId &&
                      ["DRAFT", "RETURNED"].includes(item.reviewStatus) ? (
                        <button
                          className="nibol-btn-secondary px-3 py-2 text-xs"
                          onClick={() => submit.mutate(item.id)}
                          type="button"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Enviar a Auditoría
                        </button>
                      ) : null}
                      {item.reviewStatus === "SENT_TO_AUDIT" &&
                      (canApproveProgress || canReturnProgress) ? (
                        <>
                          {canApproveProgress ? (
                            <button
                              className="nibol-btn-primary px-3 py-2 text-xs"
                              disabled={review.isPending}
                              onClick={() =>
                                review.mutate({
                                  action: "approve",
                                  id: item.id,
                                  officialStatus: item.officialStatus,
                                })
                              }
                              type="button"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Aprobar
                            </button>
                          ) : null}
                          {canReturnProgress ? (
                            <button
                              className="nibol-btn-secondary px-3 py-2 text-xs"
                              disabled={review.isPending}
                              onClick={() =>
                                review.mutate({
                                  action: "return",
                                  id: item.id,
                                  officialStatus: item.officialStatus,
                                })
                              }
                              type="button"
                            >
                              Devolver
                            </button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-stone-300 p-5 text-sm text-stone-500">
                  Todavía no hay evaluaciones registradas.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {showEvidence ? (
        <div className="mt-8">
          <section>
            <h4 className="flex items-center gap-2 font-semibold">
              <FileUp className="h-4 w-4 text-amber-700" />
              Documentos de respaldo y evidencias
            </h4>
            {canUploadEvidence ? (
              <form
                className="mt-4 flex flex-col gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  upload.mutate();
                }}
              >
                <select
                  className="nibol-field sm:max-w-44"
                  value={evidenceContext}
                  onChange={(event) =>
                    setEvidenceContext(
                      event.target.value as EvidenceFileItem["context"],
                    )
                  }
                >
                  {Object.entries(contextLabels)
                    .filter(([value]) => value !== "PROGRESS_EVALUATION")
                    .map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </select>
                {evidenceContext === "ACTION_PLAN" ? (
                  <select
                    className="nibol-field sm:max-w-64"
                    required
                    value={selectedPlanId}
                    onChange={(event) => setSelectedPlanId(event.target.value)}
                  >
                    <option value="">Seleccione el plan</option>
                    {plans.data?.data.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.area.name} · {plan.description}
                      </option>
                    ))}
                  </select>
                ) : null}
                <FilePicker
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  files={files}
                  id="observation-evidence"
                  onChange={(selected) =>
                    setFiles((current) => [
                      ...current,
                      ...selected.filter(
                        (file) =>
                          !current.some(
                            (existing) =>
                              existing.name === file.name &&
                              existing.size === file.size &&
                              existing.lastModified === file.lastModified,
                          ),
                      ),
                    ])
                  }
                  onRemove={(file) =>
                    setFiles((current) =>
                      current.filter((candidate) => candidate !== file),
                    )
                  }
                  required
                />
                <button
                  className="nibol-btn-primary px-4 py-2 text-sm"
                  disabled={upload.isPending}
                  type="submit"
                >
                  Subir
                </button>
              </form>
            ) : null}
            <div className="mt-4 space-y-4">
              {Object.entries(contextLabels).map(([context, label]) => (
                <div key={context}>
                  <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                    {label}
                  </p>
                  <div className="mt-2 space-y-2">
                    {groupedEvidence[
                      context as EvidenceFileItem["context"]
                    ].map((file) => (
                      <article
                        className={`border bg-white p-3 ${activeEvidenceId === file.id ? "border-amber-500 ring-2 ring-amber-200" : "border-stone-200"}`}
                        id={`evidence-${file.id}`}
                        key={file.id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <a
                              className="block truncate text-sm font-semibold text-stone-900 hover:text-amber-800 hover:underline"
                              href={`${apiClient.defaults.baseURL}${file.downloadPath}`}
                            >
                              {file.originalName}
                            </a>
                            <p className="mt-1 text-xs text-stone-500">
                              {Math.ceil(file.sizeBytes / 1024)} KB ·{" "}
                              {evidenceReviewLabels[file.reviewStatus]}
                            </p>
                            <p className="mt-1 text-xs text-stone-500">
                              Cargado por{" "}
                              {file.uploadedByUser?.name ?? "Usuario"} ·{" "}
                              {new Date(file.createdAt).toLocaleString("es-BO")}
                            </p>
                            {file.observationArea ? (
                              <p className="mt-1 text-xs font-medium text-amber-800">
                                Área: {file.observationArea.name}
                              </p>
                            ) : null}
                            {file.actionPlanTitle ? (
                              <p className="mt-1 text-xs font-medium text-stone-600">
                                Plan: {file.actionPlanTitle}
                              </p>
                            ) : null}
                            {file.reviewComment ? (
                              <p className="mt-2 text-xs leading-5 text-amber-900">
                                {file.reviewComment}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {canUploadEvidence &&
                            (isAdmin ||
                              file.uploadedByUser?.id === currentUserId) &&
                            ["DRAFT", "RETURNED"].includes(
                              file.reviewStatus,
                            ) ? (
                              <button
                                className="nibol-btn-secondary px-3 py-2 text-xs"
                                disabled={submitEvidence.isPending}
                                onClick={() => submitEvidence.mutate(file.id)}
                                type="button"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Enviar a revisión
                              </button>
                            ) : null}
                            {canReviewEvidence &&
                            file.reviewStatus === "PENDING" &&
                            !file.workflowInstanceId ? (
                              <>
                                <button
                                  className="nibol-btn-primary px-3 py-2 text-xs"
                                  disabled={reviewEvidence.isPending}
                                  onClick={() =>
                                    reviewEvidence.mutate({
                                      action: "approve",
                                      id: file.id,
                                    })
                                  }
                                  type="button"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Aprobar
                                </button>
                                <button
                                  className="nibol-btn-secondary px-3 py-2 text-xs"
                                  disabled={reviewEvidence.isPending}
                                  onClick={() =>
                                    reviewEvidence.mutate({
                                      action: "return",
                                      id: file.id,
                                    })
                                  }
                                  type="button"
                                >
                                  Devolver
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
      {showHistory ? (
        <section className="mt-8">
          <h4 className="flex items-center gap-2 font-semibold">
            <MessageSquare className="h-4 w-4 text-amber-700" />
            Comentarios
          </h4>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              addComment.mutate();
            }}
          >
            <input
              className="nibol-field"
              placeholder="Escriba un comentario para el equipo"
              required
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <button
              className="nibol-btn-primary px-4 py-2 text-sm"
              type="submit"
            >
              Enviar
            </button>
          </form>
          <div className="mt-4 space-y-3">
            {comments.data?.map((item) => (
              <article
                className="rounded-xl border border-stone-200 p-4"
                key={item.id}
              >
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-semibold">
                    {item.authorUser.name}
                  </p>
                  <time className="text-xs text-stone-500">
                    {new Date(item.createdAt).toLocaleString("es-BO")}
                  </time>
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
