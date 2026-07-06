"use client";

import type { ReactNode } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QUERY_KEYS } from "@/lib/constants";
import { authService } from "@/services/auth-service";
import { cn } from "@/utils";

type LogoutButtonProps = {
  children?: ReactNode;
  className?: string;
  onLoggedOut?: () => void;
  variant?: "button" | "menu";
};

export function LogoutButton({
  children = "Sign out",
  className,
  onLoggedOut,
  variant = "button",
}: LogoutButtonProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.authSession,
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.authorization,
        }),
      ]);

      setConfirmOpen(false);
      onLoggedOut?.();
      router.replace("/login");
    },
  });

  return (
    <>
      <button
        className={cn(
          variant === "menu"
            ? "text-left"
            : "nibol-btn-secondary",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        disabled={logoutMutation.isPending}
        onClick={() => {
          setConfirmOpen(true);
        }}
        type="button"
      >
        <LogOut className="h-4 w-4" />
        {children}
      </button>

      <ConfirmDialog
        confirmLabel="Cerrar sesion"
        description="Tendra que volver a ingresar para acceder a las areas protegidas de la aplicacion."
        isLoading={logoutMutation.isPending}
        onConfirm={() => {
          logoutMutation.mutate();
        }}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Desea cerrar esta sesion?"
      />
    </>
  );
}
