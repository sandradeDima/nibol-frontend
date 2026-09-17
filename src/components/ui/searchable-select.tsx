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

type BaseProps = {
  disabled?: boolean;
  id?: string;
  options: Option[];
  placeholder: string;
  showSelectedValues?: boolean;
};

type SingleSelectProps = BaseProps & {
  multiple?: false;
  onChange: (value: string) => void;
  value: string;
};

type MultiSelectProps = BaseProps & {
  multiple: true;
  onChange: (value: string[]) => void;
  value: string[];
};

export function SearchableSelect(props: SingleSelectProps): React.ReactElement;
export function SearchableSelect(props: MultiSelectProps): React.ReactElement;
export function SearchableSelect({
  disabled,
  id,
  multiple = false,
  onChange,
  options,
  placeholder,
  showSelectedValues = true,
  value,
}: SingleSelectProps | MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const listboxId = `${useId()}-options`;
  const selectedIds: string[] = multiple
    ? (value as string[])
    : value
      ? [value as string]
      : [];
  const selectedOptions = selectedIds.map(
    (id) => options.find((option) => option.id === id) ?? { id, label: id },
  );
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
  const selected = options.find(
    (option) => option.id === (multiple ? "" : (value as string)),
  );
  const updateSelection = (nextIds: string[]) => {
    if (multiple) {
      (onChange as (nextValue: string[]) => void)(nextIds);
    } else {
      (onChange as (nextValue: string) => void)(nextIds[0] ?? "");
    }
  };

  return (
    <div className={cn("relative", open ? "z-50" : "z-20")}>
      <SearchFieldFrame
        className={multiple ? "h-auto min-h-12" : undefined}
        endAdornment={
          showSelectedValues && selectedIds.length > 0 && !disabled ? (
            <button
              aria-label="Limpiar selección"
              className="mr-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center text-stone-400 hover:bg-stone-100"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => updateSelection([])}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null
        }
      >
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center",
            multiple && "flex-wrap gap-1.5 py-1",
          )}
        >
          {multiple && showSelectedValues
            ? selectedOptions.map((option) => (
                <span
                  className="inline-flex max-w-full items-center gap-1 border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900"
                  key={option.id}
                >
                  <span className="max-w-[12rem] truncate">{option.label}</span>
                  <button
                    aria-label={`Quitar ${option.label}`}
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-amber-700 hover:bg-amber-100"
                    disabled={disabled}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() =>
                      updateSelection(
                        selectedIds.filter(
                          (selectedId) => selectedId !== option.id,
                        ),
                      )
                    }
                    type="button"
                  >
                    <X aria-hidden="true" className="h-3 w-3" />
                  </button>
                </span>
              ))
            : null}
          <input
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={open}
            autoComplete="off"
            className={cn(
              "min-w-0 flex-1 border-0 bg-transparent px-3 text-sm outline-none placeholder:text-stone-400",
              multiple ? "h-9 min-w-[8rem]" : "h-full",
            )}
            disabled={disabled}
            id={id}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!multiple && value) updateSelection([]);
              setOpen(true);
            }}
            onFocus={() => {
              setQuery("");
              setOpen(true);
            }}
            placeholder={
              multiple
                ? selectedIds.length > 0
                  ? showSelectedValues
                    ? "Agregar otro…"
                    : placeholder
                  : placeholder
                : showSelectedValues && selected
                  ? selected.label
                  : placeholder
            }
            role="combobox"
            type="search"
            value={open ? query : ""}
          />
        </div>
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
                aria-selected={selectedIds.includes(option.id)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-amber-50",
                  selectedIds.includes(option.id) && "bg-amber-50",
                )}
                key={option.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  const nextIds = selectedIds.includes(option.id)
                    ? selectedIds.filter((id) => id !== option.id)
                    : [...selectedIds, option.id];
                  updateSelection(nextIds);
                  setQuery("");
                  setOpen(multiple);
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
                {selectedIds.includes(option.id) ? (
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
