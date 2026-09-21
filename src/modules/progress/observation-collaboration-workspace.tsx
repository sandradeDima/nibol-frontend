"use client";

import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, MessageSquare, Send, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FilePicker } from "@/components/ui/file-picker";
import { QUERY_KEYS } from "@/lib/constants";
import { apiClient } from "@/services/api-client";
import { progressService } from "@/services/progress-service";
import { remediationService } from "@/services/remediation-service";
import type { ProgressEvaluationType } from "@/types";
import { getApiErrorMessage, getUploadErrorMessage } from "@/utils";
import { getProgressStatusLabel } from "./presentation";

type EvaluationDraft = {
  comment: string;
  reportedProgressPercent: string;
  type: ProgressEvaluationType;
};

export function ObservationCollaborationWorkspace({
  activePlanId,
  activeEvidenceId,
  activeEvaluationId,
  canDeleteEvidence,
  canSubmitProgress,
  canUploadEvidence,
  currentUserId,
  observationAreas,
  observationId,
  section = "all",
}: {
  activePlanId?: string | null;
  activeEvidenceId?: string | null;
  activeEvaluationId?: string | null;
  canDeleteEvidence: boolean;
  canSubmitProgress: boolean;
  canUploadEvidence: boolean;
  currentUserId: string;
  observationAreas: Array<{ id: string; name: string }>;
  observationId: string;
  section?: "all" | "plans" | "evidence" | "comments";
}) {
  const showPlans = section === "all" || section === "plans";
  const showEvidence = section === "all" || section === "evidence";
  const showComments = section === "all" || section === "comments";
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState(activePlanId ?? "");
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationDraft>({
    comment: "",
    reportedProgressPercent: "0",
    type: "ADVANCE",
  });
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [evaluationFiles, setEvaluationFiles] = useState<File[]>([]);
  const [evidenceAreaId, setEvidenceAreaId] = useState("");
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
      queryClient.invalidateQueries({
        queryKey: ["observation-comments", observationId],
      }),
    ]);
  const createEvaluation = useMutation({
    mutationFn: async () => {
      const selectedPlan = plans.data?.data.find(
        (plan) => plan.id === selectedPlanId,
      );
      const reportedProgressPercent = Number(
        evaluation.reportedProgressPercent,
      );
      if (!selectedPlan)
        throw new Error("Seleccione un plan de acción válido.");
      if (
        !evaluation.reportedProgressPercent.trim() ||
        !Number.isInteger(reportedProgressPercent) ||
        reportedProgressPercent < 0 ||
        reportedProgressPercent > 100
      )
        throw new Error("El avance debe ser un número entero entre 0 y 100.");
      const created = await progressService.createProgressEvaluation(
        selectedPlanId,
        { ...evaluation, reportedProgressPercent },
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
    onError: (cause) =>
      setError(
        evaluationFiles.length
          ? getUploadErrorMessage(cause, evaluationFiles)
          : getApiErrorMessage(cause),
      ),
    onSuccess: async () => {
      setEvaluation({
        comment: "",
        reportedProgressPercent: "0",
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
  const deleteEvaluation = useMutation({
    mutationFn: (id: string) => progressService.deleteProgressEvaluation(id),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setDraftToDelete(null);
      setError(null);
      await refresh();
    },
  });
  const upload = useMutation({
    mutationFn: () =>
      progressService.uploadObservationEvidence(
        observationId,
        files,
        "Documento de respaldo de la observación.",
        evidenceAreaId || undefined,
      ),
    onError: (cause) => setError(getUploadErrorMessage(cause, files)),
    onSuccess: async () => {
      setFiles([]);
      setEvidenceAreaId("");
      await refresh();
    },
  });
  const deleteEvidence = useMutation({
    mutationFn: (id: string) => progressService.deleteEvidence(id),
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
  const groupedEvidence = useMemo(() => {
    const findingEvidence = (evidence.data ?? []).filter(
      (item) => item.context === "FINDING",
    );
    const groups = observationAreas.map((area) => ({
      files: findingEvidence.filter(
        (file) => file.observationArea?.id === area.id,
      ),
      id: area.id,
      name: area.name,
    }));
    const unassigned = findingEvidence.filter((file) => !file.observationArea);
    if (unassigned.length)
      groups.push({
        files: unassigned,
        id: "unassigned",
        name: "Sin área específica",
      });
    return groups;
  }, [evidence.data, observationAreas]);

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
                : "Comentarios de la observación"}
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-stone-950">
          {showPlans && showEvidence
            ? "Evaluaciones, evidencia y comentarios"
            : showPlans
              ? "Avances y Evidencias"
              : showEvidence
                ? "Documentos de respaldo y evidencias"
                : "Comentarios del equipo"}
        </h3>
        <p className="mt-1 text-sm text-stone-500">
          {showComments
            ? "Comparta comentarios y acuerdos sobre esta observación."
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
                      inputMode="numeric"
                      required
                      step={1}
                      type="number"
                      value={evaluation.reportedProgressPercent}
                      onChange={(event) => {
                        const value = event.target.value.replace(
                          /^0+(?=\d)/,
                          "",
                        );
                        setEvaluation((current) => ({
                          ...current,
                          reportedProgressPercent: value,
                        }));
                      }}
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
                        <p className="mt-1 text-sm font-semibold text-stone-800">
                          {item.actionPlan.title}
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
                    {item.evidence.length ? (
                      <div className="mt-4 border-t border-stone-200 pt-3">
                        <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                          Evidencias del avance ({item.evidence.length})
                        </p>
                        <div className="mt-2 divide-y divide-stone-200">
                          {item.evidence.map((file) => (
                            <div
                              className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm"
                              key={file.id}
                            >
                              <a
                                className="min-w-0 truncate font-medium text-stone-800 hover:text-amber-800 hover:underline"
                                href={`${apiClient.defaults.baseURL}${file.downloadPath}`}
                              >
                                {file.originalName}
                              </a>
                              <div className="flex items-center gap-2 text-xs text-stone-500">
                                <span>
                                  {Math.ceil(file.sizeBytes / 1024)} KB
                                </span>
                                {canDeleteEvidence &&
                                file.id &&
                                item.submittedByUser.id === currentUserId &&
                                ["DRAFT", "RETURNED"].includes(
                                  item.reviewStatus,
                                ) ? (
                                  <button
                                    aria-label={`Eliminar ${file.originalName}`}
                                    className="rounded-lg p-1.5 text-stone-500 hover:bg-rose-50 hover:text-rose-700"
                                    disabled={deleteEvidence.isPending}
                                    onClick={() =>
                                      deleteEvidence.mutate(file.id)
                                    }
                                    title="Eliminar evidencia del borrador"
                                    type="button"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        className="nibol-btn-secondary px-3 py-2 text-xs"
                        href={`/planes-accion/${item.actionPlan.id}`}
                      >
                        Ver plan de acción
                      </Link>
                      {canSubmitProgress &&
                      item.submittedByUser.id === currentUserId &&
                      item.reviewStatus === "DRAFT" ? (
                        <button
                          className="nibol-btn-secondary px-3 py-2 text-xs text-rose-700"
                          disabled={deleteEvaluation.isPending}
                          onClick={() => setDraftToDelete(item.id)}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar borrador
                        </button>
                      ) : null}
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
          <section className="scroll-mt-24" id="documentos-observacion">
            <h4 className="flex items-center gap-2 font-semibold">
              <FileUp className="h-4 w-4 text-amber-700" />
              Documentos de respaldo por área involucrada
            </h4>
            {canUploadEvidence ? (
              <form
                className="mt-4 grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto] lg:items-end"
                onSubmit={(event) => {
                  event.preventDefault();
                  upload.mutate();
                }}
              >
                <label className="grid gap-2 text-sm font-semibold">
                  Área involucrada
                  <select
                    className="nibol-field"
                    required={observationAreas.length > 0}
                    value={evidenceAreaId}
                    onChange={(event) => setEvidenceAreaId(event.target.value)}
                  >
                    <option value="">
                      {observationAreas.length
                        ? "Seleccione el área"
                        : "Sin área específica"}
                    </option>
                    {observationAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </label>
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
              {groupedEvidence.map((group) => (
                <div
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                  key={group.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-950">
                      {group.name}
                    </p>
                    <span className="text-xs text-stone-500">
                      {group.files.length} documento
                      {group.files.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {group.files.length ? (
                      group.files.map((file) => (
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
                                {Math.ceil(file.sizeBytes / 1024)} KB · Cargado
                                por {file.uploadedByUser?.name ?? "Usuario"} ·{" "}
                                {new Date(file.createdAt).toLocaleString(
                                  "es-BO",
                                )}
                              </p>
                              {file.description ? (
                                <p className="mt-1 text-xs leading-5 text-stone-600">
                                  {file.description}
                                </p>
                              ) : null}
                            </div>
                            {canDeleteEvidence &&
                            file.uploadedByUser?.id === currentUserId &&
                            ["DRAFT", "RETURNED"].includes(
                              file.reviewStatus,
                            ) ? (
                              <button
                                aria-label={`Eliminar ${file.originalName}`}
                                className="rounded-lg p-1.5 text-stone-500 hover:bg-rose-50 hover:text-rose-700"
                                disabled={deleteEvidence.isPending}
                                onClick={() => deleteEvidence.mutate(file.id)}
                                title="Eliminar documento de respaldo"
                                type="button"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="border border-dashed border-stone-300 bg-white p-3 text-xs text-stone-500">
                        No hay documentos de respaldo para esta área.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
      {showComments ? (
        <section className="mt-8">
          <h4 className="flex items-center gap-2 font-semibold">
            <MessageSquare className="h-4 w-4 text-amber-700" />
            Comentarios
          </h4>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              addComment.mutate();
            }}
          >
            <textarea
              className="nibol-field min-h-24 resize-y py-3"
              placeholder="Escriba un comentario sobre esta observación"
              required
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <button
              className="nibol-btn-primary px-4 py-2.5 text-sm"
              disabled={addComment.isPending}
              type="submit"
            >
              {addComment.isPending ? "Enviando…" : "Enviar"}
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
      <ConfirmDialog
        cancelLabel="Cancelar"
        confirmLabel="Eliminar borrador"
        description="Esta acción eliminará el avance en borrador. Una vez enviado a Auditoría ya no podrá eliminarse."
        isLoading={deleteEvaluation.isPending}
        onConfirm={() => {
          if (draftToDelete) deleteEvaluation.mutate(draftToDelete);
        }}
        onOpenChange={(open) => {
          if (!open && !deleteEvaluation.isPending) setDraftToDelete(null);
        }}
        open={Boolean(draftToDelete)}
        title="¿Eliminar este avance?"
      />
    </section>
  );
}
