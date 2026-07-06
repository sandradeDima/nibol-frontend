import { generatedPermissionResources } from "@/modules/generated-module-registry";

const CORE_PERMISSION_RESOURCES = [
  {
    key: "users",
    label: "Users",
  },
  {
    key: "roles",
    label: "Roles",
  },
  {
    key: "permissions",
    label: "Permissions",
  },
  {
    key: "settings",
    label: "Settings",
  },
  {
    key: "notifications",
    label: "Notifications",
  },
  {
    key: "activity_logs",
    label: "Activity Logs",
  },
  {
    key: "audit_logs",
    label: "Audit Logs",
  },
  {
    key: "invitations",
    label: "Invitations",
  },
] as const;

export const PERMISSION_RESOURCES = [
  ...CORE_PERMISSION_RESOURCES,
  ...generatedPermissionResources,
] as const;

export const PERMISSION_ACTIONS = [
  {
    key: "view",
    label: "View",
  },
  {
    key: "create",
    label: "Create",
  },
  {
    key: "edit",
    label: "Edit",
  },
  {
    key: "delete",
    label: "Delete",
  },
] as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number]["key"];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]["key"];

export const buildPermissionName = (
  resource: PermissionResource,
  action: PermissionAction,
): string => {
  return `${resource}.${action}`;
};

export const CRITICAL_ADMIN_PERMISSIONS = PERMISSION_RESOURCES.flatMap((resource) =>
  PERMISSION_ACTIONS.map((action) => buildPermissionName(resource.key, action.key)),
);
