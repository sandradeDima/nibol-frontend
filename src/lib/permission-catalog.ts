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
  (typeof PERMISSION_ACTIONS)[number]["key"] | "export";

export const PERMISSION_ACTIONS_BY_RESOURCE: Partial<
  Record<
    PermissionResource,
    readonly { key: PermissionAction; label: string }[]
  >
> = {
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
