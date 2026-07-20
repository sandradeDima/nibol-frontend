"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { cn } from "@/utils";

type DashboardRefreshButtonProps = {
  className?: string;
  label?: string;
};

export function DashboardRefreshButton({
  className,
  label = "Actualizar",
}: DashboardRefreshButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className={cn("nibol-btn-secondary px-4 py-2.5 text-sm", className)}
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      type="button"
    >
      <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
      {isPending ? "Actualizando..." : label}
    </button>
  );
}
