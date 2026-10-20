import type {
  WorkflowDefinitionStatus,
  WorkflowProcessOption,
  WorkflowVersionStatus,
} from "@/types";

export const STATUS_LABELS: Record<WorkflowDefinitionStatus, string> = {
  ARCHIVED: "Archivado",
  DRAFT: "Borrador",
  INACTIVE: "Inactivo",
  PUBLISHED: "Publicado",
};

export const VERSION_STATUS_LABELS: Record<WorkflowVersionStatus, string> = {
  ARCHIVED: "Archivada",
  DRAFT: "Borrador",
  INACTIVE: "Inactiva",
  PUBLISHED: "Publicada",
};

const RUNTIME_LABELS: Record<string, string> = {
  ACTIVE: "Activa",
  APPROVE: "Aprobar",
  APPROVED: "Aprobada",
  APROBADO: "Aprobado",
  ALTERNATE_ROUTE: "Ruta alternativa",
  ALTERNATE_ROUTE_EXECUTED: "Ruta alternativa ejecutada",
  CANCEL: "Cancelar",
  CANCELLED: "Cancelada",
  CLOSED: "Cerrado",
  COMPLETE: "Completar",
  COMPLETED: "Completada",
  CORRECTION_REQUESTED: "Corrección solicitada",
  CURRENT_STATE: "Estado actual",
  DEVUELTO: "Devuelto",
  ESCALATE: "Escalar",
  EXPIRED: "Vencida",
  FAILED: "Fallida",
  IN_PROGRESS: "En curso",
  NOTIFY: "Notificar",
  OBSERVE: "Observar",
  OBSERVED: "Observada",
  PENDING: "Pendiente",
  REASSIGN: "Reasignar",
  REJECT: "Rechazar",
  REJECTED: "Rechazada",
  RETURN: "Devolver",
  RETURN_TO_STAGE: "Volver a la etapa",
  RETRY: "Reintentar",
  REQUEST_CORRECTION: "Solicitar corrección",
  RETURNED: "Devuelto",
  WAITING: "En espera",
};

export const formatWorkflowRuntimeLabel = (value: string): string =>
  RUNTIME_LABELS[value] ?? value;

export const formatWorkflowStatus = (
  status: WorkflowDefinitionStatus,
): string => {
  return STATUS_LABELS[status] ?? status;
};

export const formatVersionStatus = (status: WorkflowVersionStatus): string => {
  return VERSION_STATUS_LABELS[status] ?? status;
};

export const formatProcessType = (
  processType: string,
  processes: WorkflowProcessOption[] = [],
): string => {
  return (
    processes.find((process) => process.key === processType)?.name ??
    processType
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
};

export const formatDate = (
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string => {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-BO", options).format(new Date(value));
};

export const formatUser = (
  user: { email: string; name: string } | null | undefined,
): string => {
  if (!user) {
    return "—";
  }

  return user.name || user.email;
};

export const getStatusBadgeClass = (
  status: WorkflowDefinitionStatus | WorkflowVersionStatus,
): string => {
  switch (status) {
    case "ARCHIVED":
      return "nibol-badge nibol-badge-warning";
    case "DRAFT":
      return "nibol-badge nibol-badge-primary";
    case "PUBLISHED":
      return "nibol-badge nibol-badge-success";
    case "INACTIVE":
      return "nibol-badge";
  }
};

export const getLatestVersionLabel = (
  activeVersion: { versionNumber: number } | null,
  latestVersion: { versionNumber: number } | null,
): string => {
  const version = activeVersion ?? latestVersion;
  return version ? `v${version.versionNumber}.0` : "—";
};

export const getActivityLabel = (action: string): string => {
  const labels: Record<string, string> = {
    "workflows.archive": "Flujo de trabajo archivado",
    "workflows.create": "Flujo de trabajo creado",
    "workflows.create_version": "Borrador de versión creado",
    "workflows.duplicate": "Flujo de trabajo duplicado",
    "workflows.edit": "Metadatos actualizados",
  };

  return labels[action] ?? action;
};

export const getActivityEntityLabel = (entityType: string): string => {
  const labels: Record<string, string> = {
    workflow_definition: "Definición",
    workflow_version: "Versión",
  };

  return labels[entityType] ?? entityType;
};

export const getActivitySummary = (metadata: unknown): string | null => {
  if (!metadata || typeof metadata !== "object" || !("summary" in metadata)) {
    return null;
  }

  const summary = (metadata as { summary?: unknown }).summary;
  return typeof summary === "string" ? summary : null;
};
