"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCheck,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Paperclip,
  Pencil,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { progressService } from "@/services/progress-service";
import type {
  CommentVisibility,
  ObservationCommentItem,
  ProgressUpdateItem,
  ProgressUpdateType,
} from "@/types";
import { cn, getApiErrorMessage } from "@/utils";

import {
  formatFileSize,
  formatProgressDate,
  getCommentVisibilityClasses,
  getCommentVisibilityLabel,
  getProgressStatusClasses,
  getProgressStatusLabel,
  getProgressTypeClasses,
  getProgressTypeLabel,
  getReviewActionLabel,
} from "./presentation";

type ObservationCollaborationWorkspaceProps = {
  observationId: string;
};

type ProgressFormState = {
  comment: string;
  commitmentId: string;
  progressPercent: string;
  remediationPlanId: string;
  type: ProgressUpdateType;
};

const emptyProgressForm: ProgressFormState = {
  comment: "",
  commitmentId: "",
  progressPercent: "",
  remediationPlanId: "",
  type: "ADVANCE",
};

const getEvidenceIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) {
    return FileImage;
  }

  if (mimeType.includes("sheet") || mimeType.includes("excel")) {
    return FileSpreadsheet;
  }

  if (mimeType.includes("word") || mimeType.includes("pdf")) {
    return FileText;
  }

  return Paperclip;
};

const canShowComment = (comment: ObservationCommentItem) => {
  return comment.visibility === "AREA_VISIBLE" || comment.visibility === "SYSTEM";
};

