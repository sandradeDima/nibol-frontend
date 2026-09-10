"use client";

import type { ReactNode } from "react";

import { Search, X } from "lucide-react";

import { cn } from "@/utils";

type SearchFieldProps = {
  className?: string;
  inputClassName?: string;
  isBusy?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function SearchFieldFrame({
  children,
  className,
  endAdornment,
}: {
  children: ReactNode;
  className?: string;
  endAdornment?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group flex h-12 min-w-0 overflow-hidden border border-[var(--border)] bg-[var(--surface-soft)] transition focus-within:border-[color-mix(in_srgb,var(--primary)_32%,white)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_10%,white)]",
        className,
      )}
    >
      <span className="flex w-10 shrink-0 items-center justify-center border-r border-[var(--border)] text-[var(--muted)] transition group-focus-within:text-[var(--primary)]">
        <Search aria-hidden="true" className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
      {endAdornment}
    </div>
  );
}

export function SearchField({
  className,
  inputClassName,
  isBusy = false,
  onChange,
  placeholder = "Buscar",
  value,
}: SearchFieldProps) {
  return (
    <label className={cn("block min-w-0 flex-1", className)}>
      <SearchFieldFrame
        endAdornment={
          value ? (
            <button
              aria-label="Clear search"
              className="mr-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
              onClick={() => onChange("")}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : isBusy ? (
            <span className="mr-4 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--primary)]" />
          ) : null
        }
      >
        <input
          aria-label={placeholder}
          className={cn(
            "h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm leading-5 outline-none placeholder:text-[var(--muted)]",
            inputClassName,
          )}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={value}
        />
      </SearchFieldFrame>
    </label>
  );
}
