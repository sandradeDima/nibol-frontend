"use client";

import { useEffect, type ReactNode } from "react";

import { useRouter } from "next/navigation";

import { hasAllPermissions, hasAnyPermission, hasPermission } from "@/lib/permissions";

import { usePermissions } from "@/hooks/use-permissions";

type PermissionGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
  permission?: string;
  permissions?: string[];
  redirectTo?: string;
  require?: "all" | "any";
};

const isAllowed = (
  userPermissions: string[],
  {
    permission,
    permissions = [],
    require = "any",
  }: Omit<PermissionGuardProps, "children" | "fallback" | "redirectTo">,
): boolean => {
  if (permission) {
    return hasPermission(userPermissions, permission);
  }

  if (require === "all") {
    return hasAllPermissions(userPermissions, permissions);
  }

  return hasAnyPermission(userPermissions, permissions);
};

export function PermissionGuard({
  children,
  fallback = null,
  permission,
  permissions,
  redirectTo,
  require = "any",
}: PermissionGuardProps) {
  const router = useRouter();
  const { isLoading, permissions: userPermissions } = usePermissions();

  const allowed = isAllowed(userPermissions, {
    permission,
    permissions,
    require,
  });

  useEffect(() => {
    if (!redirectTo || isLoading || allowed) {
      return;
    }

    router.replace(redirectTo);
  }, [allowed, isLoading, redirectTo, router]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
