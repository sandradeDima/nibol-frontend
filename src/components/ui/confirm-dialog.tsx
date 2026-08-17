"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { AlertTriangle, X } from "lucide-react";

import { cn } from "@/utils";

import { useDialogFocus } from "./use-dialog-focus";

type ConfirmDialogProps = {
  cancelLabel?: string;
  children?: ReactNode;
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
  children,
  confirmLabel = "Confirm",
  description,
  isLoading = false,
  onConfirm,
  onOpenChange,
  open,
  title,
  tone = "danger",
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useDialogFocus({
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
    isCloseDisabled: isLoading,
    onClose: () => onOpenChange(false),
    open,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLoading, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
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
        tabIndex={-1}
        type="button"
      />

      <div
        className="relative z-10 w-full max-w-lg overflow-hidden border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-panel-strong)] sm:p-7"
        ref={dialogRef}
        tabIndex={-1}
      >
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
            className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            disabled={isLoading}
            onClick={() => {
              onOpenChange(false);
            }}
            ref={closeButtonRef}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <h2
            className="font-display text-3xl leading-none font-bold tracking-[-0.03em] text-[var(--foreground)] uppercase"
            id={titleId}
          >
            {title}
          </h2>
          <p
            className="text-sm leading-7 text-[var(--foreground-soft)] sm:text-base"
            id={descriptionId}
          >
            {description}
          </p>
          {children ? <div className="pt-2">{children}</div> : null}
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