export function ObservationCollaborationWorkspace({
  observationId,
}: ObservationCollaborationWorkspaceProps) {
  const queryClient = useQueryClient();
  const [progressForm, setProgressForm] = useState<ProgressFormState>(emptyProgressForm);
  const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
  const [progressFiles, setProgressFiles] = useState<File[]>([]);
  const [progressEvidenceDescription, setProgressEvidenceDescription] = useState("");
  const [generalEvidenceFiles, setGeneralEvidenceFiles] = useState<File[]>([]);
  const [generalEvidenceDescription, setGeneralEvidenceDescription] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [commentVisibility, setCommentVisibility] =
    useState<CommentVisibility>("AREA_VISIBLE");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [reviewComposer, setReviewComposer] = useState<{
    action: "approve" | "reject" | "return";
    comment: string;
    progressUpdateId: string;
  } | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const workspaceQuery = useQuery({
    queryFn: () => progressService.getObservationProgressWorkspace(observationId),
    queryKey: QUERY_KEYS.observationProgressWorkspace(observationId),
  });

  const evidencesQuery = useQuery({
    queryFn: () => progressService.getObservationEvidence(observationId),
    queryKey: QUERY_KEYS.observationEvidences(observationId),
  });

  const commentsQuery = useQuery({
    queryFn: () => progressService.getObservationComments(observationId),
    queryKey: QUERY_KEYS.observationComments(observationId),
  });

  const invalidateWorkspace = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observationProgressWorkspace(observationId),
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observationEvidences(observationId),
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observationComments(observationId),
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observationDetails(observationId),
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.progressUpdates,
      }),
    ]);
  };

  const generalDropzone = useDropzone({
    onDrop: (acceptedFiles) => {
      setGeneralEvidenceFiles((current) => [...current, ...acceptedFiles]);
    },
  });

  const progressDropzone = useDropzone({
    onDrop: (acceptedFiles) => {
      setProgressFiles((current) => [...current, ...acceptedFiles]);
    },
  });

  const generalEvidenceUploadMutation = useMutation({
    mutationFn: async () => {
      if (generalEvidenceFiles.length === 0) {
        throw new Error("Seleccione al menos un archivo para cargar.");
      }

      await progressService.uploadObservationEvidence(
        observationId,
        generalEvidenceFiles,
        generalEvidenceDescription.trim() || undefined,
      );
    },
    onError: (error) => {
      setWorkspaceError(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setWorkspaceError(null);
      setGeneralEvidenceDescription("");
      setGeneralEvidenceFiles([]);
      await invalidateWorkspace();
    },
  });

  const saveProgressMutation = useMutation({
    mutationFn: async (mode: "draft" | "audit") => {
      const payload = {
        comment: progressForm.comment.trim(),
        commitmentId: progressForm.commitmentId || null,
        progressPercent:
          progressForm.progressPercent.trim().length > 0
            ? Number(progressForm.progressPercent)
            : null,
        remediationPlanId: progressForm.remediationPlanId || null,
        type: progressForm.type,
      };

      let progressUpdate: ProgressUpdateItem;

      if (editingProgressId) {
        progressUpdate = await progressService.updateProgressUpdate(editingProgressId, payload);
      } else {
        progressUpdate = await progressService.createProgressUpdate(observationId, payload);
      }

      if (progressFiles.length > 0) {
        await progressService.uploadProgressEvidence(
          progressUpdate.id,
          progressFiles,
          progressEvidenceDescription.trim() || undefined,
        );
      }

      if (mode === "audit") {
        await progressService.sendProgressUpdateToAudit(progressUpdate.id);
      }
    },
    onError: (error) => {
      setWorkspaceError(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setWorkspaceError(null);
      setEditingProgressId(null);
      setProgressFiles([]);
      setProgressEvidenceDescription("");
      setProgressForm(emptyProgressForm);
      await invalidateWorkspace();
    },
  });

  const reviewProgressMutation = useMutation({
    mutationFn: async () => {
      if (!reviewComposer) {
        throw new Error("Seleccione una accion de revision.");
      }

      if (reviewComposer.action === "approve") {
        await progressService.approveProgressUpdate(reviewComposer.progressUpdateId, {
          comment: reviewComposer.comment.trim() || null,
        });
        return;
      }

      if (reviewComposer.action === "return") {
        await progressService.returnProgressUpdate(reviewComposer.progressUpdateId, {
          comment: reviewComposer.comment.trim(),
        });
        return;
      }

      await progressService.rejectProgressUpdate(reviewComposer.progressUpdateId, {
        comment: reviewComposer.comment.trim(),
      });
    },
    onError: (error) => {
      setWorkspaceError(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setWorkspaceError(null);
      setReviewComposer(null);
      await invalidateWorkspace();
    },
  });

  const evidenceDeleteMutation = useMutation({
    mutationFn: async (evidenceId: string) => {
      await progressService.deleteEvidence(evidenceId);
    },
    onError: (error) => {
      setWorkspaceError(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setWorkspaceError(null);
      await invalidateWorkspace();
    },
  });

  const sendProgressMutation = useMutation({
    mutationFn: async (progressUpdateId: string) => {
      await progressService.sendProgressUpdateToAudit(progressUpdateId);
    },
    onError: (error) => {
      setWorkspaceError(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setWorkspaceError(null);
      await invalidateWorkspace();
    },
  });

  const saveCommentMutation = useMutation({
    mutationFn: async () => {
      if (editingCommentId) {
        return progressService.updateObservationComment(editingCommentId, {
          body: commentDraft.trim(),
          visibility: commentVisibility,
        });
      }

      return progressService.createObservationComment(observationId, {
        body: commentDraft.trim(),
        visibility: commentVisibility,
      });
    },
    onError: (error) => {
      setWorkspaceError(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setWorkspaceError(null);
      setCommentDraft("");
      setCommentVisibility("AREA_VISIBLE");
      setEditingCommentId(null);
      await invalidateWorkspace();
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await progressService.deleteComment(commentId);
    },
    onError: (error) => {
      setWorkspaceError(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setWorkspaceError(null);
      await invalidateWorkspace();
    },
  });

  if (workspaceQuery.isError || evidencesQuery.isError || commentsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void workspaceQuery.refetch();
              void evidencesQuery.refetch();
              void commentsQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={
          workspaceQuery.error?.message ??
          evidencesQuery.error?.message ??
          commentsQuery.error?.message ??
          "No fue posible cargar el espacio de seguimiento."
        }
        title="No fue posible cargar avances, evidencias y comentarios"
      />
    );
  }

  if (!workspaceQuery.data || !evidencesQuery.data || !commentsQuery.data) {
    return (
      <section className="nibol-panel px-6 py-8 text-sm text-stone-600">
        Cargando avances, evidencias y comentarios...
      </section>
    );
  }

  const workspace = workspaceQuery.data;
  const observationEvidences = evidencesQuery.data;
  const comments = commentsQuery.data;
  const filteredCommitments = workspace.commitments.filter((commitment) => {
    if (!progressForm.remediationPlanId) {
      return true;
    }

    return commitment.remediationPlanId === progressForm.remediationPlanId;
  });
  const isBusy =
    generalEvidenceUploadMutation.isPending ||
    saveProgressMutation.isPending ||
    reviewProgressMutation.isPending ||
    evidenceDeleteMutation.isPending ||
    sendProgressMutation.isPending ||
    saveCommentMutation.isPending ||
    deleteCommentMutation.isPending;

  return (
    <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
      <div className="space-y-6">
        <section className="nibol-panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Evidencias y documentacion
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
                Archivos de soporte del hallazgo
              </h3>
              <p className="max-w-3xl text-sm leading-7 text-stone-700">
                Centralice respaldo documental para la observacion y descargue cada archivo
                sin exponer rutas internas del servidor.
              </p>
            </div>

            <div className="rounded-[1rem] border border-stone-200 bg-[var(--surface-soft)] px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Evidencias activas
              </p>
              <p className="mt-1 text-2xl font-semibold text-stone-950">
                {observationEvidences.length}
              </p>
            </div>
          </div>

          {workspace.canUploadEvidence ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_18rem]">
              <div
                {...generalDropzone.getRootProps()}
                className="rounded-[1.3rem] border border-dashed border-stone-300 bg-[var(--surface-soft)] px-5 py-6 text-sm text-stone-600 transition hover:border-[var(--primary)] hover:bg-white"
              >
                <input {...generalDropzone.getInputProps()} />
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-[var(--primary)]">
                    <Upload className="h-4 w-4" />
                    <span className="font-semibold">Arrastre archivos o haga clic para seleccionar</span>
                  </div>
                  <p>
                    Formatos permitidos: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG y JPEG.
                  </p>
                  {generalEvidenceFiles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {generalEvidenceFiles.map((file) => (
                        <span
                          key={`${file.name}-${file.lastModified}`}
                          className="inline-flex items-center gap-2 border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700"
                        >
                          {file.name}
                          <button
                            className="text-stone-500 transition hover:text-rose-700"
                            onClick={(event) => {
                              event.stopPropagation();
                              setGeneralEvidenceFiles((current) =>
                                current.filter((item) => item !== file),
                              );
                            }}
                            type="button"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <textarea
                  className="nibol-field min-h-28 resize-y py-3"
                  disabled={isBusy}
                  onChange={(event) => {
                    setGeneralEvidenceDescription(event.target.value);
                  }}
                  placeholder="Descripcion breve de la documentacion cargada."
                  value={generalEvidenceDescription}
                />
                <button
                  className="nibol-btn-primary w-full justify-center px-4 py-2.5 text-sm"
                  disabled={isBusy || generalEvidenceFiles.length === 0}
                  onClick={() => {
                    void generalEvidenceUploadMutation.mutateAsync();
                  }}
                  type="button"
                >
                  <Upload className="h-4 w-4" />
                  Cargar evidencias
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {observationEvidences.length > 0 ? (
              observationEvidences.map((evidence) => {
                const Icon = getEvidenceIcon(evidence.mimeType);

                return (
                  <article
                    key={evidence.id}
                    className="grid gap-4 border border-stone-200/90 bg-white px-4 py-4 md:grid-cols-[1fr_auto]"
                  >
                    <div className="flex gap-3">
                      <div className="bg-[var(--primary-soft)] p-3 text-[var(--primary)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-stone-950">
                          {evidence.originalName}
                        </p>
                        <p className="text-sm text-stone-600">
                          {evidence.description || "Sin descripcion adicional."}
                        </p>
                        <p className="text-xs text-stone-500">
                          {evidence.uploadedByUser.name} · {formatProgressDate(evidence.createdAt)} ·{" "}
                          {formatFileSize(evidence.sizeBytes)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className="nibol-btn-secondary px-3 py-2 text-sm"
                        onClick={() => {
                          void progressService.downloadEvidence(evidence);
                        }}
                        type="button"
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </button>
                      {evidence.canDelete ? (
                        <button
                          className="nibol-btn-secondary px-3 py-2 text-sm text-rose-700"
                          disabled={evidenceDeleteMutation.isPending}
                          onClick={() => {
                            void evidenceDeleteMutation.mutateAsync(evidence.id);
                          }}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-[var(--surface-soft)] px-4 py-4 text-sm text-stone-600">
                Todavia no se registraron evidencias para esta observacion.
              </div>
            )}
          </div>
        </section>

        <section className="nibol-panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Avances
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
                Registro de avances y finalizaciones
              </h3>
              <p className="max-w-3xl text-sm leading-7 text-stone-700">
                Documente avances, correcciones y cierres con trazabilidad completa antes de
                enviarlos a Auditoria.
              </p>
            </div>

            <button
              className="nibol-btn-secondary px-4 py-2.5 text-sm"
              onClick={() => {
                setEditingProgressId(null);
                setProgressFiles([]);
                setProgressEvidenceDescription("");
                setProgressForm(emptyProgressForm);
              }}
              type="button"
            >
              Nuevo avance
            </button>
          </div>

          {workspace.canCreateProgress ? (
            <div className="mt-5 space-y-4 border border-stone-200 bg-[var(--surface-soft)] p-5">
              <div className="grid gap-4 lg:grid-cols-[12rem_12rem_1fr]">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-stone-700">Tipo</span>
                  <select
                    className="nibol-field h-11 text-sm"
                    disabled={isBusy}
                    onChange={(event) => {
                      setProgressForm((current) => ({
                        ...current,
                        type: event.target.value as ProgressUpdateType,
                        progressPercent:
                          event.target.value === "FINALIZATION"
                            ? "100"
                            : current.progressPercent,
                      }));
                    }}
                    value={progressForm.type}
                  >
                    <option value="ADVANCE">Avance</option>
                    <option value="FINALIZATION">Finalizacion</option>
                    <option value="CORRECTION">Correccion</option>
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-stone-700">Porcentaje</span>
                  <input
                    className="nibol-field h-11 text-sm"
                    disabled={isBusy}
                    max={100}
                    min={0}
                    onChange={(event) => {
                      setProgressForm((current) => ({
                        ...current,
                        progressPercent: event.target.value,
                      }));
                    }}
                    placeholder="0-100"
                    type="number"
                    value={progressForm.progressPercent}
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-stone-700">Plan de remediacion</span>
                  <select
                    className="nibol-field h-11 text-sm"
                    disabled={isBusy}
                    onChange={(event) => {
                      setProgressForm((current) => ({
                        ...current,
                        commitmentId:
                          current.commitmentId &&
                          workspace.commitments.some(
                            (commitment) =>
                              commitment.id === current.commitmentId &&
                              commitment.remediationPlanId === event.target.value,
                          )
                            ? current.commitmentId
                            : "",
                        remediationPlanId: event.target.value,
                      }));
                    }}
                    value={progressForm.remediationPlanId}
                  >
                    <option value="">Observacion general</option>
                    {workspace.plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.area.name} · {plan.responsibleUser?.name ?? "Sin responsable"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-stone-700">Compromiso vinculado</span>
                  <select
                    className="nibol-field h-11 text-sm"
                    disabled={isBusy}
                    onChange={(event) => {
                      const selectedCommitment = workspace.commitments.find(
                        (commitment) => commitment.id === event.target.value,
                      );

                      setProgressForm((current) => ({
                        ...current,
                        commitmentId: event.target.value,
                        remediationPlanId:
                          selectedCommitment?.remediationPlanId ?? current.remediationPlanId,
                      }));
                    }}
                    value={progressForm.commitmentId}
                  >
                    <option value="">Sin compromiso especifico</option>
                    {filteredCommitments.map((commitment) => (
                      <option key={commitment.id} value={commitment.id}>
                        {commitment.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-stone-700">Comentario</span>
                  <textarea
                    className="nibol-field min-h-28 resize-y py-3"
                    disabled={isBusy}
                    onChange={(event) => {
                      setProgressForm((current) => ({
                        ...current,
                        comment: event.target.value,
                      }));
                    }}
                    placeholder="Explique el avance ejecutado, el cierre logrado o la correccion aplicada."
                    value={progressForm.comment}
                  />
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
                <div
                  {...progressDropzone.getRootProps()}
                  className="rounded-[1.2rem] border border-dashed border-stone-300 bg-white px-5 py-5 text-sm text-stone-600 transition hover:border-[var(--primary)]"
                >
                  <input {...progressDropzone.getInputProps()} />
                  <div className="space-y-3">
                    <p className="font-semibold text-stone-900">
                      Adjuntar evidencia del avance
                    </p>
                    <p>
                      Puede dejar archivos listos para guardarlos con el borrador o enviarlos
                      junto al avance.
                    </p>
                    {progressFiles.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {progressFiles.map((file) => (
                          <span
                            key={`${file.name}-${file.lastModified}`}
                            className="inline-flex items-center gap-2 border border-stone-200 bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-stone-700"
                          >
                            {file.name}
                            <button
                              className="text-stone-500 transition hover:text-rose-700"
                              onClick={(event) => {
                                event.stopPropagation();
                                setProgressFiles((current) =>
                                  current.filter((item) => item !== file),
                                );
                              }}
                              type="button"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <textarea
                  className="nibol-field min-h-28 resize-y py-3"
                  disabled={isBusy}
                  onChange={(event) => {
                    setProgressEvidenceDescription(event.target.value);
                  }}
                  placeholder="Descripcion de la evidencia adjunta."
                  value={progressEvidenceDescription}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  className="nibol-btn-secondary px-4 py-2.5 text-sm"
                  disabled={isBusy || progressForm.comment.trim().length === 0}
                  onClick={() => {
                    void saveProgressMutation.mutateAsync("draft");
                  }}
                  type="button"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Guardar borrador
                </button>
                <button
                  className="nibol-btn-primary px-4 py-2.5 text-sm"
                  disabled={isBusy || progressForm.comment.trim().length === 0}
                  onClick={() => {
                    void saveProgressMutation.mutateAsync("audit");
                  }}
                  type="button"
                >
                  <Send className="h-4 w-4" />
                  Enviar a Auditoria
                </button>
                {editingProgressId ? (
                  <button
                    className="nibol-btn-ghost px-4 py-2.5 text-sm"
                    onClick={() => {
                      setEditingProgressId(null);
                      setProgressFiles([]);
                      setProgressEvidenceDescription("");
                      setProgressForm(emptyProgressForm);
                    }}
                    type="button"
                  >
                    Cancelar edicion
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {workspace.progressUpdates.length > 0 ? (
              workspace.progressUpdates.map((progressUpdate) => (
                <article
                  key={progressUpdate.id}
                  className="border border-stone-200 bg-white px-5 py-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                            getProgressTypeClasses(progressUpdate.type),
                          )}
                        >
                          {getProgressTypeLabel(progressUpdate.type)}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                            getProgressStatusClasses(progressUpdate.status),
                          )}
                        >
                          {getProgressStatusLabel(progressUpdate.status)}
                        </span>
                        {progressUpdate.progressPercent !== null ? (
                          <span className="inline-flex items-center border border-stone-200 bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-700">
                            {progressUpdate.progressPercent}% de avance
                          </span>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-stone-950">
                          {progressUpdate.submittedByUser.name}
                          <span className="ml-2 text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
                            {progressUpdate.submittedByUser.roleLabel ?? "Responsable"}
                          </span>
                        </p>
                        <p className="text-sm leading-7 text-stone-700">
                          {progressUpdate.comment}
                        </p>
                        <p className="text-xs text-stone-500">
                          Registrado {formatProgressDate(progressUpdate.createdAt)}
                          {progressUpdate.reviewedAt
                            ? ` · Revisado ${formatProgressDate(progressUpdate.reviewedAt)}`
                            : ""}
                        </p>
                        {progressUpdate.reviewComment ? (
                          <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            <p className="font-semibold">Observacion de Auditoria</p>
                            <p className="mt-1">{progressUpdate.reviewComment}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {progressUpdate.canEdit ? (
                        <button
                          className="nibol-btn-secondary px-3 py-2 text-sm"
                          onClick={() => {
                            setEditingProgressId(progressUpdate.id);
                            setProgressFiles([]);
                            setProgressEvidenceDescription("");
                            setProgressForm({
                              comment: progressUpdate.comment,
                              commitmentId: progressUpdate.commitmentId ?? "",
                              progressPercent:
                                progressUpdate.progressPercent !== null
                                  ? String(progressUpdate.progressPercent)
                                  : "",
                              remediationPlanId: progressUpdate.remediationPlanId ?? "",
                              type: progressUpdate.type,
                            });
                          }}
                          type="button"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                      ) : null}
                      {progressUpdate.canSendToAudit &&
                      progressUpdate.status !== "SENT_TO_AUDIT" ? (
                        <button
                          className="nibol-btn-primary px-3 py-2 text-sm"
                          disabled={sendProgressMutation.isPending}
                          onClick={() => {
                            void sendProgressMutation.mutateAsync(progressUpdate.id);
                          }}
                          type="button"
                        >
                          <Send className="h-4 w-4" />
                          Enviar
                        </button>
                      ) : null}
                      {progressUpdate.canApprove ? (
                        <button
                          className="nibol-btn-secondary px-3 py-2 text-sm"
                          onClick={() => {
                            setReviewComposer({
                              action: "approve",
                              comment: progressUpdate.reviewComment ?? "",
                              progressUpdateId: progressUpdate.id,
                            });
                          }}
                          type="button"
                        >
                          <CheckCheck className="h-4 w-4" />
                          Aprobar
                        </button>
                      ) : null}
                      {progressUpdate.canReturn ? (
                        <button
                          className="nibol-btn-secondary px-3 py-2 text-sm"
                          onClick={() => {
                            setReviewComposer({
                              action: "return",
                              comment: progressUpdate.reviewComment ?? "",
                              progressUpdateId: progressUpdate.id,
                            });
                          }}
                          type="button"
                        >
                          Devolver
                        </button>
                      ) : null}
                      {progressUpdate.canReject ? (
                        <button
                          className="nibol-btn-secondary px-3 py-2 text-sm text-rose-700"
                          onClick={() => {
                            setReviewComposer({
                              action: "reject",
                              comment: progressUpdate.reviewComment ?? "",
                              progressUpdateId: progressUpdate.id,
                            });
                          }}
                          type="button"
                        >
                          Rechazar
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {progressUpdate.evidences.length > 0 ? (
                    <div className="mt-5 grid gap-3">
                      {progressUpdate.evidences.map((evidence) => {
                        const Icon = getEvidenceIcon(evidence.mimeType);

                        return (
                          <div
                            key={evidence.id}
                            className="flex flex-col gap-3 border border-stone-200 bg-[var(--surface-soft)] px-4 py-3 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-white p-2 text-[var(--primary)]">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-stone-900">
                                  {evidence.originalName}
                                </p>
                                <p className="text-xs text-stone-500">
                                  {formatFileSize(evidence.sizeBytes)}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="nibol-btn-secondary px-3 py-2 text-sm"
                                onClick={() => {
                                  void progressService.downloadEvidence(evidence);
                                }}
                                type="button"
                              >
                                <Download className="h-4 w-4" />
                                Descargar
                              </button>
                              {evidence.canDelete ? (
                                <button
                                  className="nibol-btn-secondary px-3 py-2 text-sm text-rose-700"
                                  onClick={() => {
                                    void evidenceDeleteMutation.mutateAsync(evidence.id);
                                  }}
                                  type="button"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Eliminar
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {progressUpdate.history.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {progressUpdate.history.map((entry) => (
                        <span
                          key={entry.id}
                          className="inline-flex items-center gap-2 border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600"
                        >
                          <span className="font-semibold text-stone-800">
                            {getReviewActionLabel(entry.action)}
                          </span>
                          <span>{formatProgressDate(entry.createdAt)}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {reviewComposer?.progressUpdateId === progressUpdate.id ? (
                    <div className="mt-5 space-y-3 border border-stone-200 bg-[var(--surface-soft)] p-4">
                      <p className="text-sm font-semibold text-stone-900">
                        {reviewComposer.action === "approve"
                          ? "Comentario de aprobacion"
                          : reviewComposer.action === "return"
                            ? "Motivo de devolucion"
                            : "Motivo de rechazo"}
                      </p>
                      <textarea
                        className="nibol-field min-h-28 resize-y py-3"
                        disabled={reviewProgressMutation.isPending}
                        onChange={(event) => {
                          setReviewComposer((current) =>
                            current
                              ? {
                                  ...current,
                                  comment: event.target.value,
                                }
                              : current,
                          );
                        }}
                        placeholder="Registre el criterio de Auditoria para dejar trazabilidad."
                        value={reviewComposer.comment}
                      />
                      <div className="flex flex-wrap gap-3">
                        <button
                          className="nibol-btn-primary px-4 py-2.5 text-sm"
                          disabled={reviewProgressMutation.isPending}
                          onClick={() => {
                            void reviewProgressMutation.mutateAsync();
                          }}
                          type="button"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Confirmar {getReviewActionLabel(reviewComposer.action.toUpperCase() as never).toLowerCase()}
                        </button>
                        <button
                          className="nibol-btn-ghost px-4 py-2.5 text-sm"
                          onClick={() => {
                            setReviewComposer(null);
                          }}
                          type="button"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <EmptyState
                description="Todavia no se registraron avances para esta observacion. Use el formulario superior para comenzar la trazabilidad."
                icon={Send}
                title="Sin avances registrados"
              />
            )}
          </div>
        </section>

        {workspaceError ? (
          <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {workspaceError}
          </div>
        ) : null}
      </div>

      <aside className="nibol-panel flex h-full flex-col p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            Comentarios con Auditoria
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
            Conversacion trazable
          </h3>
          <p className="text-sm leading-7 text-stone-700">
            Mantenga visible el intercambio operativo y las observaciones de revision sobre la
            misma ficha del hallazgo.
          </p>
        </div>

        <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <article
                key={comment.id}
                className="border border-stone-200 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-950">
                      {comment.authorUser.name}
                    </p>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      {comment.authorUser.roleLabel ?? "Usuario"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                        getCommentVisibilityClasses(comment.visibility),
                      )}
                    >
                      {getCommentVisibilityLabel(comment.visibility)}
                    </span>
                    <span className="text-xs text-stone-500">
                      {formatProgressDate(comment.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-700">{comment.body}</p>
                {(comment.canEdit || comment.canDelete) && canShowComment(comment) ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {comment.canEdit ? (
                      <button
                        className="nibol-btn-ghost px-3 py-2 text-sm"
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setCommentDraft(comment.body);
                          setCommentVisibility(comment.visibility);
                        }}
                        type="button"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                    ) : null}
                    {comment.canDelete ? (
                      <button
                        className="nibol-btn-ghost px-3 py-2 text-sm text-rose-700"
                        disabled={deleteCommentMutation.isPending}
                        onClick={() => {
                          void deleteCommentMutation.mutateAsync(comment.id);
                        }}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-[var(--surface-soft)] px-4 py-4 text-sm text-stone-600">
              No hay comentarios visibles todavia para esta observacion.
            </div>
          )}
        </div>

        {workspace.canComment ? (
          <div className="mt-5 space-y-3 border border-stone-200 bg-[var(--surface-soft)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-stone-900">
                {editingCommentId ? "Editar comentario" : "Escribir mensaje"}
              </p>
              {workspace.canReview ? (
                <select
                  className="nibol-field h-10 max-w-[12rem] text-sm"
                  disabled={saveCommentMutation.isPending}
                  onChange={(event) => {
                    setCommentVisibility(event.target.value as CommentVisibility);
                  }}
                  value={commentVisibility}
                >
                  <option value="AREA_VISIBLE">Visible para el area</option>
                  <option value="INTERNAL_AUDIT">Interno Auditoria</option>
                </select>
              ) : null}
            </div>

            <textarea
              className="nibol-field min-h-28 resize-y py-3"
              disabled={saveCommentMutation.isPending}
              onChange={(event) => {
                setCommentDraft(event.target.value);
              }}
              placeholder="Escribir mensaje..."
              value={commentDraft}
            />

            <div className="flex flex-wrap gap-3">
              <button
                className="nibol-btn-primary px-4 py-2.5 text-sm"
                disabled={saveCommentMutation.isPending || commentDraft.trim().length === 0}
                onClick={() => {
                  void saveCommentMutation.mutateAsync();
                }}
                type="button"
              >
                <MessageSquare className="h-4 w-4" />
                {editingCommentId ? "Actualizar comentario" : "Enviar comentario"}
              </button>
              {editingCommentId ? (
                <button
                  className="nibol-btn-ghost px-4 py-2.5 text-sm"
                  onClick={() => {
                    setEditingCommentId(null);
                    setCommentDraft("");
                    setCommentVisibility("AREA_VISIBLE");
                  }}
                  type="button"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </aside>
    </section>
  );
}
