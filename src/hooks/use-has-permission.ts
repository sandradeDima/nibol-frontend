"use client";

import { hasPermission } from "@/lib/permissions";

import { usePermissions } from "./use-permissions";

export const useHasPermission = (permission: string): boolean => {
  const { permissions } = usePermissions();
  return hasPermission(permissions, permission);
};
