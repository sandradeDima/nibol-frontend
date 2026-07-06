"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/constants";
import { permissionService } from "@/services/permission-service";

export const usePermissions = () => {
  const query = useQuery({
    queryFn: permissionService.getMyAuthorization,
    queryKey: QUERY_KEYS.authorization,
    staleTime: 60_000,
  });

  return {
    ...query,
    isAdmin: query.data?.isAdmin ?? false,
    permissions: query.data?.permissions ?? [],
    roles: query.data?.roles ?? [],
  };
};
