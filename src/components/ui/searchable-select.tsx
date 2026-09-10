"use client";

import { useId, useMemo, useState } from "react";
import { Check, X } from "lucide-react";

import { SearchFieldFrame } from "@/components/ui/search-field";
import { cn } from "@/utils";

type Option = {
  description?: string | null;
  id: string;
  label: string;
  search?: string;
};

export function SearchableSelect({
  disabled,
  onChange,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const listboxId = `${useId()}-options`;
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return options
      .filter(
        (option) =>
          !needle ||
          `${option.label} ${option.search ?? ""} ${option.description ?? ""}`
            .toLocaleLowerCase()
            .includes(needle),
      )
      .slice(0, 30);
  }, [options, query]);
  const selected = options.find((option) => option.id === value);
  return (
    <div className={cn("relative", open ? "z-50" : "z-20")}>
      <SearchFieldFrame
        endAdornment={
          value && !disabled ? (
            <button
              aria-label="Limpiar selección"
              className="mr-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center text-stone-400 hover:bg-stone-100"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onChange("")}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null
        }
      >
        <input
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          autoComplete="off"
          className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm outline-none placeholder:text-stone-400"
          disabled={disabled}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            setQuery(event.target.value);
            if (value) onChange("");
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          placeholder={selected ? selected.label : placeholder}
          role="combobox"
          type="search"
          value={open ? query : ""}
        />
      </SearchFieldFrame>
      {open ? (
        <div
          className="absolute top-full left-0 z-50 mt-2 max-h-72 min-w-full overflow-y-auto rounded-xl border border-stone-200 bg-white p-1 shadow-xl"
          id={listboxId}
          role="listbox"
        >
          {results.length ? (
            results.map((option) => (
              <button
                aria-selected={option.id === value}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-amber-50",
                  option.id === value && "bg-amber-50",
                )}
                key={option.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.id);
                  setQuery("");
                  setOpen(false);
                }}
                role="option"
                type="button"
              >
                <span>
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  {option.description ? (
                    <span className="block text-xs text-stone-500">
                      {option.description}
                    </span>
                  ) : null}
                </span>
                {option.id === value ? (
                  <Check className="h-4 w-4 text-amber-700" />
                ) : null}
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-stone-500">
              No se encontraron resultados.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
