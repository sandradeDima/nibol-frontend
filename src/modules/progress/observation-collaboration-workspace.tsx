"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileUp, MessageSquare, Send, ShieldCheck } from "lucide-react";

import { apiClient } from "@/services/api-client";
import { progressService } from "@/services/progress-service";
import { remediationService } from "@/services/remediation-service";
import type {
  ActionPlanStatus,
  EvidenceFileItem,
  ProgressEvaluationType,
} from "@/types";
import { getApiErrorMessage } from "@/utils";

const statusOptions: Array<{ label: string; value: ActionPlanStatus }> = [
  { label: "No iniciado", value: "NOT_STARTED" },
  { label: "Iniciado", value: "STARTED" },
  { label: "Con avance", value: "WITH_PROGRESS" },
  { label: "Concluido", value: "CONCLUDED" },
];
const contextLabels: Record<EvidenceFileItem["context"], string> = {
  ACTION_PLAN: "Plan de acción",
  CLOSURE: "Cierre",
  FINDING: "Hallazgo",
  PROGRESS_EVALUATION: "Evaluación",
};

export function ObservationCollaborationWorkspace({
  observationId,
}: {
  observationId: string;
}) {
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [evaluation, setEvaluation] = useState<{
    actionPlanStatus: ActionPlanStatus;
    comment: string;
    progressPercent: number;
    type: ProgressEvaluationType;
  }>({
    actionPlanStatus: "STARTED",
    comment: "",
    progressPercent: 0,
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
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setEvaluation({
        actionPlanStatus: "STARTED",
        comment: "",
        progressPercent: 0,
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
    onSuccess: refresh,
  });
  const review = useMutation({
    mutationFn: ({
      action,
      id,
    }: {
      action: "approve" | "return" | "reject";
      id: string;
    }) =>
      progressService.reviewProgressEvaluation(
        id,
        action,
        action === "approve"
          ? {}
          : {
              comment:
                window.prompt("Comentario de revisión") ?? "Revisión requerida",
            },
      ),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: refresh,
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
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setFiles([]);
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

  return (
    <section className="nibol-panel p-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-amber-700 uppercase">
          Seguimiento independiente
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-stone-950">
          Evaluaciones, evidencia y comentarios
        </h3>
        <p className="mt-1 text-sm text-stone-500">
          Cada avance pertenece a un único plan de acción; el progreso de la
          observación se agrega solo desde evaluaciones aprobadas.
        </p>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.25fr]">
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
                    {plan.area.name} · {plan.title}
                  </option>
                ))}
              </select>
            </label>
            {selectedPlanId ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-stone-700">
                {
                  plans.data?.data.find((plan) => plan.id === selectedPlanId)
                    ?.observation.displayCode
                }
                <br />
                Área:{" "}
                {
                  plans.data?.data.find((plan) => plan.id === selectedPlanId)
                    ?.area.name
                }
                <br />
                Responsable:{" "}
                {
                  plans.data?.data.find((plan) => plan.id === selectedPlanId)
                    ?.responsibleUser.name
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
                  value={evaluation.progressPercent}
                  onChange={(event) =>
                    setEvaluation((current) => ({
                      ...current,
                      progressPercent: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-semibold">
                Estado
                <select
                  className="nibol-field"
                  value={evaluation.actionPlanStatus}
                  onChange={(event) =>
                    setEvaluation((current) => ({
                      ...current,
                      actionPlanStatus: event.target.value as ActionPlanStatus,
                    }))
                  }
                >
                  {statusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="space-y-2 text-sm font-semibold">
              Tipo
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
                <option value="CORRECTION">Corrección</option>
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
            <label className="space-y-2 text-sm font-semibold">
              Evidencia de la evaluación
              <input
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                className="nibol-field py-2"
                multiple
                type="file"
                onChange={(event) =>
                  setEvaluationFiles(Array.from(event.target.files ?? []))
                }
              />
              <span className="block text-xs font-normal text-stone-500">
                Los archivos quedarán vinculados únicamente a esta evaluación.
              </span>
            </label>
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
        <div>
          <h4 className="font-semibold text-stone-950">Historial por plan</h4>
          <div className="mt-4 space-y-3">
            {evaluations.data?.data.length ? (
              evaluations.data.data.map((item) => (
                <article
                  className="rounded-2xl border border-stone-200 p-5"
                  key={item.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
                        {item.actionPlan.area.name} · {item.actionPlan.title}
                      </p>
                      <p className="mt-2 text-2xl font-semibold">
                        {item.progressPercent}%
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {item.submittedByUser.name} ·{" "}
                        {new Date(item.submittedAt).toLocaleDateString("es-BO")}
                      </p>
                    </div>
                    <span className="nibol-badge">
                      {item.reviewStatus.replaceAll("_", " ")}
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
                    {["DRAFT", "RETURNED"].includes(item.reviewStatus) ? (
                      <button
                        className="nibol-btn-secondary px-3 py-2 text-xs"
                        onClick={() => submit.mutate(item.id)}
                        type="button"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Enviar a Auditoría
                      </button>
                    ) : null}
                    {item.reviewStatus === "SENT_TO_AUDIT" ? (
                      <>
                        <button
                          className="nibol-btn-primary px-3 py-2 text-xs"
                          onClick={() =>
                            review.mutate({ action: "approve", id: item.id })
                          }
                          type="button"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Aprobar
                        </button>
                        <button
                          className="nibol-btn-secondary px-3 py-2 text-xs"
                          onClick={() =>
                            review.mutate({ action: "return", id: item.id })
                          }
                          type="button"
                        >
                          Devolver
                        </button>
                        <button
                          className="nibol-btn-secondary px-3 py-2 text-xs text-rose-700"
                          onClick={() =>
                            review.mutate({ action: "reject", id: item.id })
                          }
                          type="button"
                        >
                          Rechazar
                        </button>
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
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section>
          <h4 className="flex items-center gap-2 font-semibold">
            <FileUp className="h-4 w-4 text-amber-700" />
            Evidencia por contexto
          </h4>
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
            <input
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              className="nibol-field py-2"
              multiple
              required
              type="file"
              onChange={(event) =>
                setFiles(Array.from(event.target.files ?? []))
              }
            />
            <button
              className="nibol-btn-primary px-4 py-2 text-sm"
              disabled={upload.isPending}
              type="submit"
            >
              Subir
            </button>
          </form>
          <div className="mt-4 space-y-4">
            {Object.entries(contextLabels).map(([context, label]) => (
              <div key={context}>
                <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                  {label}
                </p>
                <div className="mt-2 space-y-2">
                  {groupedEvidence[context as EvidenceFileItem["context"]].map(
                    (file) => (
                      <a
                        className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm hover:border-amber-300"
                        href={`${apiClient.defaults.baseURL}${file.downloadPath}`}
                        key={file.id}
                      >
                        <span className="truncate">{file.originalName}</span>
                        <span className="text-xs text-stone-500">
                          {Math.ceil(file.sizeBytes / 1024)} KB
                        </span>
                      </a>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
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
      </div>
      {error ? (
        <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
