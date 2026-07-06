"use client";

import { useEffect, useEffectEvent } from "react";

import { AlertTriangle, X } from "lucide-react";

import { cn } from "@/utils";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
  tone?: "danger" | "default";
};

export function ConfirmDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  description,
  isLoading = false,
  onConfirm,
  onOpenChange,
  open,
  title,
  tone = "danger",
}: ConfirmDialogProps) {
  const closeDialog = useEffectEvent(() => {
    onOpenChange(false);
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        closeDialog();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-[rgba(7,20,45,0.4)] p-3 sm:items-center sm:justify-center sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Close dialog"
        className="absolute inset-0"
        disabled={isLoading}
        onClick={() => {
          if (!isLoading) {
            onOpenChange(false);
          }
        }}
        type="button"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-panel-strong)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div
            className={cn(
              "p-3",
              tone === "danger"
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--primary)] text-white",
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>

          <button
            aria-label="Close dialog"
            className="p-2 text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
            disabled={isLoading}
            onClick={() => {
              onOpenChange(false);
            }}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <h2 className="font-display text-3xl font-bold uppercase leading-none tracking-[-0.03em] text-[var(--foreground)]">
            {title}
          </h2>
          <p className="text-sm leading-7 text-[var(--foreground-soft)] sm:text-base">
            {description}
          </p>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="nibol-btn-secondary justify-center disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            onClick={() => {
              onOpenChange(false);
            }}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={cn(
              "inline-flex items-center justify-center px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
              tone === "danger"
                ? "border border-[var(--accent)] bg-[var(--accent)] hover:opacity-90"
                : "border border-[var(--primary)] bg-[var(--primary)] hover:opacity-90",
            )}
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isLoading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
