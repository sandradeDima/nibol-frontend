"use client";

import { useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  GitBranch,
  RotateCcw,
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
import { getApiErrorMessage } from "@/utils";

const EVENT_LABELS: Record<string, string> = {
  AUTOMATIC_TRANSITION: "Transición automática",
  END_REACHED: "Resultado final",
  ESCALATION_FAILED: "Escalamiento requiere configuración",
  INSTANCE_CANCELLED: "Instancia cancelada",
  INSTANCE_COMPLETED: "Instancia completada",
  INSTANCE_FAILED: "Ejecución fallida",
  INSTANCE_RETRY: "Reintento solicitado",
  INSTANCE_STARTED: "Instancia iniciada",
  TASK_COMPLETED: "Tarea atendida",
  TASK_CREATED: "Tarea creada",
  TASK_DECISION: "Decisión registrada",
  TASK_REASSIGNED: "Tarea reasignada",
  TIMER_CREATED: "Temporizador SLA creado",
  REMINDER_SENT: "Recordatorio SLA enviado",
  SLA_OVERDUE: "SLA vencido",
  ESCALATION_EXECUTED: "Escalamiento ejecutado",
  ALTERNATE_ROUTE_EXECUTED: "Ruta alternativa ejecutada",
  INTEGRATION_APPLIED: "Registro relacionado actualizado",
  NOTIFICATION_CREATED: "Notificación creada",
  NOTIFICATION_FAILED: "Notificación no entregada",
};

export function WorkflowInstanceDetail({
  canCancel,
  canRetry,
  instanceId,
}: {
  canCancel: boolean;
  canRetry: boolean;
  instanceId: string;
}) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<"cancel" | "retry" | null>(null);
  const query = useQuery({
    queryFn: () => workflowRuntimeService.getInstance(instanceId),
    queryKey: QUERY_KEYS.workflowInstance(instanceId),
  });
  const cancelMutation = useMutation({
    mutationFn: () => workflowRuntimeService.cancelInstance(instanceId),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: async () => {
      toast.success("Instancia cancelada.");
      setConfirm(null);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workflowInstance(instanceId),
      });
    },
  });
  const retryMutation = useMutation({
    mutationFn: () => workflowRuntimeService.retryInstance(instanceId),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: async () => {
      toast.success("Reintento ejecutado.");
      setConfirm(null);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workflowInstance(instanceId),
      });
    },
  });

  if (query.isPending)
    return (
      <div className="nibol-panel h-96 animate-pulse bg-[var(--surface-muted)]" />
    );
  if (query.isError || !query.data)
    return (
      <ErrorState
        description={getApiErrorMessage(query.error)}
        title="No fue posible cargar la instancia"
      />
    );
  const instance = query.data;
  const terminal = ["COMPLETED", "REJECTED", "CANCELLED"].includes(
    instance.status,
  );

  return (
    <section className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
        href="/aprobaciones/flujos"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a tareas
      </Link>
      <div className="nibol-panel space-y-6 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="nibol-eyebrow">Ejecución de workflow</p>
            <h2 className="font-display mt-3 text-4xl leading-none font-bold text-[var(--foreground)] uppercase">
              {instance.specialRequest?.title ?? instance.workflow.name}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground-soft)]">
              {instance.workflow.name} ·{" "}
              {instance.specialRequest?.reference ?? instance.entityId}
            </p>
            {instance.specialRequest?.description ? (
              <p className="mt-4 max-w-3xl text-sm leading-6 whitespace-pre-wrap text-[var(--foreground-soft)]">
                {instance.specialRequest.description}
              </p>
            ) : null}
            {instance.evidenceReview ? (
              <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">
                Archivo: {instance.evidenceReview.originalName} ·{" "}
                {instance.evidenceReview.context}
              </p>
            ) : null}
            {instance.relatedRecordUrl ? (
              <Link
                className="mt-3 inline-flex text-sm font-semibold text-[var(--primary)] hover:underline"
                href={instance.relatedRecordUrl}
              >
                Ver registro relacionado
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="nibol-badge nibol-badge-primary">
              {instance.status}
            </span>
            {canCancel && !terminal ? (
              <button
                className="nibol-btn-danger"
                onClick={() => setConfirm("cancel")}
                type="button"
              >
                <XCircle className="h-4 w-4" /> Cancelar
              </button>
            ) : null}
            {canRetry && instance.status === "FAILED" ? (
              <button
                className="nibol-btn-secondary"
                onClick={() => setConfirm("retry")}
                type="button"
              >
                <RotateCcw className="h-4 w-4" /> Reintentar
              </button>
            ) : null}
          </div>
        </div>
        <div className="grid gap-5 border-t border-[var(--border)] pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Info
            label="Proceso"
            value={formatProcessType(instance.workflow.processType)}
          />
          <Info
            label="Versión fijada"
            value={`v${instance.version.versionNumber}.0`}
          />
          <Info label="Iniciada por" value={instance.startedBy.name} />
          <Info
            label="Inicio"
            value={formatDate(instance.startedAt, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
          <Info label="Nodo actual" value={instance.currentNode?.name ?? "—"} />
          <Info label="Resultado final" value={instance.finalResult ?? "—"} />
          <Info
            label="Completada"
            value={formatDate(instance.completedAt, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
          <Info label="Tareas" value={String(instance.tasks.length)} />
        </div>
      </div>

      {instance.runtimeError ? (
        <div className="flex gap-3 border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-5 text-sm text-[var(--accent)]">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">La ejecución requiere atención</p>
            <p className="mt-1">{instance.runtimeError.message}</p>
            <p className="mt-1 text-xs tracking-[0.12em] uppercase">
              {instance.runtimeError.code}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="nibol-panel space-y-6 p-6 sm:p-8">
          <div>
            <p className="nibol-eyebrow">Timeline de ejecución</p>
            <h3 className="font-display mt-2 text-2xl font-bold text-[var(--foreground)] uppercase">
              Historial completo
            </h3>
          </div>
          <ol className="space-y-5 border-l-2 border-[var(--border)] pl-5">
            {instance.timeline.map((event) => (
              <li
                className="relative"
                key={`${event.date}-${event.eventType}-${event.taskId ?? ""}`}
              >
                <span className="absolute top-0 -left-[1.95rem] flex h-6 w-6 items-center justify-center rounded-full border border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <p className="font-semibold text-[var(--foreground)]">
                    {EVENT_LABELS[event.eventType] ?? event.eventType}
                  </p>
                  <time className="text-xs text-[var(--muted)]">
                    {formatDate(event.date, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
                {event.node ? (
                  <p className="mt-1 text-sm text-[var(--foreground-soft)]">
                    {event.node.name}
                    {event.decision ? ` · ${event.decision}` : ""}
                  </p>
                ) : null}
                {event.actor ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Actor: {event.actor.name}
                  </p>
                ) : null}
                {event.comment ? (
                  <p className="mt-2 border-l-2 border-[var(--primary)] pl-3 text-sm text-[var(--foreground-soft)] italic">
                    {event.comment}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        <aside className="space-y-6">
          <div className="nibol-panel space-y-4 p-6">
            <p className="nibol-eyebrow">Tareas y decisiones</p>
            {instance.tasks.map((task) => (
              <Link
                className="block border-b border-[var(--border)] pb-4 last:border-0 last:pb-0"
                href={`/aprobaciones/flujos/${task.id}`}
                key={task.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">
                      {task.node.name}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Visita {task.entrySequence} ·{" "}
                      {task.decision ?? task.status}
                    </p>
                  </div>
                  <ArrowIcon />
                </div>
              </Link>
            ))}
          </div>
          <div className="nibol-panel space-y-4 p-6">
            <p className="nibol-eyebrow">Contexto seguro</p>
            {Object.entries(instance.context).map(([key, value]) => (
              <div
                className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-2 last:border-0 last:pb-0"
                key={key}
              >
                <span className="text-xs text-[var(--muted)]">{key}</span>
                <span className="max-w-[11rem] text-right text-xs font-semibold break-words text-[var(--foreground)]">
                  {value === null || value === undefined || value === ""
                    ? "—"
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        confirmLabel={
          confirm === "cancel" ? "Cancelar instancia" : "Reintentar"
        }
        description={
          confirm === "cancel"
            ? "Las tareas pendientes se cancelarán y la instancia conservará su historial."
            : "Solo se reintentará el nodo automático fallido; no se repetirán decisiones humanas."
        }
        isLoading={cancelMutation.isPending || retryMutation.isPending}
        onConfirm={() => {
          if (confirm === "cancel") cancelMutation.mutate();
          if (confirm === "retry") retryMutation.mutate();
        }}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        open={Boolean(confirm)}
        title={
          confirm === "cancel" ? "Cancelar ejecución" : "Reintentar ejecución"
        }
        tone={confirm === "cancel" ? "danger" : "default"}
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
function ArrowIcon() {
  return <GitBranch className="h-4 w-4 shrink-0 text-[var(--primary)]" />;
}
