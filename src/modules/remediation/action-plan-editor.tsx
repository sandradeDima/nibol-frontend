"use client";

import { useState } from "react";

import { Save, X } from "lucide-react";

import { UserSearchSelect } from "@/components/ui/user-search-select";
import type {
  ActionPlanPayload,
  ObservationArea,
  ObservationUserSummary,
} from "@/types";

export type ActionPlanEditorValues = Omit<ActionPlanPayload, "sortOrder">;

export function ActionPlanEditor({
  areas,
  error,
  initial,
  isSaving,
  onCancel,
  onSubmit,
  users,
}: {
  areas: ObservationArea[];
  error: string | null;
  initial: ActionPlanEditorValues;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (values: ActionPlanEditorValues) => void;
  users: ObservationUserSummary[];
}) {
  const [responsibleUserId, setResponsibleUserId] = useState(
    initial.responsibleUserId,
  );

  return (
    <form
      className="grid gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSubmit({
          description: String(formData.get("description") ?? "").trim(),
          dueDate: String(formData.get("dueDate") ?? ""),
          observationAreaId: String(
            formData.get("observationAreaId") ?? initial.observationAreaId,
          ),
          responsibleUserId,
        });
      }}
    >
      <label className="space-y-2 text-sm font-semibold">
        Área
        <select
          className="nibol-field"
          defaultValue={initial.observationAreaId}
          name="observationAreaId"
          required
        >
          <option value="">Seleccione</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.area.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2 text-sm font-semibold">
        Ejecutor
        <UserSearchSelect
          id="action-plan-editor-responsible"
          onChange={setResponsibleUserId}
          users={users}
          value={responsibleUserId}
        />
      </label>
      <label className="space-y-2 text-sm font-semibold md:col-span-2">
        Descripción
        <textarea
          className="nibol-field min-h-24 resize-y py-3"
          defaultValue={initial.description}
          name="description"
          required
        />
      </label>
      <label className="space-y-2 text-sm font-semibold">
        Fecha límite
        <input
          className="nibol-field"
          defaultValue={initial.dueDate.slice(0, 10)}
          name="dueDate"
          required
          type="date"
        />
      </label>
      <div className="flex items-end justify-end gap-2">
        <button
          className="nibol-btn-secondary px-4 py-2.5 text-sm"
          onClick={onCancel}
          type="button"
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
        <button
          className="nibol-btn-primary px-4 py-2.5 text-sm"
          disabled={isSaving}
          type="submit"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
      {error ? (
        <p className="text-sm font-medium text-rose-700 md:col-span-2">
          {error}
        </p>
      ) : null}
    </form>
  );
}
