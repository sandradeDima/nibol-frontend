import type { AppNotification } from "@/types/notifications";

import { buildObservationUrl } from "./observation-links";

const normalize = (value: string | null): string =>
  value
    ?.trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replaceAll("-", "_") ?? "";

export const resolveNotificationTarget = (
  notification: AppNotification,
): string | null => {
  const storedTarget = notification.targetUrl?.trim();
  if (storedTarget) return storedTarget;

  const entityType = normalize(notification.entityType);
  const eventType = normalize(notification.eventType);
  const entityId = notification.entityId?.trim() || null;

  if (entityType.includes("workflow_task")) {
    return entityId
      ? `/aprobaciones/flujos/${entityId}`
      : "/aprobaciones/pendientes";
  }
  if (entityType.includes("extension") || eventType.includes("extension")) {
    return entityId
      ? `/ampliaciones-plazo/${entityId}`
      : "/aprobaciones/pendientes";
  }
  if (
    entityType.includes("action_plan") ||
    entityType.includes("remediation")
  ) {
    return entityId ? `/planes-accion/${entityId}` : "/planes-accion";
  }
  if (
    entityType.includes("progress") ||
    entityType.includes("advance") ||
    eventType.includes("progress")
  ) {
    return "/aprobaciones/pendientes";
  }
  if (entityType.includes("observation")) {
    return entityId
      ? buildObservationUrl({
          observationId: entityId,
          tab: eventType.includes("assignment") ? "summary" : undefined,
        })
      : "/observaciones";
  }
  if (
    entityType.includes("deadline_reminder") ||
    eventType.includes("deadline") ||
    eventType.includes("due") ||
    eventType.includes("overdue")
  ) {
    return "/planes-accion?filter.status=NOT_STARTED,STARTED,WITH_PROGRESS";
  }
  if (
    eventType.includes("approval") ||
    eventType.includes("review") ||
    eventType.includes("returned")
  ) {
    return "/aprobaciones/pendientes";
  }
  return null;
};
