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
  {
    key: "workflows",
    label: "Flujos",
  },
  {
    key: "workflow_tasks",
    label: "Tareas de flujos",
  },
  {
    key: "workflow_instances",
    label: "Instancias de flujos",
  },
  {
    key: "workflow_timers",
    label: "Temporizadores de flujos",
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
const MODULE_PERMISSION_ACTION = {
  key: "view_module",
  label: "Ver módulo",
} as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number]["key"];
export type PermissionAction =
  | (typeof PERMISSION_ACTIONS)[number]["key"]
  | "view_module"
  | "archive"
  | "approve"
  | "assign_executor"
  | "cancel"
  | "close"
  | "complete"
  | "evaluate"
  | "export"
  | "manage"
  | "observe"
  | "publish"
  | "reject"
  | "request"
  | "request_correction"
  | "reassign"
  | "retry"
  | "return"
  | "review"
  | "send"
  | "simulate"
  | "start"
  | "submit_to_audit"
  | "technical"
  | "validate"
  | "view_audit"
  | "view_instances"
  | "view_versions";

const RESOURCES_WITHOUT_MODULE_PERMISSION = [
  "workflows",
  "workflow_tasks",
  "workflow_instances",
  "workflow_timers",
] as const;

export const supportsModulePermission = (
  resource: PermissionResource,
): boolean =>
  !RESOURCES_WITHOUT_MODULE_PERMISSION.includes(
    resource as (typeof RESOURCES_WITHOUT_MODULE_PERMISSION)[number],
  );

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
  activity: [
    ...PERMISSION_ACTIONS,
    { key: "export", label: "Exportar actividad" },
    { key: "technical", label: "Ver detalles técnicos" },
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
  observation_areas: [
    ...PERMISSION_ACTIONS,
    { key: "manage", label: "Administrar áreas de observación" },
  ],
  workflows: [
    { key: "view", label: "Ver flujos" },
    { key: "create", label: "Crear flujos" },
    { key: "edit", label: "Editar flujos" },
    { key: "delete", label: "Eliminar flujos" },
    { key: "archive", label: "Archivar flujos" },
    { key: "publish", label: "Publicar flujos" },
    { key: "validate", label: "Validar flujos" },
    { key: "simulate", label: "Simular flujos" },
    { key: "view_versions", label: "Ver versiones de flujos" },
    { key: "view_instances", label: "Ver instancias de flujos" },
  ],
  workflow_tasks: [
    { key: "view", label: "Ver tareas de flujos" },
    { key: "approve", label: "Aprobar tareas" },
    { key: "complete", label: "Completar tareas" },
    { key: "reject", label: "Rechazar tareas" },
    { key: "observe", label: "Observar tareas" },
    { key: "request_correction", label: "Solicitar correcciones" },
    { key: "reassign", label: "Reasignar tareas" },
  ],
  workflow_instances: [
    { key: "start", label: "Iniciar instancias" },
    { key: "cancel", label: "Cancelar instancias" },
    { key: "retry", label: "Reintentar instancias" },
    { key: "view_audit", label: "Ver auditoría de instancias" },
  ],
  workflow_timers: [
    { key: "view", label: "Ver temporizadores" },
    { key: "retry", label: "Reintentar temporizadores" },
  ],
  audit_reports: [...PERMISSION_ACTIONS, { key: "export", label: "Exportar" }],
  reports: [
    { key: "view", label: "Ver reportes" },
    { key: "export", label: "Exportar" },
  ],
};

export const buildPermissionName = (
  resource: PermissionResource,
  action: PermissionAction,
): string => {
  return `${resource}.${action}`;
};

export const CRITICAL_ADMIN_PERMISSIONS = PERMISSION_RESOURCES.flatMap(
  (resource) =>
    [
      ...(PERMISSION_ACTIONS_BY_RESOURCE[resource.key] ?? PERMISSION_ACTIONS),
      ...(supportsModulePermission(resource.key)
        ? [MODULE_PERMISSION_ACTION]
        : []),
    ].map((action) => buildPermissionName(resource.key, action.key)),
);
