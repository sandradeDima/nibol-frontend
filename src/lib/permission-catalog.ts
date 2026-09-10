import { generatedPermissionResources } from "@/modules/generated-module-registry";

const CORE_PERMISSION_RESOURCES = [
  {
    key: "users",
    label: "Usuarios",
  },
  {
    key: "roles",
    label: "Roles",
  },
  {
    key: "permissions",
    label: "Permisos",
  },
  {
    key: "settings",
    label: "Ajustes",
  },
  {
    key: "notifications",
    label: "Notificaciones",
  },
  {
    key: "automatic_jobs",
    label: "Tareas automáticas",
  },
  {
    key: "notification_rules",
    label: "Reglas de notificación",
  },
  {
    key: "activity",
    label: "Actividad empresarial",
  },
  {
    key: "activity_logs",
    label: "Registros de actividad",
  },
  {
    key: "audit_logs",
    label: "Registros de auditoría",
  },
  {
    key: "invitations",
    label: "Invitaciones",
  },
  {
    key: "reports",
    label: "Reportes y KPIs",
  },
  {
    key: "audit_reports",
    label: "Reportes de auditoría",
  },
  {
    key: "observations",
    label: "Observaciones",
  },
  {
    key: "recommended_action_plans",
    label: "Planes recomendados de Auditoría",
  },
  {
    key: "action_plans",
    label: "Planes de acción",
  },
  {
    key: "evidence",
    label: "Evidencias",
  },
  {
    key: "deadline_extensions",
    label: "Ampliaciones de plazo",
  },
  {
    key: "observations.history",
    label: "Historial de observaciones",
  },
  {
    key: "action_plans.history",
    label: "Historial de planes",
  },
] as const;

export const PERMISSION_RESOURCES = [
  ...CORE_PERMISSION_RESOURCES,
  ...generatedPermissionResources,
] as const;

export const PERMISSION_ACTIONS = [
  {
    key: "view",
    label: "Ver",
  },
  {
    key: "create",
    label: "Crear",
  },
  {
    key: "edit",
    label: "Editar",
  },
  {
    key: "delete",
    label: "Eliminar",
  },
] as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number]["key"];
export type PermissionAction =
  | (typeof PERMISSION_ACTIONS)[number]["key"]
  | "approve"
  | "assign_executor"
  | "close"
  | "complete"
  | "evaluate"
  | "export"
  | "reject"
  | "request"
  | "return"
  | "review"
  | "send"
  | "submit_to_audit";

export const PERMISSION_ACTIONS_BY_RESOURCE: Partial<
  Record<
    PermissionResource,
    readonly { key: PermissionAction; label: string }[]
  >
> = {
  observations: [
    ...PERMISSION_ACTIONS,
    { key: "send", label: "Enviar a los involucrados" },
    { key: "close", label: "Cerrar observaciones" },
  ],
  recommended_action_plans: [
    { key: "view", label: "Ver planes recomendados" },
    { key: "create", label: "Crear planes recomendados" },
    { key: "edit", label: "Editar planes recomendados" },
    { key: "delete", label: "Eliminar planes recomendados" },
    { key: "submit_to_audit", label: "Enviar plan recomendado a Auditoría" },
  ],
  action_plans: [
    ...PERMISSION_ACTIONS,
    { key: "assign_executor", label: "Asignar / reasignar ejecutor" },
    { key: "submit_to_audit", label: "Enviar a Auditoría" },
    { key: "evaluate", label: "Evaluar plan de acción" },
    { key: "approve", label: "Aprobar cumplimiento" },
    { key: "return", label: "Devolver para corrección" },
    { key: "complete", label: "Concluir plan de acción" },
  ],
  evidence: [
    { key: "view", label: "Ver evidencias" },
    { key: "create", label: "Adjuntar evidencias" },
    { key: "review", label: "Revisar evidencias" },
    { key: "delete", label: "Eliminar evidencias" },
  ],
  deadline_extensions: [
    { key: "view", label: "Ver ampliaciones" },
    { key: "request", label: "Solicitar ampliación" },
    { key: "approve", label: "Aprobar ampliación" },
    { key: "reject", label: "Rechazar ampliación" },
  ],
  "observations.history": [
    { key: "view", label: "Ver historial de observaciones" },
  ],
  "action_plans.history": [{ key: "view", label: "Ver historial de planes" }],
  audit_reports: [...PERMISSION_ACTIONS, { key: "export", label: "Exportar" }],
  reports: [...PERMISSION_ACTIONS, { key: "export", label: "Exportar" }],
};

export const buildPermissionName = (
  resource: PermissionResource,
  action: PermissionAction,
): string => {
  return `${resource}.${action}`;
};

export const CRITICAL_ADMIN_PERMISSIONS = PERMISSION_RESOURCES.flatMap(
  (resource) =>
    (PERMISSION_ACTIONS_BY_RESOURCE[resource.key] ?? PERMISSION_ACTIONS).map(
      (action) => buildPermissionName(resource.key, action.key),
    ),
);
