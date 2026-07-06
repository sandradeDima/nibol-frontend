"use client";

import Link from "next/link";
import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  footer?: ReactNode;
  title: string;
};

type AuthBannerProps = {
  children: ReactNode;
  tone?: "error" | "info" | "success";
};

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: string;
  revealable?: boolean;
};

const toneClasses: Record<NonNullable<AuthBannerProps["tone"]>, string> = {
  error:
    "border border-[color:color-mix(in_srgb,var(--accent)_16%,white)] bg-[var(--accent-soft)] text-[var(--accent)]",
  info: "border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground-soft)]",
  success:
    "border border-[color:color-mix(in_srgb,var(--success)_16%,white)] bg-[var(--success-soft)] text-[var(--success)]",
};

export const authPrimaryButtonClass =
  "nibol-btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60";

export function AuthShell({
  children,
  description,
  footer,
  title,
}: AuthShellProps) {
  return (
    <div className="w-full max-w-[27rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-panel)] sm:p-8">
      <div className="space-y-3">
        <p className="nibol-eyebrow">
          Acceso corporativo
        </p>
        <h2 className="font-display text-4xl font-bold uppercase leading-none tracking-[-0.03em] text-[var(--foreground)]">
          {title}
        </h2>
        <p className="text-sm leading-7 text-[var(--foreground-soft)]">{description}</p>
      </div>

      <div className="mt-8 space-y-5">{children}</div>

      {footer ? <div className="mt-6 text-sm text-[var(--muted)]">{footer}</div> : null}
    </div>
  );
}

export function AuthBanner({ children, tone = "info" }: AuthBannerProps) {
  return (
    <div className={cn("px-4 py-3 text-sm", toneClasses[tone])}>
      {children}
    </div>
  );
}

export function AuthInput({ className, error, label, revealable, type, ...props }: AuthInputProps) {
  const [revealed, setRevealed] = useState(false);

  const inputType = type === "password" && revealable ? (revealed ? "text" : "password") : type;

  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--foreground-soft)]">{label}</span>
      <div className="relative mt-2">
        <input
          className={cn(
            "nibol-field py-3 pr-4",
            error
              ? "border-[color:color-mix(in_srgb,var(--accent)_20%,white)] bg-[var(--accent-soft)]"
              : null,
            className,
          )}
          type={inputType}
          {...props}
        />

        {type === "password" && revealable ? (
          <button
            type="button"
            onClick={() => setRevealed((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label={revealed ? "Hide password" : "Show password"}
          >
            {revealed ? "Ocultar" : "Mostrar"}
          </button>
        ) : null}
      </div>

      {error ? <span className="mt-2 block text-sm text-[var(--accent)]">{error}</span> : null}
    </label>
  );
}

export function AuthLinkRow({
  href,
  label,
  linkLabel,
}: {
  href: string;
  label: string;
  linkLabel: string;
}) {
  return (
    <p className="text-sm text-[var(--muted)]">
      {label}{" "}
      <Link className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)]" href={href}>
        {linkLabel}
      </Link>
    </p>
  );
}
