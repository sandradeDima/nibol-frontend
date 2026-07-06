"use client";

import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCheck,
  ClipboardCheck,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { observationService } from "@/services/observation-service";
import { remediationService } from "@/services/remediation-service";
import type { CommitmentDetail, CommitmentPayload } from "@/types";
import { cn, getApiErrorMessage } from "@/utils";

import { formatObservationDate, getRiskLevelClasses } from "../observations/presentation";
import {
  formatRemediationDate,
  getCommitmentStatusClasses,
  getDeadlineIndicator,
  getRemediationPlanStatusClasses,
  getRemediationPlanStatusLabel,
} from "./presentation";

type RemediationWorkspaceProps = {
  observationId: string;
};

type CommitmentFormState = {
  description: string;
  dueDate: string;
  progressPercent: string;
  responsibleUserId: string;
  title: string;
};

const emptyCommitmentForm: CommitmentFormState = {
  description: "",
  dueDate: "",
  progressPercent: "0",
  responsibleUserId: "",
  title: "",
};

const fieldClassName = "nibol-field h-auto py-3";
const sectionClassName = "nibol-panel p-6";

export function RemediationWorkspace({
  observationId,
}: RemediationWorkspaceProps) {
  const queryClient = useQueryClient();
  const [selectedAreaId, setSelectedAreaId] = useState<string | undefined>(undefined);
  const [planForm, setPlanForm] = useState({
    additionalComments: "",
    mitigationText: "",
    ownerUserId: "",
    strategyText: "",
  });
  const [planError, setPlanError] = useState<string | null>(null);
  const [planSuccess, setPlanSuccess] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [editingCommitmentId, setEditingCommitmentId] = useState<string | null>(null);
  const [commitmentFormVisible, setCommitmentFormVisible] = useState(false);
  const [commitmentForm, setCommitmentForm] =
    useState<CommitmentFormState>(emptyCommitmentForm);
  const [commitmentError, setCommitmentError] = useState<string | null>(null);

  const workspaceQuery = useQuery({
    queryFn: () =>
      remediationService.getObservationWorkspace(observationId, selectedAreaId),
    queryKey: QUERY_KEYS.remediationWorkspace(observationId, selectedAreaId),
  });

  const optionsQuery = useQuery({
    queryFn: observationService.getObservationOptions,
    queryKey: QUERY_KEYS.configurationBootstrap,
    staleTime: 60_000,
  });

  const planId = workspaceQuery.data?.plan?.id;

  const commitmentsQuery = useQuery({
    enabled: Boolean(planId),
    queryFn: () => remediationService.getPlanCommitments(planId!),
    queryKey: planId
      ? QUERY_KEYS.remediationPlanCommitments(planId)
      : ["remediation", "plan-commitments", "empty"],
  });

  useEffect(() => {
    if (!selectedAreaId && workspaceQuery.data?.selectedAreaId) {
      setSelectedAreaId(workspaceQuery.data.selectedAreaId);
    }
  }, [selectedAreaId, workspaceQuery.data?.selectedAreaId]);

  useEffect(() => {
    const plan = workspaceQuery.data?.plan;

    setPlanForm({
      additionalComments: plan?.additionalComments ?? "",
      mitigationText: plan?.mitigationText ?? "",
      ownerUserId: plan?.ownerUser?.id ?? "",
      strategyText: plan?.strategyText ?? "",
    });
    setPlanError(null);
    setPlanSuccess(null);
    setReturnReason(plan?.returnReason ?? "");
  }, [workspaceQuery.data?.plan?.id, workspaceQuery.data?.selectedAreaId]);

  const refreshWorkspace = async () => {
    await queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.remediationWorkspace(observationId, selectedAreaId),
    });

    if (planId) {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.remediationPlanCommitments(planId),
      });
    }

    await queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.observationDetails(observationId),
    });
    await queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.remediationPlans,
    });
    await queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.commitmentSchedule,
    });
  };

  const savePlanMutation = useMutation({
    mutationFn: async (mode: "draft" | "audit") => {
      const areaId = selectedAreaId ?? workspaceQuery.data?.selectedAreaId;

      if (!areaId) {
        throw new Error("Seleccione un area para continuar.");
      }

      const savedPlan = await remediationService.saveObservationPlan(observationId, {
        additionalComments: planForm.additionalComments.trim() || null,
        areaId,
        mitigationText: planForm.mitigationText.trim() || null,
        ownerUserId: planForm.ownerUserId || null,
        strategyText: planForm.strategyText.trim(),
      });

      if (mode === "audit") {
        await remediationService.sendPlanToAudit(savedPlan.id);
      }

      return mode;
    },
    onError: (error) => {
      setPlanSuccess(null);
      setPlanError(getApiErrorMessage(error));
    },
    onSuccess: async (mode) => {
      setPlanError(null);
      setPlanSuccess(
        mode === "audit"
          ? "El plan fue enviado a Auditoria para revision."
          : "El plan se guardo en borrador.",
      );
      await refreshWorkspace();
    },
  });

  const approvePlanMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceQuery.data?.plan) {
        throw new Error("No hay un plan para aprobar.");
      }

      await remediationService.approvePlan(workspaceQuery.data.plan.id);
    },
    onError: (error) => {
      setPlanSuccess(null);
      setPlanError(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setPlanError(null);
      setPlanSuccess("El plan fue aprobado correctamente.");
      await refreshWorkspace();
    },
  });

  const returnPlanMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceQuery.data?.plan) {
        throw new Error("No hay un plan para devolver.");
      }

      await remediationService.returnPlan(
        workspaceQuery.data.plan.id,
        returnReason.trim(),
      );
    },
    onError: (error) => {
      setPlanSuccess(null);
      setPlanError(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setPlanError(null);
      setPlanSuccess("El plan fue devuelto al area responsable.");
      await refreshWorkspace();
    },
  });

  const commitmentSaveMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceQuery.data?.plan) {
        throw new Error("Guarde el plan antes de registrar compromisos.");
      }

      const payload: CommitmentPayload = {
        description: commitmentForm.description.trim() || null,
        dueDate: commitmentForm.dueDate,
        progressPercent: Number(commitmentForm.progressPercent || "0"),
        responsibleUserId: commitmentForm.responsibleUserId || null,
        title: commitmentForm.title.trim(),
      };

      if (editingCommitmentId) {
        await remediationService.updateCommitment(editingCommitmentId, payload);
      } else {
        await remediationService.createCommitment(workspaceQuery.data.plan.id, payload);
      }
    },
    onError: (error) => {
      setCommitmentError(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setCommitmentError(null);
      setCommitmentForm(emptyCommitmentForm);
      setEditingCommitmentId(null);
      setCommitmentFormVisible(false);
      await refreshWorkspace();
    },
  });

  const commitmentActionMutation = useMutation({
    mutationFn: async ({
      commitment,
      action,
    }: {
      action: "complete" | "delete" | "send";
      commitment: CommitmentDetail;
    }) => {
      if (action === "delete") {
        await remediationService.deleteCommitment(commitment.id);
        return;
      }

      if (action === "send") {
        await remediationService.sendCommitmentToAudit(commitment.id);
        return;
      }

      await remediationService.markCommitmentComplete(commitment.id);
    },
    onError: (error) => {
      setCommitmentError(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setCommitmentError(null);
      await refreshWorkspace();
    },
  });

  if (workspaceQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void workspaceQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={workspaceQuery.error.message}
        title="No fue posible cargar el espacio de remediacion"
      />
    );
  }

  if (!workspaceQuery.data) {
    return (
      <section className={sectionClassName}>
        <div className="flex items-center gap-3 text-sm text-stone-600">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Cargando plan de remediacion...
        </div>
      </section>
    );
  }

  const workspace = workspaceQuery.data;
  const commitments = commitmentsQuery.data ?? [];
  const currentPlan = workspace.plan;
  const nextAction =
    currentPlan?.canApprove || currentPlan?.canReturn
      ? "Revision de Auditoria"
      : currentPlan?.canSendToAudit
        ? "Completar y enviar a Auditoria"
        : currentPlan
          ? "Seguimiento de compromisos"
          : "Registrar estrategia del area";
  const dueIndicator = getDeadlineIndicator(currentPlan?.nextDueDate ?? workspace.observation.dueDate);
  const isBusy =
    savePlanMutation.isPending ||
    approvePlanMutation.isPending ||
    returnPlanMutation.isPending ||
    commitmentSaveMutation.isPending ||
    commitmentActionMutation.isPending;

  return (
    <section className="space-y-6">
      <section className={sectionClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Planes de remediacion
            </p>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
                Respuesta y estrategia del area
              </h3>
              <p className="max-w-3xl text-sm leading-7 text-stone-700">
                Defina la respuesta del area, la mitigacion y el cronograma de compromisos
                para la observacion {workspace.observation.code}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <span
              className={cn(
                "inline-flex items-center border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em]",
                getRiskLevelClasses(workspace.observation.riskLevel.colorToken),
              )}
            >
              {workspace.observation.riskLevel.name}
            </span>
            {currentPlan ? (
              <span
                className={cn(
                  "inline-flex items-center border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em]",
                  getRemediationPlanStatusClasses(currentPlan.status),
                )}
              >
                {getRemediationPlanStatusLabel(currentPlan.status)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {workspace.areas.map((areaItem) => (
            <button
              key={areaItem.area.id}
              className={cn(
                "rounded-[1rem] border px-4 py-3 text-left transition",
                areaItem.area.id === workspace.selectedAreaId
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
              )}
              onClick={() => {
                setSelectedAreaId(areaItem.area.id);
              }}
              type="button"
            >
              <p className="text-sm font-semibold">{areaItem.area.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-current/70">
                {areaItem.isPrimary ? "Area principal" : areaItem.roleInFinding || "Area relacionada"}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className={sectionClassName}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Estrategia del area</span>
                <textarea
                  className="nibol-field min-h-32 resize-y py-3"
                  disabled={isBusy || !workspace.canManageSelectedArea}
                  onChange={(event) => {
                    setPlanForm((current) => ({
                      ...current,
                      strategyText: event.target.value,
                    }));
                  }}
                  placeholder="Explique la respuesta oficial del area frente al hallazgo."
                  value={planForm.strategyText}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Plan de mitigacion</span>
                <textarea
                  className="nibol-field min-h-32 resize-y py-3"
                  disabled={isBusy || !workspace.canManageSelectedArea}
                  onChange={(event) => {
                    setPlanForm((current) => ({
                      ...current,
                      mitigationText: event.target.value,
                    }));
                  }}
                  placeholder="Detalle acciones preventivas y correctivas."
                  value={planForm.mitigationText}
                />
              </label>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-[1fr_18rem]">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Comentarios adicionales</span>
                <textarea
                  className="nibol-field min-h-28 resize-y py-3"
                  disabled={isBusy || !workspace.canManageSelectedArea}
                  onChange={(event) => {
                    setPlanForm((current) => ({
                      ...current,
                      additionalComments: event.target.value,
                    }));
                  }}
                  placeholder="Agregue supuestos, dependencias o limitaciones relevantes."
                  value={planForm.additionalComments}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Responsable del plan</span>
                <select
                  className={fieldClassName}
                  disabled={isBusy || !workspace.canManageSelectedArea}
                  onChange={(event) => {
                    setPlanForm((current) => ({
                      ...current,
                      ownerUserId: event.target.value,
                    }));
                  }}
                  value={planForm.ownerUserId}
                >
                  <option value="">Seleccionar</option>
                  {(optionsQuery.data?.users ?? []).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {planError ? (
              <div className="mt-5 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {planError}
              </div>
            ) : null}

            {planSuccess ? (
              <div className="mt-5 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {planSuccess}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              {workspace.canManageSelectedArea ? (
                <>
                  <button
                    className="nibol-btn-secondary px-4 py-2.5 text-sm"
                    disabled={isBusy || planForm.strategyText.trim().length === 0}
                    onClick={() => {
                      void savePlanMutation.mutateAsync("draft");
                    }}
                    type="button"
                  >
                    <Save className="h-4 w-4" />
                    Guardar borrador
                  </button>
                  <button
                    className="nibol-btn-primary px-4 py-2.5 text-sm"
                    disabled={isBusy || planForm.strategyText.trim().length === 0}
                    onClick={() => {
                      void savePlanMutation.mutateAsync("audit");
                    }}
                    type="button"
                  >
                    <Send className="h-4 w-4" />
                    Enviar a Auditoria
                  </button>
                </>
              ) : null}

              {currentPlan?.canApprove ? (
                <button
                  className="nibol-btn-primary px-4 py-2.5 text-sm"
                  disabled={isBusy}
                  onClick={() => {
                    void approvePlanMutation.mutateAsync();
                  }}
                  type="button"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Aprobar plan
                </button>
              ) : null}
            </div>

            {currentPlan?.canReturn ? (
              <div className="mt-5 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-amber-900">
                    Motivo de devolucion
                  </span>
                  <textarea
                    className="nibol-field min-h-24 resize-y py-3"
                    disabled={isBusy}
                    onChange={(event) => {
                      setReturnReason(event.target.value);
                    }}
                    placeholder="Explique los ajustes requeridos antes de aprobar."
                    value={returnReason}
                  />
                </label>
                <div className="mt-4">
                  <button
                    className="nibol-btn-secondary px-4 py-2.5 text-sm"
                    disabled={isBusy || returnReason.trim().length < 3}
                    onClick={() => {
                      void returnPlanMutation.mutateAsync();
                    }}
                    type="button"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Devolver al area
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className={sectionClassName}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                  Cronograma de compromisos
                </p>
                <h4 className="text-xl font-semibold text-stone-950">
                  Hitos y responsables
                </h4>
              </div>

              {currentPlan?.canEdit ? (
                <button
                  className="nibol-btn-primary px-4 py-2.5 text-sm"
                  onClick={() => {
                    setEditingCommitmentId(null);
                    setCommitmentForm(emptyCommitmentForm);
                    setCommitmentError(null);
                    setCommitmentFormVisible((current) => !current);
                  }}
                  type="button"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  {commitmentFormVisible ? "Ocultar formulario" : "Agregar compromiso"}
                </button>
              ) : null}
            </div>

            {commitmentFormVisible ? (
              <div className="mt-5 rounded-[1.2rem] border border-stone-200/90 bg-[var(--surface-soft)] p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-stone-700">Compromiso</span>
                    <input
                      className={fieldClassName}
                      disabled={isBusy}
                      onChange={(event) => {
                        setCommitmentForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }));
                      }}
                      placeholder="Describa el compromiso"
                      value={commitmentForm.title}
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-stone-700">Responsable</span>
                    <select
                      className={fieldClassName}
                      disabled={isBusy}
                      onChange={(event) => {
                        setCommitmentForm((current) => ({
                          ...current,
                          responsibleUserId: event.target.value,
                        }));
                      }}
                      value={commitmentForm.responsibleUserId}
                    >
                      <option value="">Sin asignar</option>
                      {(optionsQuery.data?.users ?? []).map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-stone-700">Descripcion</span>
                    <textarea
                      className="nibol-field min-h-24 resize-y py-3"
                      disabled={isBusy}
                      onChange={(event) => {
                        setCommitmentForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }));
                      }}
                      placeholder="Amplie el objetivo o el entregable esperado."
                      value={commitmentForm.description}
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-stone-700">Fecha limite</span>
                    <input
                      className={fieldClassName}
                      disabled={isBusy}
                      onChange={(event) => {
                        setCommitmentForm((current) => ({
                          ...current,
                          dueDate: event.target.value,
                        }));
                      }}
                      type="date"
                      value={commitmentForm.dueDate}
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-stone-700">% Avance</span>
                    <input
                      className={fieldClassName}
                      disabled={isBusy}
                      max={100}
                      min={0}
                      onChange={(event) => {
                        setCommitmentForm((current) => ({
                          ...current,
                          progressPercent: event.target.value,
                        }));
                      }}
                      type="number"
                      value={commitmentForm.progressPercent}
                    />
                  </label>
                </div>

                {commitmentError ? (
                  <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {commitmentError}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className="nibol-btn-primary px-4 py-2.5 text-sm"
                    disabled={
                      isBusy ||
                      commitmentForm.title.trim().length === 0 ||
                      commitmentForm.dueDate.length === 0
                    }
                    onClick={() => {
                      void commitmentSaveMutation.mutateAsync();
                    }}
                    type="button"
                  >
                    <Save className="h-4 w-4" />
                    {editingCommitmentId ? "Guardar cambios" : "Guardar compromiso"}
                  </button>
                  <button
                    className="nibol-btn-secondary px-4 py-2.5 text-sm"
                    disabled={isBusy}
                    onClick={() => {
                      setCommitmentFormVisible(false);
                      setEditingCommitmentId(null);
                      setCommitmentForm(emptyCommitmentForm);
                      setCommitmentError(null);
                    }}
                    type="button"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}

            {commitmentsQuery.isError ? (
              <div className="mt-5 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {commitmentsQuery.error.message}
              </div>
            ) : null}

            {commitmentsQuery.isLoading && currentPlan ? (
              <div className="mt-5 flex items-center gap-3 text-sm text-stone-600">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Cargando compromisos...
              </div>
            ) : null}

            {!currentPlan ? (
              <div className="mt-5 rounded-[1.2rem] border border-dashed border-stone-300 bg-[var(--surface-soft)] px-4 py-4 text-sm leading-7 text-stone-600">
                Guarde primero la estrategia del area para habilitar el cronograma de compromisos.
              </div>
            ) : commitments.length === 0 ? (
              <div className="mt-5 rounded-[1.2rem] border border-dashed border-stone-300 bg-[var(--surface-soft)] px-4 py-4 text-sm leading-7 text-stone-600">
                Todavia no hay compromisos registrados para esta area.
              </div>
            ) : (
              <div className="mt-5 overflow-hidden border border-stone-200/90">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead className="bg-[var(--surface-soft)]">
                    <tr>
                      {[
                        "Compromiso",
                        "Responsable",
                        "Fecha limite",
                        "Estado",
                        "%",
                        "Accion",
                      ].map((header) => (
                        <th
                          key={header}
                          className="border-b border-stone-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-500"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commitments.map((commitment) => {
                      const indicator = getDeadlineIndicator(commitment.dueDate);

                      return (
                        <tr key={commitment.id} className="bg-white">
                          <td className="border-b border-stone-100 px-4 py-4 align-top">
                            <p className="font-semibold text-stone-950">{commitment.title}</p>
                            <p className="mt-1 max-w-xl text-sm text-stone-600">
                              {commitment.description || "Sin descripcion adicional."}
                            </p>
                          </td>
                          <td className="border-b border-stone-100 px-4 py-4 align-top text-sm text-stone-700">
                            {commitment.responsibleUser?.name ?? "Sin asignar"}
                          </td>
                          <td className="border-b border-stone-100 px-4 py-4 align-top">
                            <p className="whitespace-nowrap text-sm text-stone-700">
                              {formatRemediationDate(commitment.dueDate)}
                            </p>
                            <span
                              className={cn(
                                "mt-2 inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                                indicator.tone,
                              )}
                            >
                              {indicator.label}
                            </span>
                          </td>
                          <td className="border-b border-stone-100 px-4 py-4 align-top">
                            <span
                              className={cn(
                                "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                                getCommitmentStatusClasses(
                                  commitment.effectiveStatus.key as never,
                                ),
                              )}
                            >
                              {commitment.effectiveStatus.name}
                            </span>
                          </td>
                          <td className="border-b border-stone-100 px-4 py-4 align-top">
                            <div className="min-w-[8rem] space-y-2">
                              <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                                <div
                                  className="h-full bg-[var(--primary)] transition-[width]"
                                  style={{
                                    width: `${commitment.progressPercent}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-stone-700">
                                {commitment.progressPercent}%
                              </span>
                            </div>
                          </td>
                          <td className="border-b border-stone-100 px-4 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              {commitment.canEditStructure ? (
                                <button
                                  className="nibol-btn-secondary px-3 py-2 text-xs"
                                  onClick={() => {
                                    setEditingCommitmentId(commitment.id);
                                    setCommitmentFormVisible(true);
                                    setCommitmentError(null);
                                    setCommitmentForm({
                                      description: commitment.description ?? "",
                                      dueDate: commitment.dueDate.slice(0, 10),
                                      progressPercent: String(commitment.progressPercent),
                                      responsibleUserId: commitment.responsibleUser?.id ?? "",
                                      title: commitment.title,
                                    });
                                  }}
                                  type="button"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Editar
                                </button>
                              ) : null}

                              {commitment.canDelete ? (
                                <button
                                  className="nibol-btn-secondary px-3 py-2 text-xs"
                                  onClick={() => {
                                    void commitmentActionMutation.mutateAsync({
                                      action: "delete",
                                      commitment,
                                    });
                                  }}
                                  type="button"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Eliminar
                                </button>
                              ) : null}

                              {commitment.canMarkComplete ? (
                                <button
                                  className="nibol-btn-primary px-3 py-2 text-xs"
                                  onClick={() => {
                                    void commitmentActionMutation.mutateAsync({
                                      action: "complete",
                                      commitment,
                                    });
                                  }}
                                  type="button"
                                >
                                  <CheckCheck className="h-3.5 w-3.5" />
                                  Completar
                                </button>
                              ) : null}

                              {commitment.canSendToAudit ? (
                                <button
                                  className="nibol-btn-primary px-3 py-2 text-xs"
                                  onClick={() => {
                                    void commitmentActionMutation.mutateAsync({
                                      action: "send",
                                      commitment,
                                    });
                                  }}
                                  type="button"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  Enviar
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className={sectionClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Estado de seguimiento
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.2rem] border border-stone-200/90 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Area activa
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-950">
                  {
                    workspace.areas.find((areaItem) => areaItem.area.id === workspace.selectedAreaId)
                      ?.area.name
                  }
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {
                    workspace.areas.find((areaItem) => areaItem.area.id === workspace.selectedAreaId)
                      ?.responsibleUser?.name ?? "Sin responsable definido"
                  }
                </p>
              </div>

              <div className="rounded-[1.2rem] border border-stone-200/90 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Ultima actualizacion
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-950">
                  {formatRemediationDate(
                    currentPlan?.updatedAt ?? workspace.observation.dueDate,
                    { timeStyle: "short" },
                  )}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  Creado por {currentPlan?.createdByUser.name ?? workspace.observation.auditorUser.name}
                </p>
              </div>

              <div className="rounded-[1.2rem] border border-stone-200/90 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Proxima accion
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-950">{nextAction}</p>
                <p className="mt-1 text-sm text-stone-600">
                  {currentPlan?.nextDueDate
                    ? `Siguiente hito: ${formatRemediationDate(currentPlan.nextDueDate)}`
                    : "Defina el cronograma para comenzar el seguimiento."}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.2rem] border border-stone-200/90 bg-[var(--surface-soft)] px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="rounded-[0.9rem] bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-stone-950">Indicador de plazo</p>
                  <span
                    className={cn(
                      "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                      dueIndicator.tone,
                    )}
                  >
                    {dueIndicator.label}
                  </span>
                  <p className="text-sm leading-7 text-stone-600">
                    Observacion base: {formatObservationDate(workspace.observation.dueDate)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Mini historial
            </p>
            <div className="mt-5 space-y-3">
              {currentPlan?.sentToAuditAt ? (
                <div className="rounded-[1rem] border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
                  Enviado a Auditoria el {formatRemediationDate(currentPlan.sentToAuditAt)}
                </div>
              ) : null}
              {currentPlan?.approvedAt ? (
                <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Aprobado el {formatRemediationDate(currentPlan.approvedAt)}
                </div>
              ) : null}
              {currentPlan?.returnedAt ? (
                <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Devuelto el {formatRemediationDate(currentPlan.returnedAt)}
                </div>
              ) : null}
              {!currentPlan ? (
                <div className="rounded-[1rem] border border-dashed border-stone-300 bg-[var(--surface-soft)] px-4 py-3 text-sm text-stone-600">
                  La actividad aparecera aqui una vez que el area registre su primer plan.
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </section>
    </section>
  );
}

