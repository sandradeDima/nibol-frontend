"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { observationCatalogService } from "@/services/observation-catalog-service";

export function ObservationCatalogPage({
  kind,
}: {
  kind: "risks" | "observation-dictionary";
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const query = useQuery({
    queryFn: () => observationCatalogService.list(kind),
    queryKey: ["observation-catalog", kind],
  });
  const create = useMutation({
    mutationFn: () =>
      observationCatalogService.create(kind, { description, name }),
    onSuccess: async () => {
      setName("");
      setDescription("");
      await queryClient.invalidateQueries({
        queryKey: ["observation-catalog", kind],
      });
    },
  });
  const toggle = useMutation({
    mutationFn: ({ active, id }: { active: boolean; id: string }) =>
      observationCatalogService.update(kind, id, { isActive: active }),
    onSuccess: async () =>
      queryClient.invalidateQueries({
        queryKey: ["observation-catalog", kind],
      }),
  });
  return (
    <section className="nibol-panel overflow-hidden">
      <form
        className="grid gap-3 border-b border-stone-200 bg-stone-50 p-5 md:grid-cols-[1fr_1.5fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <input
          className="nibol-field"
          minLength={2}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre"
          required
          value={name}
        />
        <input
          className="nibol-field"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Descripción opcional"
          value={description}
        />
        <button className="nibol-btn-primary px-4 py-2 text-sm" type="submit">
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </form>
      <div className="divide-y divide-stone-200">
        {query.data?.map((entry) => (
          <div
            className="flex items-center justify-between gap-4 p-5"
            key={entry.id}
          >
            <div>
              <p className="font-semibold">{entry.name}</p>
              <p className="mt-1 text-sm text-stone-500">
                {entry.description ?? "Sin descripción"}
              </p>
            </div>
            <button
              className="nibol-btn-secondary px-3 py-2 text-xs"
              onClick={() =>
                toggle.mutate({ active: !entry.isActive, id: entry.id })
              }
              type="button"
            >
              {entry.isActive ? "Desactivar" : "Activar"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
