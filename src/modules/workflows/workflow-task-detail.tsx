"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  GitBranch,
  RotateCcw,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import {
  formatDate,
  formatProcessType,
} from "@/modules/workflows/presentation";
import { workflowRuntimeService } from "@/services/workflow-runtime-service";
import type { WorkflowRuntimeTaskAction } from "@/types";
import { getApiErrorMessage } from "@/utils";

const formatRemaining = (dueAt: string | null, now = Date.now()): string => {
  if (!dueAt) return "Sin SLA configurado";
  const remaining = new Date(dueAt).getTime() - now;
  const absoluteMinutes = Math.floor(Math.abs(remaining) / 60_000);
  const days = Math.floor(absoluteMinutes / 1_440);
  const hours = Math.floor((absoluteMinutes % 1_440) / 60);
  const minutes = absoluteMinutes % 60;
  const value = [
    days ? `${days}d` : "",
    hours ? `${hours}h` : "",
    `${minutes}m`,
  ]
    .filter(Boolean)
    .join(" ");
  return remaining < 0 ? `Vencida hace ${value}` : `Restan ${value}`;
};

const DUE_LABELS: Record<string, string> = {
  DUE_SOON: "Próxima a vencer",
  NO_SLA: "Sin SLA",
  ON_TIME: "En plazo",
  OVERDUE: "Vencida",
};

const ACTIONS: Array<{
  action: WorkflowRuntimeTaskAction;
  endpoint:
    "approve" | "complete" | "observe" | "reject" | "request-correction";
  label: string;
  tone: "danger" | "default";
}> = [
  { action: "APPROVE", endpoint: "approve", label: "Aprobar", tone: "default" },
  {
    action: "COMPLETE",
    endpoint: "complete",
    label: "Completar",
    tone: "default",
  },
  {
    action: "OBSERVE",
    endpoint: "observe",
    label: "Observar",
    tone: "default",
  },
  {
    action: "REQUEST_CORRECTION",
    endpoint: "request-correction",
    label: "Solicitar corrección",
    tone: "default",
  },
  { action: "REJECT", endpoint: "reject", label: "Rechazar", tone: "danger" },
];

const eventLabels: Record<string, string> = {
  AUTOMATIC_TRANSITION: "Transición automática",
  END_REACHED: "Resultado final",
  ESCALATION_EXECUTED: "Escalamiento ejecutado",
  ESCALATION_FAILED: "Escalamiento requiere configuración",
  INTEGRATION_APPLIED: "Registro relacionado actualizado",
  INSTANCE_COMPLETED: "Instancia completada",
  INSTANCE_FAILED: "Ejecución fallida",
  INSTANCE_STARTED: "Instancia iniciada",
  NOTIFICATION_CREATED: "Notificación creada",
  NOTIFICATION_FAILED: "Notificación no entregada",
  REMINDER_SENT: "Recordatorio SLA enviado",
  SLA_OVERDUE: "SLA vencido",
  TASK_COMPLETED: "Tarea atendida",
  TASK_CREATED: "Tarea creada",
  TASK_DECISION: "Decisión registrada",
  TASK_REASSIGNED: "Tarea reasignada",
  TIMER_CREATED: "Temporizador SLA creado",
};

