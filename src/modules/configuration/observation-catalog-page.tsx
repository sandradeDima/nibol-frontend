"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Save, Search, X } from "lucide-react";

import {
  observationCatalogService,
  type CatalogEntry,
} from "@/services/observation-catalog-service";
import { getApiErrorMessage } from "@/utils";

const emptyDraft = { description: "", name: "" };

export function ObservationCatalogPage({
  kind,
}: {
  kind: "risks" | "observation-dictionary";
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState<CatalogEntry | null>(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const queryKey = ["observation-catalog", kind, search];
  const query = useQuery({
    queryFn: () => observationCatalogService.list(kind, search),
    queryKey,
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["observation-catalog", kind] });
  const create = useMutation({
    mutationFn: () => observationCatalogService.create(kind, draft),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setDraft(emptyDraft);
      setError(null);
      await refresh();
    },
  });
  const update = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<{
        description: string | null;
        isActive: boolean;
        name: string;
      }>;
    }) => observationCatalogService.update(kind, id, input),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setEditing(null);
      setError(null);
      await refresh();
    },
  });

  return (
    <section className="nibol-panel overflow-hidden">
      <form
        className="grid gap-3 border-b border-stone-200 bg-stone-50 p-5 md:grid-cols-[1fr_1.5fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          create.mutate();
        }}
      >
        <input
          className="nibol-field"
          minLength={2}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.target.value }))
          }
          placeholder="Nombre"
          required
          value={draft.name}
        />
        <input
          className="nibol-field"
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="Descripción opcional"
          value={draft.description}
        />
        <button
          className="nibol-btn-primary px-4 py-2 text-sm"
          disabled={create.isPending}
          type="submit"
        >
          <Plus className="h-4 w-4" />
          {create.isPending ? "Agregando…" : "Agregar"}
        </button>
      </form>

      <div className="border-b border-stone-200 p-5">
        <label className="relative block max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            aria-label="Buscar en el catálogo"
            className="nibol-field pl-10"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o descripción"
            type="search"
            value={search}
          />
        </label>
      </div>

      {error ? (
        <p
          aria-live="polite"
          className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="divide-y divide-stone-200">
        {query.data?.map((entry) =>
          editing?.id === entry.id ? (
            <form
              className="grid gap-3 bg-amber-50/50 p-5 md:grid-cols-[1fr_1.5fr_auto]"
              key={entry.id}
              onSubmit={(event) => {
                event.preventDefault();
                update.mutate({
                  id: entry.id,
                  input: {
                    description: editDraft.description.trim() || null,
                    name: editDraft.name.trim(),
                  },
                });
              }}
            >
              <input
                aria-label="Nombre"
                className="nibol-field"
                minLength={2}
                onChange={(event) =>
                  setEditDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
                value={editDraft.name}
              />
              <input
                aria-label="Descripción"
                className="nibol-field"
                onChange={(event) =>
                  setEditDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                value={editDraft.description}
              />
              <div className="flex gap-2">
                <button
                  className="nibol-btn-primary px-3 py-2 text-xs"
                  disabled={update.isPending}
                  type="submit"
                >
                  <Save className="h-4 w-4" /> Guardar
                </button>
                <button
                  aria-label="Cancelar edición"
                  className="nibol-btn-secondary px-3 py-2"
                  onClick={() => setEditing(null)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : (
            <div
              className="flex flex-wrap items-center justify-between gap-4 p-5"
              key={entry.id}
            >
              <div>
                <p className="font-semibold">{entry.name}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {entry.description ?? "Sin descripción"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="nibol-btn-secondary px-3 py-2 text-xs"
                  onClick={() => {
                    setError(null);
                    setEditing(entry);
                    setEditDraft({
                      description: entry.description ?? "",
                      name: entry.name,
                    });
                  }}
                  type="button"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  className="nibol-btn-secondary px-3 py-2 text-xs"
                  onClick={() =>
                    update.mutate({
                      id: entry.id,
                      input: { isActive: !entry.isActive },
                    })
                  }
                  type="button"
                >
                  {entry.isActive ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ),
        )}
        {!query.isLoading && query.data?.length === 0 ? (
          <p className="p-8 text-center text-sm text-stone-500">
            No hay resultados para “{search}”.
          </p>
        ) : null}
      </div>
    </section>
  );
}
