"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileText,
  Pencil,
  Send,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { observationService } from "@/services/observation-service";
import { cn, getApiErrorMessage } from "@/utils";

import { ObservationCollaborationWorkspace } from "../progress/observation-collaboration-workspace";
import { RemediationWorkspace } from "../remediation/remediation-workspace";
import { ObservationActionPanel } from "./observation-action-panel";
import {
  formatObservationDate,
  getRiskLevelClasses,
  getRiskLevelStyle,
  getStatusClasses,
} from "./presentation";

type Props = {
  canAssignRecommendedExecutor: boolean;
  canClose: boolean;
  canCreateActionPlans: boolean;
  canCreateRecommended: boolean;
  canDeleteEvidence: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canEditActionPlans: boolean;
  canEditRecommended: boolean;
  canSend: boolean;
  canSubmitRecommended: boolean;
  canSubmitProgress: boolean;
  canUploadEvidence: boolean;
  canViewRecommended: boolean;
  currentUserId: string;
  observationId: string;
};

type ObservationTab = "detail" | "plans" | "comments";

const observationTabs: Array<{
  key: ObservationTab;
  label: string;
}> = [
  { key: "detail", label: "Detalle de Observación" },
  { key: "plans", label: "Planes de Acción" },
  { key: "comments", label: "Comentarios" },
];

const normalizeTab = (value: string | null): ObservationTab =>
  value === "plans"
    ? "plans"
    : value === "comments" || value === "comentarios"
      ? "comments"
      : "detail";

const getLegacyTab = (): ObservationTab | null => {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  return hash === "#planes-accion"
    ? "plans"
    : hash === "#avances-evidencias"
      ? "plans"
      : null;
};

const subscribeToHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

const remainingLabel = (dateValue: string) => {
  const days = Math.ceil(
    (new Date(dateValue).getTime() - Date.now()) / 86_400_000,
  );
  if (days < 0) return `${Math.abs(days)} días vencida`;
  if (days === 0) return "Vence hoy";
  return `${days} días restantes`;
};

