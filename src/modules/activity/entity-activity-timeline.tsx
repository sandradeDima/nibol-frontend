"use client";

import { useState } from "react";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  FileCheck2,
  FileText,
  MessageSquare,
  Paperclip,
  ShieldCheck,
  TimerReset,
  UserRound,
} from "lucide-react";

import { QUERY_KEYS } from "@/lib/constants";
import { entityActivityService } from "@/services/entity-activity-service";
import type { EntityActivity, LogJsonValue } from "@/types";
import { cn } from "@/utils";

const ACTIVITY_LABELS: Record<string, string> = {
  COMMENT_ADDED: "Comentario agregado",
  COMMENT_DELETED: "Comentario eliminado",
  COMMENT_EDITED: "Comentario editado",
  APPROVAL_GRANTED: "Aprobacion registrada",
  AUTOMATIC_STATUS_CHANGE: "Cambio automatico de estado",
  COMMITMENT_COMPLETED: "Compromiso completado",
  COMMITMENT_CREATED: "Compromiso creado",
  COMMITMENT_PROGRESS_CHANGED: "Avance de compromiso actualizado",
  EVIDENCE_UPLOADED: "Evidencia cargada",
  EXTENSION_APPROVED: "Ampliacion aprobada",
  EXTENSION_CREATED: "Solicitud de ampliacion creada",
  EXTENSION_REJECTED: "Ampliacion rechazada",
  EXTENSION_REQUESTED: "Ampliacion solicitada",
  EXTENSION_UPDATED: "Solicitud de ampliacion actualizada",
  NOTIFICATION_CREATED: "Notificacion emitida",
  OBSERVATION_CLOSED: "Observacion cerrada",
  OBSERVATION_CREATED: "Observacion creada",
  OBSERVATION_ASSIGNED: "Responsable o área asignada",
  OBSERVATION_DUE_DATE_CHANGED: "Fecha límite actualizada",
  OBSERVATION_RISK_CHANGED: "Nivel de riesgo actualizado",
  OBSERVATION_STATUS_CHANGED: "Estado de observacion actualizado",
  OBSERVATION_UPDATED: "Observacion actualizada",
  OVERDUE_DETECTED: "Vencimiento detectado",
  PLAN_APPROVED: "Plan aprobado",
  PLAN_CREATED: "Plan de remediacion creado",
  PLAN_RETURNED: "Plan devuelto para ajustes",
  PLAN_REJECTED: "Plan rechazado",
  PLAN_SENT_TO_AUDIT: "Plan enviado a auditoria",
  PLAN_UPDATED: "Plan actualizado",
  PROGRESS_CREATED: "Avance registrado",
  PROGRESS_SENT: "Avance enviado a auditoria",
  PROGRESS_UPDATED: "Avance actualizado",
  PROGRESS_APPROVED: "Avance aprobado",
  PROGRESS_RETURNED: "Avance devuelto",
  PROGRESS_REJECTED: "Avance rechazado",
  REMINDER_SENT: "Recordatorio enviado",
  EMAIL_DELIVERY_FAILED: "Falló la entrega del correo",
  EXTENSION_SENT_TO_MANAGER: "Ampliación enviada a Gerencia",
  EXTENSION_MANAGER_APPROVED: "Ampliación aprobada por Gerencia",
  EXTENSION_MANAGER_REJECTED: "Ampliación rechazada por Gerencia",
  EXTENSION_SENT_TO_AUDIT: "Ampliación enviada a Auditoría",
  EXTENSION_AUDIT_APPROVED: "Ampliación aprobada por Auditoría",
  EXTENSION_AUDIT_REJECTED: "Ampliación rechazada por Auditoría",
  EXTENSION_CANCELLED: "Ampliación cancelada",
  DEADLINE_UPDATED_BY_EXTENSION: "Fecha límite actualizada por ampliación",
};

const FIELD_LABELS: Record<string, string> = {
  areaId: "Area",
  area: "Área",
  dueDate: "Fecha limite",
  progressPercent: "Avance",
  responsibleUser: "Responsable",
  riskLevel: "Nivel de riesgo",
  riskLevelId: "Nivel de riesgo",
  status: "Estado",
  statusId: "Estado",
};

const getIcon = (activity: EntityActivity) => {
  if (activity.actorType !== "USER") return Bot;
  if (activity.activityType.includes("EVIDENCE")) return Paperclip;
  if (activity.activityType.includes("COMMENT")) return MessageSquare;
  if (activity.activityType.includes("APPROVAL") || activity.activityType.includes("PLAN")) return ShieldCheck;
  if (activity.activityType.includes("PROGRESS")) return CheckCircle2;
  if (activity.activityType.includes("EXTENSION")) return TimerReset;
  if (activity.activityType.includes("NOTIFICATION")) return Activity;
  if (activity.activityType.includes("OBSERVATION")) return FileText;
  return CircleDot;
};

const asRecord = (value: LogJsonValue | null): Record<string, LogJsonValue> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value : null;

const displayValue = (value: LogJsonValue | undefined): string => {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "object") {
    if (!Array.isArray(value) && "name" in value && typeof value.name === "string") return value.name;
    return Array.isArray(value) ? `${value.length} elementos` : "Detalle actualizado";
  }
  return String(value);
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

