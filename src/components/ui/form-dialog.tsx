"use client";

import { useEffect, useEffectEvent } from "react";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type FormDialogProps = {
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function FormDialog({
  children,
  description,
  footer,
  onOpenChange,
  open,
  title,
}: FormDialogProps) {
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
      if (event.key === "Escape") {
        closeDialog();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-[rgba(7,20,45,0.45)] p-3 sm:items-center sm:justify-center sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Cerrar formulario"
        className="absolute inset-0"
        onClick={() => {
          onOpenChange(false);
        }}
        type="button"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden border border-[var(--border)] bg-white shadow-[var(--shadow-panel-strong)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5 sm:px-7">
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-bold uppercase leading-none tracking-[-0.03em] text-[var(--foreground)]">
              {title}
            </h2>
            {description ? (
              <p className="max-w-2xl text-sm leading-7 text-[var(--foreground-soft)]">
                {description}
              </p>
            ) : null}
          </div>

          <button
            aria-label="Cerrar formulario"
            className="p-2 text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
            onClick={() => {
              onOpenChange(false);
            }}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6 sm:px-7">{children}</div>

        {footer ? (
          <div className="border-t border-[var(--border)] bg-[var(--surface-soft)] px-6 py-4 sm:px-7">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
