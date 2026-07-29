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
    <label
      className={cn("group relative block min-w-[16rem] flex-1", className)}
    >
      <span className="pointer-events-none absolute top-1/2 left-4 flex -translate-y-1/2 items-center justify-center text-[var(--muted)] transition group-focus-within:text-[var(--primary)]">
        <Search className="h-4 w-4" />
      </span>
      <input
        aria-label={placeholder}
        className={cn(
          "nibol-field block h-12 pr-12 pl-11 text-sm leading-5",
          inputClassName,
        )}
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
          className="absolute top-1/2 right-2.5 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
          onClick={() => {
            onChange("");
          }}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      ) : isBusy ? (
        <span className="absolute top-1/2 right-4 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--primary)]" />
      ) : null}
    </label>
  );
}