export function WorkflowTaskDetail({
  canReassign,
  taskId,
}: {
  canReassign: boolean;
  taskId: string;
}) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [pendingAction, setPendingAction] = useState<
    (typeof ACTIONS)[number] | null
  >(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignId, setReassignId] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const taskQuery = useQuery({
    queryFn: () => workflowRuntimeService.getTask(taskId),
    queryKey: QUERY_KEYS.workflowTask(taskId),
  });
  const instanceId = taskQuery.data?.instance.id;
  const instanceQuery = useQuery({
    enabled: Boolean(instanceId),
    queryFn: () => workflowRuntimeService.getInstance(instanceId as string),
    queryKey: QUERY_KEYS.workflowInstance(instanceId ?? ""),
  });
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);
  const actionMutation = useMutation({
    mutationFn: async (action: (typeof ACTIONS)[number]) =>
      workflowRuntimeService.actOnTask(taskId, action.endpoint, {
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      }),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: async () => {
      toast.success("Decisión registrada.");
      setPendingAction(null);
      setComment("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.workflowTask(taskId),
        }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workflowTasks }),
        ...(instanceId
          ? [
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.workflowInstance(instanceId),
              }),
            ]
          : []),
      ]);
    },
  });
  const reassignMutation = useMutation({
    mutationFn: () =>
      workflowRuntimeService.reassignTask(taskId, {
        assignedUserId: reassignId.trim(),
        comment: comment.trim() || undefined,
      }),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: async () => {
      toast.success("Tarea reasignada.");
      setReassignOpen(false);
      setReassignId("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.workflowTask(taskId),
        }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workflowTasks }),
      ]);
    },
  });

  if (taskQuery.isPending)
    return (
      <div className="nibol-panel h-96 animate-pulse bg-[var(--surface-muted)]" />
    );
  if (taskQuery.isError || !taskQuery.data)
    return (
      <ErrorState
        description={getApiErrorMessage(taskQuery.error)}
        title="No fue posible cargar la tarea"
      />
    );
  const task = taskQuery.data;
  const visibleActions = ACTIONS.filter((item) =>
    task.allowedActions.includes(item.action),
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
          href="/aprobaciones/flujos"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a tareas
        </Link>
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
          href={`/configuracion/flujos/instancias/${task.instance.id}`}
        >
          <GitBranch className="h-4 w-4" /> Ver ejecución
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <div className="nibol-panel space-y-5 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="nibol-eyebrow">
                  Tarea de workflow · visita {task.entrySequence}
                </p>
                <h2 className="font-display mt-3 text-3xl leading-none font-bold text-[var(--foreground)] uppercase">
                  {task.node.name}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--foreground-soft)]">
                  {task.instance.workflow.name} ·{" "}
                  {formatProcessType(task.instance.processType)} · versión{" "}
                  {task.instance.version.versionNumber}.0
                </p>
              </div>
              <span className="nibol-badge nibol-badge-primary">
                {task.status}
              </span>
            </div>
            <div className="grid gap-4 border-t border-[var(--border)] pt-5 sm:grid-cols-2">
              {task.instance.specialRequest ? (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                    Solicitud
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                    {task.instance.specialRequest.title}
                  </p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 whitespace-pre-wrap text-[var(--foreground-soft)]">
                    {task.instance.specialRequest.description}
                  </p>
                </div>
              ) : null}
              {task.instance.evidenceReview ? (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                    Evidencia en revisión
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                    {task.instance.evidenceReview.originalName}
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground-soft)]">
                    Contexto: {task.instance.evidenceReview.context}
                  </p>
                </div>
              ) : null}
              <Info
                label="Registro"
                value={
                  task.instance.specialRequest?.reference ??
                  `${task.instance.entityType} · ${task.instance.entityId}`
                }
              />
              {task.instance.relatedRecordUrl ? (
                <Link
                  className="text-sm font-semibold text-[var(--primary)] hover:underline"
                  href={task.instance.relatedRecordUrl}
                >
                  Ver registro relacionado
                </Link>
              ) : null}
              <Info label="Solicitante" value={task.instance.startedBy.name} />
              <Info
                label="Creada"
                value={formatDate(task.createdAt, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
              <Info
                label="Fecha límite"
                value={formatDate(task.dueAt, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
              <Info
                label="SLA"
                value={`${DUE_LABELS[task.dueState]} · ${formatRemaining(task.dueAt, now)}`}
              />
            </div>
          </div>

          <div className="nibol-panel space-y-5 p-6 sm:p-8">
            <div>
              <p className="nibol-eyebrow">Decisión</p>
              <h3 className="font-display mt-2 text-2xl font-bold text-[var(--foreground)] uppercase">
                Revisión y respuesta
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-soft)]">
                Las rutas condicionales se resolverán con la versión fijada de
                este workflow.
              </p>
            </div>
            <label
              className="grid gap-2 text-sm font-semibold text-[var(--foreground)]"
              htmlFor="workflow-task-comment"
            >
              Comentario de la decisión
              <textarea
                className="nibol-field min-h-32 resize-y"
                id="workflow-task-comment"
                onChange={(event) => setComment(event.target.value)}
                placeholder="Opcional, salvo que la configuración lo exija"
                value={comment}
              />
            </label>
            {task.canAct && visibleActions.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {visibleActions.map((item) => (
                  <button
                    className={
                      item.tone === "danger"
                        ? "border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                        : "nibol-btn-primary"
                    }
                    key={item.action}
                    onClick={() => setPendingAction(item)}
                    type="button"
                  >
                    {item.action === "REJECT" ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {item.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-sm text-[var(--foreground-soft)]">
                Esta tarea no está disponible para tu usuario o ya fue atendida.
              </p>
            )}
          </div>

          {canReassign && task.status === "PENDING" ? (
            <div className="nibol-panel space-y-4 p-6 sm:p-8">
              <div>
                <p className="nibol-eyebrow">Administración de tarea</p>
                <h3 className="font-display mt-2 text-2xl font-bold text-[var(--foreground)] uppercase">
                  Reasignar
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-soft)]">
                  Ingrese un UUID de usuario activo. La reasignación conserva el
                  historial anterior.
                </p>
              </div>
              {reassignOpen ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label
                    className="min-w-0 flex-1"
                    htmlFor="workflow-reassign-user"
                  >
                    <span className="sr-only">UUID del usuario destino</span>
                    <input
                      className="nibol-field"
                      id="workflow-reassign-user"
                      onChange={(event) => setReassignId(event.target.value)}
                      placeholder="UUID del usuario destino"
                      value={reassignId}
                    />
                  </label>
                  <button
                    className="nibol-btn-primary"
                    disabled={!reassignId.trim() || reassignMutation.isPending}
                    onClick={() => reassignMutation.mutate()}
                    type="button"
                  >
                    {reassignMutation.isPending ? "Guardando…" : "Confirmar"}
                  </button>
                </div>
              ) : (
                <button
                  className="nibol-btn-secondary"
                  onClick={() => setReassignOpen(true)}
                  type="button"
                >
                  <RotateCcw className="h-4 w-4" /> Abrir reasignación
                </button>
              )}
            </div>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="nibol-panel space-y-4 p-6">
            <p className="nibol-eyebrow">Asignación</p>
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-[var(--primary)]" />
              <p className="font-semibold text-[var(--foreground)]">
                {task.assignedUser?.name ??
                  task.assignedRole?.name ??
                  task.assignedArea?.name ??
                  "Sin asignación"}
              </p>
            </div>
            <p className="text-sm leading-6 text-[var(--foreground-soft)]">
              La autorización se valida en el servidor con la asignación
              vigente, roles actuales y gerente del área.
            </p>
          </div>
          <div className="nibol-panel space-y-4 p-6">
            <p className="nibol-eyebrow">Progreso</p>
            <div className="border-l-2 border-[var(--primary)] pl-4">
              <p className="font-semibold text-[var(--foreground)]">
                {task.node.name}
              </p>
              <p className="mt-1 text-sm text-[var(--foreground-soft)]">
                Etapa actual
              </p>
            </div>
            {instanceQuery.data?.timeline.slice(-5).map((event) => (
              <div
                className="border-l border-[var(--border)] pl-4"
                key={`${event.date}-${event.eventType}`}
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {eventLabels[event.eventType] ?? event.eventType}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {formatDate(event.date, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        confirmLabel={pendingAction?.label ?? "Confirmar"}
        description="La decisión quedará registrada y el runtime continuará con la ruta controlada de la versión fijada."
        isLoading={actionMutation.isPending}
        onConfirm={() => {
          if (pendingAction) actionMutation.mutate(pendingAction);
        }}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        open={Boolean(pendingAction)}
        title={pendingAction?.label ?? "Confirmar decisión"}
        tone={pendingAction?.tone ?? "default"}
      />
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--foreground)]">{value}</p>
    </div>
  );
}