export function ObservationDetail({
  canAssignRecommendedExecutor,
  canClose,
  canCreateActionPlans,
  canCreateRecommended,
  canDeleteEvidence,
  canEditRecommended,
  canDelete,
  canEdit,
  canEditActionPlans,
  canSend,
  canSubmitRecommended,
  canSubmitProgress,
  canUploadEvidence,
  canViewRecommended,
  currentUserId,
  observationId,
}: Props) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyTab = useSyncExternalStore(
    subscribeToHash,
    getLegacyTab,
    () => null,
  );
  const requestedTab = searchParams.get("tab");
  const activeTab = requestedTab
    ? normalizeTab(requestedTab)
    : (legacyTab ?? "detail");
  const activePlanId = searchParams.get("planId");
  const activeAdvanceId = searchParams.get("advanceId");
  const activeEvidenceId = searchParams.get("evidenceId");
  const activeExtensionId = searchParams.get("extensionId");

  const changeTab = (tab: ObservationTab) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", tab === "comments" ? "comentarios" : tab);
    if (tab !== "detail") next.delete("evidenceId");
    if (tab !== "plans") {
      next.delete("planId");
      next.delete("advanceId");
      next.delete("extensionId");
    }
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const query = useQuery({
    queryFn: () => observationService.getObservationById(observationId),
    queryKey: QUERY_KEYS.observationDetails(observationId),
  });
  const closeReadiness = useQuery({
    enabled: canClose,
    queryFn: () => observationService.getObservationActionItems(observationId),
    queryKey: QUERY_KEYS.observationActionItems(observationId),
    staleTime: 30_000,
  });
  const remove = useMutation({
    mutationFn: () => observationService.deleteObservation(observationId),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observations,
      });
      window.location.assign("/observaciones");
    },
  });
  const close = useMutation({
    mutationFn: () => observationService.closeObservation(observationId),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setConfirmClose(false);
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.observationDetails(observationId),
        }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.observations }),
      ]);
    },
  });
  const send = useMutation({
    mutationFn: () => observationService.sendObservation(observationId),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setError(null);
      await query.refetch();
    },
  });
  useEffect(() => {
    const targetId =
      activeTab === "plans" && window.location.hash === "#avances-evidencias"
        ? "avances-evidencias"
        : activeTab === "detail" &&
            window.location.hash === "#documentos-observacion"
          ? "documentos-observacion"
          : null;
    if (!targetId) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, activePlanId, query.data]);
  if (query.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(query.error)}
        title="No fue posible cargar la observación"
      />
    );
  const observation = query.data;
  if (!observation)
    return (
      <section className="nibol-panel p-6 text-sm text-stone-500">
        Cargando detalle…
      </section>
    );
  const canCloseObservation = Boolean(
    canClose &&
    !observation.status.isFinal &&
    closeReadiness.data?.some((item) => item.actionType === "REQUEST_CLOSURE"),
  );

  return (
    <div className="space-y-6">
      <div
        className="sticky top-0 z-10 -mx-4 space-y-2 bg-[var(--background)] pb-1 sm:-mx-6 lg:-mx-8"
        id="observation-detail-sticky"
      >
        <section className="nibol-panel min-w-0 overflow-hidden">
          <div className="border-b border-stone-200 bg-stone-950 px-6 py-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.22em] text-amber-400 uppercase">
                  {observation.displayCode}
                </p>
                <h1 className="mt-2 max-w-4xl text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                  {observation.title}
                </h1>
                <p className="mt-2 text-sm text-stone-300">
                  {observation.auditReport.title}
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  {observation.areas
                    .map((area) => area.area.name)
                    .join(" · ") || "Sin área asignada"}
                </p>
              </div>
              <div className="flex min-w-0 flex-wrap gap-2">
                <Link
                  className="nibol-btn-secondary bg-white px-4 py-2.5 text-sm"
                  href="/observaciones"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Link>
                {canCloseObservation ? (
                  <button
                    className="nibol-btn-secondary bg-white px-4 py-2.5 text-sm"
                    id="cierre-observacion"
                    onClick={() => setConfirmClose(true)}
                    type="button"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Concluir
                  </button>
                ) : null}
                {canSend &&
                !observation.sentAt &&
                !observation.status.isFinal ? (
                  <button
                    className="nibol-btn-secondary bg-white px-4 py-2.5 text-sm"
                    disabled={send.isPending}
                    onClick={() => send.mutate()}
                    type="button"
                  >
                    <Send className="h-4 w-4" />
                    {send.isPending ? "Enviando..." : "Enviar a involucrados"}
                  </button>
                ) : null}
                {canEdit ? (
                  <Link
                    className="nibol-btn-primary px-4 py-2.5 text-sm"
                    href={`/observaciones/${observation.id}/editar`}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
          <div className="grid gap-px bg-stone-200 sm:grid-cols-2 xl:grid-cols-6">
            {[
              ["Nivel", observation.riskLevel.name, "risk"],
              ["Estado", observation.status.name, "status"],
              ["Progreso", `${observation.progressPercent}%`, ""],
              [
                "Fecha original",
                formatObservationDate(observation.originalDueDate),
                "",
              ],
              [
                "Fecha actual",
                formatObservationDate(observation.currentDueDate),
                "",
              ],
              ["Plazo", remainingLabel(observation.currentDueDate), ""],
            ].map(([label, value, kind]) => (
              <div className="bg-white p-3.5 sm:p-4" key={label}>
                <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                  {label}
                </p>
                <p
                  className={cn(
                    "mt-2 text-base font-semibold text-stone-950",
                    kind === "risk" &&
                      `inline-flex border px-2.5 py-1 ${getRiskLevelClasses()}`,
                    kind === "status" &&
                      getStatusClasses(observation.status.key),
                  )}
                  style={
                    kind === "risk"
                      ? getRiskLevelStyle(observation.riskLevel.colorToken)
                      : undefined
                  }
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <nav
          aria-label="Secciones de la observación"
          className="nibol-panel min-w-0 p-2"
        >
          <div
            aria-orientation="horizontal"
            className="flex max-w-full gap-1 overflow-x-auto"
            role="tablist"
          >
            {observationTabs.map((tab, index) => (
              <button
                aria-controls={`observation-tabpanel-${tab.key}`}
                aria-selected={activeTab === tab.key}
                className={cn(
                  "min-h-11 shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none",
                  activeTab === tab.key
                    ? "bg-stone-950 text-white"
                    : "text-stone-600 hover:bg-amber-50 hover:text-stone-950",
                )}
                key={tab.key}
                id={`${tab.key}-tab`}
                onClick={() => changeTab(tab.key)}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft")
                    return;
                  event.preventDefault();
                  const nextIndex =
                    (index +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      observationTabs.length) %
                    observationTabs.length;
                  changeTab(observationTabs[nextIndex]!.key);
                }}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <ObservationActionPanel observationId={observationId} />

      {activeTab === "detail" ? (
        <>
          <div
            aria-labelledby="detail-tab"
            className="min-w-0 space-y-6"
            id="observation-tabpanel-detail"
            role="tabpanel"
          >
            <div className="grid min-w-0 gap-6 xl:grid-cols-[1.45fr_1fr]">
              <section className="nibol-panel p-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-amber-700" />
                  <h3 className="text-xl font-semibold">Observación</h3>
                </div>
                <p className="mt-5 text-sm leading-7 whitespace-pre-wrap text-stone-700">
                  {observation.description}
                </p>
                <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-5">
                  <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                    Recomendación de Auditoría
                  </p>
                  <p className="mt-2 text-sm leading-7 whitespace-pre-wrap text-stone-700">
                    {observation.auditRecommendation}
                  </p>
                </div>
                <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-stone-500">Observación principal</dt>
                    <dd className="mt-1 font-semibold">
                      {observation.mainObservation.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Proceso</dt>
                    <dd className="mt-1 font-semibold">
                      {observation.process ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Auditor</dt>
                    <dd className="mt-1 font-semibold">
                      {observation.auditorUser?.name ?? "Sin asignar"}
                    </dd>
                  </div>
                </dl>
              </section>
              <div className="space-y-6">
                <section className="nibol-panel p-6">
                  <div className="flex items-center gap-3">
                    <CalendarClock className="h-5 w-5 text-amber-700" />
                    <h3 className="text-xl font-semibold">Informe</h3>
                  </div>
                  <dl className="mt-5 space-y-4 text-sm">
                    <div>
                      <dt className="text-stone-500">Número</dt>
                      <dd className="mt-1 font-semibold">
                        {observation.auditReport.reportNumber}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Título</dt>
                      <dd className="mt-1 font-semibold">
                        {observation.auditReport.title}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Fecha</dt>
                      <dd className="mt-1 font-semibold">
                        {formatObservationDate(
                          observation.auditReport.reportDate,
                        )}
                      </dd>
                    </div>
                  </dl>
                </section>
                <section className="nibol-panel p-6">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-amber-700" />
                    <h3 className="text-xl font-semibold">Riesgos asociados</h3>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {observation.risks.map((risk) => (
                      <span
                        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900"
                        key={risk.id}
                      >
                        {risk.name}
                      </span>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <section className="nibol-panel p-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="text-xl font-semibold">Áreas involucradas</h3>
                  <p className="text-sm text-stone-500">
                    Matriz de responsabilidad y avance agregado por área.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {observation.areas.map((assignment) => (
                  <article
                    className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
                    key={assignment.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-semibold text-stone-950">
                        {assignment.area.name}
                      </h4>
                      <span className="nibol-badge">
                        {assignment.progressPercent}% avance
                      </span>
                    </div>
                    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-stone-500">Dueño del proceso</dt>
                        <dd className="mt-1 font-semibold">
                          {assignment.processOwner.name}
                        </dd>
                        <dd className="text-xs text-stone-500">
                          {assignment.processOwner.jobTitle ??
                            assignment.processOwner.email}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Responsable del área</dt>
                        <dd className="mt-1 font-semibold">
                          {assignment.areaResponsible.name}
                        </dd>
                        <dd className="text-xs text-stone-500">
                          {assignment.areaResponsible.jobTitle ??
                            assignment.areaResponsible.email}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
            <ObservationCollaborationWorkspace
              activeEvidenceId={activeEvidenceId}
              canDeleteEvidence={canDeleteEvidence}
              canSubmitProgress={canSubmitProgress}
              canUploadEvidence={canUploadEvidence}
              currentUserId={currentUserId}
              observationAreas={observation.areas.map((area) => ({
                id: area.id,
                name: area.area.name,
              }))}
              observationId={observationId}
              section="evidence"
            />
          </div>
        </>
      ) : null}

      {activeTab === "comments" ? (
        <div
          aria-labelledby="comments-tab"
          className="min-w-0"
          id="observation-tabpanel-comments"
          role="tabpanel"
        >
          <ObservationCollaborationWorkspace
            canDeleteEvidence={canDeleteEvidence}
            canSubmitProgress={canSubmitProgress}
            canUploadEvidence={canUploadEvidence}
            currentUserId={currentUserId}
            observationAreas={observation.areas.map((area) => ({
              id: area.id,
              name: area.area.name,
            }))}
            observationId={observationId}
            section="comments"
          />
        </div>
      ) : null}

      {activeTab === "plans" ? (
        <div
          aria-labelledby="plans-tab"
          className="min-w-0 space-y-6"
          id="observation-tabpanel-plans"
          role="tabpanel"
        >
          <div id="planes-accion">
            <RemediationWorkspace
              activeExtensionId={activeExtensionId}
              activePlanId={activePlanId}
              canAssignRecommendedExecutor={canAssignRecommendedExecutor}
              canCreateActionPlans={canCreateActionPlans}
              canCreateRecommended={canCreateRecommended}
              canEditActionPlans={canEditActionPlans}
              canEditRecommended={canEditRecommended}
              canSubmitRecommended={canSubmitRecommended}
              canViewRecommended={canViewRecommended}
              observationId={observationId}
            />
          </div>
          <div className="scroll-mt-24" id="avances-evidencias">
            <ObservationCollaborationWorkspace
              activeEvaluationId={activeAdvanceId}
              activePlanId={activePlanId}
              canDeleteEvidence={canDeleteEvidence}
              canSubmitProgress={canSubmitProgress}
              canUploadEvidence={canUploadEvidence}
              currentUserId={currentUserId}
              observationAreas={observation.areas.map((area) => ({
                id: area.id,
                name: area.area.name,
              }))}
              observationId={observationId}
              section="plans"
              key={`plans-${activePlanId ?? "all"}`}
            />
          </div>
        </div>
      ) : null}

      {canDelete ? (
        <div className="flex justify-end">
          <button
            className="nibol-btn-secondary px-4 py-2.5 text-sm text-rose-700"
            onClick={() => setConfirmDelete(true)}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar observación
          </button>
        </div>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        confirmLabel="Eliminar observación"
        description={`Se dejará de mostrar ${observation.displayCode}. La información, evidencias e historial se conservarán.`}
        isLoading={remove.isPending}
        onConfirm={async () => remove.mutateAsync()}
        onOpenChange={setConfirmDelete}
        open={confirmDelete}
        title="¿Eliminar observación?"
        tone="danger"
      />
      <ConfirmDialog
        confirmLabel="Concluir observación"
        description="El sistema validará que todos los planes estén concluidos y que no existan evaluaciones pendientes."
        isLoading={close.isPending}
        onConfirm={async () => close.mutateAsync()}
        onOpenChange={setConfirmClose}
        open={confirmClose}
        title="¿Aprobar el cierre?"
      />
    </div>
  );
}
