"use client";

import type { ReactNode } from "react";

import { hasAllPermissions, hasAnyPermission, hasPermission } from "@/lib/permissions";

import { usePermissions } from "@/hooks/use-permissions";

type PermissionRenderProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type CanProps = PermissionRenderProps & {
  permission: string;
};

type MultiPermissionProps = PermissionRenderProps & {
  permissions: string[];
};

export function Can({ children, fallback = null, permission }: CanProps) {
  const { permissions } = usePermissions();

  if (!hasPermission(permissions, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function CanAny({
  children,
  fallback = null,
  permissions,
}: MultiPermissionProps) {
  const { permissions: userPermissions } = usePermissions();

  if (!hasAnyPermission(userPermissions, permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function CanAll({
  children,
  fallback = null,
  permissions,
}: MultiPermissionProps) {
  const { permissions: userPermissions } = usePermissions();

  if (!hasAllPermissions(userPermissions, permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
