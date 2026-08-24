"use client";

import { useId, useMemo, useState } from "react";

import { Check, Search, X } from "lucide-react";

import { cn } from "@/utils";

type RiskOption = {
  description?: string | null;
  id: string;
  name: string;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();

export function RiskSearchMultiSelect({
  disabled = false,
  id,
  onChange,
  risks,
  value,
}: {
  disabled?: boolean;
  id?: string;
  onChange: (riskIds: string[]) => void;
  risks: RiskOption[];
  value: string[];
}) {
  const generatedId = useId();
  const listboxId = `${id ?? generatedId}-options`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedRisks = useMemo(
    () =>
      value
        .map((riskId) => risks.find((risk) => risk.id === riskId))
        .filter(Boolean) as RiskOption[],
    [risks, value],
  );
  const results = useMemo(() => {
    const needle = normalize(query.trim());
    return risks
      .filter(
        (risk) =>
          !needle ||
          normalize(`${risk.name} ${risk.description ?? ""}`).includes(needle),
      )
      .slice(0, 20);
  }, [query, risks]);

  const toggleRisk = (riskId: string) => {
    onChange(
      value.includes(riskId)
        ? value.filter((currentId) => currentId !== riskId)
        : [...value, riskId],
    );
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 transition focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/15",
          disabled && "cursor-not-allowed bg-stone-100 opacity-70",
        )}
      >
        {selectedRisks.map((risk) => (
          <span
            className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900"
            key={risk.id}
          >
            <span className="truncate">{risk.name}</span>
            <button
              aria-label={`Quitar riesgo ${risk.name}`}
              className="rounded-full p-0.5 text-amber-700 transition hover:bg-amber-100 hover:text-amber-950"
              disabled={disabled}
              onClick={() => toggleRisk(risk.id)}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-0 h-4 w-4 text-stone-400" />
          <input
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={open}
            aria-label="Buscar riesgos asociados"
            autoComplete="off"
            className="w-full border-0 bg-transparent py-1 pl-6 text-sm text-stone-900 outline-none placeholder:text-stone-400"
            disabled={disabled}
            id={id}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={
              selectedRisks.length
                ? "Agregar otro riesgo"
                : "Buscar por nombre o descripción"
            }
            role="combobox"
            type="search"
            value={query}
          />
        </div>
      </div>
      {open ? (
        <div
          className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-stone-200 bg-white p-1 shadow-xl"
          id={listboxId}
          role="listbox"
        >
          {results.length ? (
            results.map((risk) => {
              const selected = value.includes(risk.id);
              return (
                <button
                  aria-selected={selected}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-amber-50",
                    selected && "bg-amber-50",
                  )}
                  key={risk.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    toggleRisk(risk.id);
                    setQuery("");
                    setOpen(true);
                  }}
                  role="option"
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-stone-900">
                      {risk.name}
                    </span>
                    {risk.description ? (
                      <span className="mt-0.5 block truncate text-xs font-normal text-stone-500">
                        {risk.description}
                      </span>
                    ) : null}
                  </span>
                  {selected ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  ) : null}
                </button>
              );
            })
          ) : (
            <p className="px-3 py-4 text-sm text-stone-500">
              No se encontraron riesgos con ese criterio.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