function ActivityItem({ activity, canViewTechnical }: { activity: EntityActivity; canViewTechnical: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getIcon(activity);
  const previous = asRecord(activity.previousData);
  const next = asRecord(activity.newData);
  const fields = Array.from(new Set([...Object.keys(previous ?? {}), ...Object.keys(next ?? {})])).filter(
    (field) => !field.endsWith("Id") && field !== "id",
  );
  const actorName = activity.actor?.name ?? (activity.actorType === "CRON" ? "Proceso programado" : "Sistema");

  return (
    <li className="relative pl-12">
      <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="border-b border-stone-200 pb-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-stone-950">{ACTIVITY_LABELS[activity.activityType] ?? activity.title}</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">{activity.description ?? activity.title}</p>
          </div>
          <time className="shrink-0 text-xs font-medium text-stone-500">{formatDate(activity.createdAt)}</time>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" />{actorName}</span>
          <span className="inline-flex items-center gap-1.5"><FileCheck2 className="h-3.5 w-3.5" />{activity.observation?.code ?? activity.entityType}</span>
          {activity.actor?.roles.length ? <span>{activity.actor.roles.join(" · ")}</span> : null}
          {activity.targetUrl ? <Link className="inline-flex items-center gap-1 font-semibold text-[var(--primary)] hover:underline" href={activity.targetUrl}>Abrir referencia <ArrowRight className="h-3 w-3" /></Link> : null}
        </div>
        {fields.length > 0 ? (
          <div className="mt-3">
            <button className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]" onClick={() => setExpanded((value) => !value)} type="button">
              {expanded ? "Ocultar cambios" : "Ver cambios"}<ChevronDown className={cn("h-3.5 w-3.5 transition", expanded && "rotate-180")} />
            </button>
            {expanded ? (
              <dl className="mt-3 grid gap-2 border-l-2 border-amber-200 pl-3 text-xs sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field}>
                    <dt className="font-semibold uppercase tracking-[0.12em] text-stone-500">{FIELD_LABELS[field] ?? field}</dt>
                    <dd className="mt-1 text-stone-700">{displayValue(previous?.[field])} <span className="px-1 text-stone-400">→</span> {displayValue(next?.[field])}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        ) : null}
        {canViewTechnical && activity.id ? (
          <details className="mt-3 text-xs text-stone-500">
            <summary className="cursor-pointer font-semibold text-[var(--primary)]">Ver detalle técnico seguro</summary>
            <div className="mt-2 space-y-1 border-l-2 border-stone-200 pl-3 font-mono text-[11px]">
              <p>ID: {activity.id}</p>
              <p>Entidad: {activity.entityType} / {activity.entityId ?? "—"}</p>
              {activity.relatedAuditLogId ? <p>Auditoría relacionada: {activity.relatedAuditLogId}</p> : null}
              {activity.metadata ? <pre className="max-w-full overflow-x-auto whitespace-pre-wrap">{JSON.stringify(activity.metadata, null, 2)}</pre> : null}
            </div>
          </details>
        ) : null}
      </div>
    </li>
  );
}

export function EntityActivityLatest({ observationId }: { observationId: string }) {
  const query = useQuery({
    queryFn: () => entityActivityService.listObservationHistory(observationId, { page: 1, pageSize: 1 }),
    queryKey: [...QUERY_KEYS.entityActivityObservation(observationId), "latest"],
  });
  const latest = query.data?.data[0];
  if (!latest) return <span className="text-stone-500">Sin actividad registrada</span>;
  return <span>{ACTIVITY_LABELS[latest.activityType] ?? latest.title}<span className="mt-1 block text-sm font-normal text-stone-600">{latest.actor?.name ?? (latest.actorType === "CRON" ? "Proceso programado" : "Sistema")} · {formatDate(latest.createdAt)}</span></span>;
}

export function EntityActivityTimeline({
  canViewTechnical = false,
  limit = 50,
  observationId,
}: {
  canViewTechnical?: boolean;
  limit?: number;
  observationId: string;
}) {
  const query = useQuery({
    queryFn: () => entityActivityService.listObservationHistory(observationId, { includeTechnicalDetails: canViewTechnical, page: 1, pageSize: limit }),
    queryKey: [...QUERY_KEYS.entityActivityObservation(observationId), canViewTechnical, limit],
  });

  if (query.isPending) return <div className="py-8 text-sm text-stone-500">Cargando historial…</div>;
  if (query.isError) return <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">No fue posible cargar el historial.</div>;
  if (query.data.data.length === 0) return <div className="border border-dashed border-stone-300 bg-[var(--surface-soft)] px-4 py-6 text-sm text-stone-600">Aun no hay actividad registrada para esta observacion.</div>;

  return (
    <ol className="space-y-5">
      {query.data.data.map((activity) => <ActivityItem canViewTechnical={canViewTechnical} activity={activity} key={activity.id ?? `${activity.createdAt}-${activity.title}`} />)}
    </ol>
  );
}

export const activityTypeLabels = ACTIVITY_LABELS;
