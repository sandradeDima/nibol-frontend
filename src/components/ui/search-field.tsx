"use client";

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

export function SearchField({
  className,
  inputClassName,
  isBusy = false,
  onChange,
  placeholder = "Buscar",
  value,
}: SearchFieldProps) {
  return (
    <label className={cn("group relative block min-w-[16rem] flex-1", className)}>
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center border-r border-[var(--border)] bg-white/72 text-[var(--muted)] transition group-focus-within:text-[var(--primary)]">
        <Search className="h-4 w-4" />
      </span>
      <input
        aria-label={placeholder}
        className={cn("nibol-field h-12 pl-14 pr-12 text-sm", inputClassName)}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {value ? (
        <button
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
          onClick={() => {
            onChange("");
          }}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      ) : isBusy ? (
        <span className="absolute right-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--primary)]" />
      ) : null}
    </label>
  );
}
