"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Mail, Play, RefreshCw, ShieldAlert } from "lucide-react";

import { QUERY_KEYS } from "@/lib/constants";
import { notificationService } from "@/services/notification-service";
import { getApiErrorMessage } from "@/utils";

const labelByKey: Record<string, string> = {
  notify_area_manager: "Notificar a gerencia del área",
  notify_audit_team: "Notificar al equipo de Auditoría",
  notify_by_email: "Enviar alertas por correo",
  notify_in_app: "Crear alertas dentro de NIBOL",
  notify_observation_assignee: "Notificar al responsable",
  overdue_check_enabled: "Monitorear vencimientos",
  overdue_status_auto_update_enabled: "Actualizar estado vencido automáticamente",
  pending_extension_reminder_hours: "Recordar aprobaciones de ampliación después de (horas)",
  pending_review_reminder_hours: "Recordar revisiones pendientes después de (horas)",
  reminder_days_before_due: "Avisar con (días) de anticipación",
  reminder_repeat_days: "Repetir recordatorios cada (días)",
  returned_progress_reminder_days: "Recordar correcciones después de (días)",
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString("es-BO") : "Sin ejecución");

export function AutomaticNotificationAdmin({ canExecute }: { canExecute: boolean }) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const rulesQuery = useQuery({
    queryFn: notificationService.listAutomaticRules,
    queryKey: [...QUERY_KEYS.notifications, "automatic-rules"],
  });
  const executionsQuery = useQuery({
    queryFn: () => notificationService.listJobExecutions({ page: 1, perPage: 8 }),
    queryKey: [...QUERY_KEYS.notifications, "job-executions"],
  });
  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      notificationService.updateAutomaticRule(key, value),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.notifications, "automatic-rules"] });
    },
  });
  const runMutation = useMutation({
    mutationFn: notificationService.runDeadlineMonitor,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.notifications, "job-executions"] });
    },
  });
  const rules = rulesQuery.data ?? [];
  const executions = executionsQuery.data?.data ?? [];
  const latest = executions[0];
  const error = rulesQuery.error || executionsQuery.error || updateMutation.error || runMutation.error;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="nibol-panel p-5">
          <div className="flex items-center justify-between gap-3"><span className="nibol-eyebrow">Última ejecución</span><Clock3 className="h-5 w-5 text-[var(--primary)]" /></div>
          <p className="mt-5 text-lg font-semibold text-[var(--foreground)]">{formatDate(latest?.finishedAt ?? null)}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{latest?.status ?? "Aún no ejecutado"}</p>
        </div>
        <div className="nibol-panel p-5"><div className="flex items-center justify-between gap-3"><span className="nibol-eyebrow">Alertas creadas</span><ShieldAlert className="h-5 w-5 text-[var(--accent)]" /></div><p className="mt-5 text-3xl font-semibold text-[var(--foreground)]">{latest?.notificationsCreated ?? 0}</p><p className="mt-2 text-sm text-[var(--muted)]">En la última corrida registrada</p></div>
        <div className="nibol-panel p-5"><div className="flex items-center justify-between gap-3"><span className="nibol-eyebrow">Correos enviados</span><Mail className="h-5 w-5 text-[var(--success)]" /></div><p className="mt-5 text-3xl font-semibold text-[var(--foreground)]">{latest?.emailsSent ?? 0}</p><p className="mt-2 text-sm text-[var(--muted)]">Las fallas se registran por entrega</p></div>
      </section>

      {error ? <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{getApiErrorMessage(error)}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="nibol-panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="nibol-eyebrow">Reglas operativas</p><h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Vencimientos y recordatorios</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">El monitor conserva los estados de revisión y solo actualiza estados vencidos cuando el flujo actual lo permite.</p></div>
            {canExecute ? <button className="nibol-btn-primary" disabled={runMutation.isPending} onClick={() => void runMutation.mutateAsync()} type="button"><Play className="h-4 w-4" />{runMutation.isPending ? "Ejecutando..." : "Ejecutar ahora"}</button> : null}
          </div>
          <div className="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {rules.map((rule) => {
              const value = drafts[rule.key] ?? rule.value;
              const booleanRule = rule.valueType === "boolean";
              return <div className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-center" key={rule.key}>
                <div><p className="font-semibold text-[var(--foreground)]">{labelByKey[rule.key] ?? rule.name}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{rule.description ?? "Parámetro de automatización con valor seguro por defecto."}</p><code className="mt-2 inline-block text-[11px] text-[var(--primary)]">{rule.key}</code></div>
                {booleanRule ? <select className="nibol-field" onChange={(event) => setDrafts((current) => ({ ...current, [rule.key]: event.target.value }))} value={value}><option value="true">Activado</option><option value="false">Desactivado</option></select> : <input className="nibol-field" inputMode="numeric" onChange={(event) => setDrafts((current) => ({ ...current, [rule.key]: event.target.value }))} type="number" value={value} />}
                <button className="nibol-btn-secondary px-3 py-2 text-xs" disabled={value === rule.value || updateMutation.isPending} onClick={() => void updateMutation.mutateAsync({ key: rule.key, value })} type="button">Guardar</button>
              </div>;
            })}
          </div>
        </section>

        <section className="nibol-panel p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="nibol-eyebrow">Trazabilidad</p><h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Historial del proceso</h2></div><button className="nibol-btn-secondary p-2" onClick={() => void queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.notifications, "job-executions"] })} type="button"><RefreshCw className="h-4 w-4" /></button></div>
          <div className="mt-6 space-y-3">
            {executions.length === 0 ? <p className="border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">El historial aparecerá después de la primera corrida.</p> : executions.map((execution) => <article className="border border-[var(--border)] bg-[var(--surface-soft)] p-4" key={execution.id}><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-[var(--foreground)]">{formatDate(execution.startedAt)}</span><span className="nibol-badge nibol-badge-success">{execution.status}</span></div><div className="mt-3 grid grid-cols-3 gap-3 text-xs text-[var(--muted)]"><span>Procesados<strong className="block text-sm text-[var(--foreground)]">{execution.processedCount}</strong></span><span>Alertas<strong className="block text-sm text-[var(--foreground)]">{execution.notificationsCreated}</strong></span><span>Fallos<strong className="block text-sm text-[var(--foreground)]">{execution.failuresCount}</strong></span></div></article>)}
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs leading-5 text-[var(--muted)]"><CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--success)]" />La ejecución automática no guarda secretos ni cuerpos privados de correo.</div>
        </section>
      </div>
    </div>
  );
}
