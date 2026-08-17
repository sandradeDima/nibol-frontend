"use client";

import { useId, useMemo, useState } from "react";

import { Check, Search } from "lucide-react";

import { cn } from "@/utils";

type UserOption = {
  email: string;
  id: string;
  jobTitle?: string | null;
  name: string;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();

export function UserSearchSelect({
  disabled = false,
  id,
  onChange,
  placeholder = "Buscar por nombre o correo",
  users,
  value,
}: {
  disabled?: boolean;
  id?: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  users: UserOption[];
  value: string;
}) {
  const generatedId = useId();
  const listboxId = `${id ?? generatedId}-options`;
  const selected = users.find((user) => user.id === value) ?? null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return users.slice(0, 20);
    return users
      .filter((user) =>
        normalize(`${user.name} ${user.email}`).includes(needle),
      )
      .slice(0, 20);
  }, [query, users]);
  const inputValue = open
    ? query
    : selected
      ? `${selected.name} · ${selected.email}`
      : "";

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-3.5 left-3 z-10 h-4 w-4 text-stone-400" />
      <input
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open}
        autoComplete="off"
        className="nibol-field pl-10"
        disabled={disabled}
        id={id}
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
        placeholder={placeholder}
        role="combobox"
        type="search"
        value={inputValue}
      />
      {open ? (
        <div
          className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-stone-200 bg-white p-1 shadow-xl"
          role="listbox"
          id={listboxId}
        >
          {results.length ? (
            results.map((user) => (
              <button
                aria-selected={user.id === value}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-amber-50",
                  user.id === value && "bg-amber-50",
                )}
                key={user.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(user.id);
                  setQuery("");
                  setOpen(false);
                }}
                role="option"
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-stone-900">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs font-normal text-stone-500">
                    {user.email}
                    {user.jobTitle ? ` · ${user.jobTitle}` : ""}
                  </span>
                </span>
                {user.id === value ? (
                  <Check className="h-4 w-4 shrink-0 text-amber-700" />
                ) : null}
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-stone-500">
              No se encontraron usuarios por nombre o correo.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
