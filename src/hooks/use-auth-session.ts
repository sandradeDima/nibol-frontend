"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/constants";
import { authService } from "@/services/auth-service";

export const useAuthSession = () => {
  return useQuery({
    queryFn: authService.getSession,
    queryKey: QUERY_KEYS.authSession,
    staleTime: 60_000,
  });
};
