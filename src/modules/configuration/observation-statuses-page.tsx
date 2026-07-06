"use client";

import { useMemo, useState } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { QUERY_KEYS } from "@/lib/constants";
import {
  observationStatusFormSchema,
  type ObservationStatusFormValues,
} from "@/modules/configuration/forms";
import { configurationService } from "@/services/configuration-service";
import type {
  ObservationStatusMutationInput,
  ObservationStatusRecord,
} from "@/types";
import { getApiErrorMessage } from "@/utils";

import {
  ACTIVE_FILTER_OPTIONS,
  ActiveBadge,
  ConfigurationDialogForm,
  FieldError,
  formatConfigurationDate,
  inputClassName,
  renderOptionalText,
  ToggleCard,
  ToneBadge,
} from "./shared";

type ObservationStatusesPageProps = {
  canCreate: boolean;
  canDelete: boolean;
  canEdit: boolean;
};

const observationStatusColumns: ColumnDef<ObservationStatusRecord>[] = [
  {
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="min-w-[18rem] space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-stone-950">{row.original.name}</p>
          <span className="inline-flex items-center border border-stone-300 bg-stone-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-700">
            {row.original.key}
          </span>
        </div>
        <p className="text-sm leading-6 text-stone-600">
          {renderOptionalText(row.original.description)}
        </p>
      </div>
    ),
    header: "Estado",
  },
  {
    accessorKey: "sortOrder",
    cell: ({ row }) => (
      <span className="font-semibold text-stone-900">{row.original.sortOrder}</span>
    ),
    header: "Orden",
  },
  {
    accessorKey: "isInitial",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-2">
        {row.original.isInitial ? <ToneBadge label="Inicial" tone="info" /> : null}
        {row.original.isFinal ? <ToneBadge label="Final" tone="success" /> : null}
        {row.original.countsAsOverdue ? (
          <ToneBadge label="Vence" tone="danger" />
        ) : null}
        {!row.original.isInitial && !row.original.isFinal && !row.original.countsAsOverdue ? (
          <span className="text-stone-500">Sin marcadores</span>
        ) : null}
      </div>
    ),
    enableSorting: false,
    header: "Ciclo de vida",
  },
  {
    accessorKey: "active",
    cell: ({ row }) => <ActiveBadge active={row.original.active} />,
    enableSorting: false,
    header: "Estado",
  },
  {
    accessorKey: "updatedAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatConfigurationDate(row.original.updatedAt)}
      </span>
    ),
    header: "Actualizado",
  },
];

const emptyFormValues: ObservationStatusFormValues = {
  active: true,
  countsAsOverdue: false,
  description: "",
  isFinal: false,
  isInitial: false,
  key: "",
  name: "",
  sortOrder: 0,
};

const mapRecordToFormValues = (
  record: ObservationStatusRecord | null,
): ObservationStatusFormValues => {
  if (!record) {
    return emptyFormValues;
  }

  return {
    active: record.active,
    countsAsOverdue: record.countsAsOverdue,
    description: record.description ?? "",
    isFinal: record.isFinal,
    isInitial: record.isInitial,
    key: record.key,
    name: record.name,
    sortOrder: record.sortOrder,
  };
};

const buildPayload = (
  values: ObservationStatusFormValues,
): ObservationStatusMutationInput => ({
  active: values.active,
  countsAsOverdue: values.countsAsOverdue,
  description: values.description.trim().length > 0 ? values.description.trim() : null,
  isFinal: values.isFinal,
  isInitial: values.isInitial,
  key: values.key.trim().toUpperCase(),
  name: values.name.trim(),
  sortOrder: values.sortOrder,
});

export function ObservationStatusesPage({
  canCreate,
  canDelete,
  canEdit,
}: ObservationStatusesPageProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ObservationStatusRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentValues = useMemo(
    () => mapRecordToFormValues(editingRecord),
    [editingRecord],
  );

  const tableConfig: DataTableConfig<ObservationStatusRecord> = {
    columns: observationStatusColumns,
    defaultSort: {
      desc: false,
      id: "sortOrder",
    },
    emptyState: {
      description:
        "Defina el ciclo de vida de las observaciones y marque el estado inicial, final o vencido segun la operacion esperada.",
      title: "No hay estados configurados",
    },
    filters: [
      {
        id: "active",
        label: "Estado",
        options: ACTIVE_FILTER_OPTIONS,
        placeholder: "Todos los registros",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: ["configuration", "observation-statuses", "table"],
    rowActions: [
      {
        hidden: !canEdit,
        icon: Pencil,
        id: "edit",
        label: "Editar",
        onClick: (row) => {
          setSubmitError(null);
          setEditingRecord(row);
          setDialogOpen(true);
        },
        variant: "edit",
      },
      {
        confirmation: {
          confirmLabel: "Eliminar estado",
          description: (rows) =>
            `Eliminar ${rows[0]?.name ?? "este estado"} mediante borrado logico?`,
          title: "Eliminar estado de observacion?",
          tone: "danger",
        },
        hidden: !canDelete,
        icon: Trash2,
        id: "delete",
        label: "Eliminar",
        onClick: async (row) => {
          await configurationService.deleteObservationStatus(row.id);
          await queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.configurationBootstrap,
          });
        },
        tone: "danger",
        variant: "delete",
      },
    ],
    searchPlaceholder: "Buscar por nombre, clave o descripcion",
  };

  return (
    <>
      <main className="space-y-6">
        <PageHeader
          actions={
            canCreate ? (
              <button
                className="nibol-btn-primary"
                onClick={() => {
                  setSubmitError(null);
                  setEditingRecord(null);
                  setDialogOpen(true);
                }}
                type="button"
              >
                Nuevo estado
              </button>
            ) : null
          }
          description="Modele el flujo de seguimiento desde el estado inicial hasta el cierre, incluyendo vencimientos y rechazos del circuito de auditoria."
          eyebrow="Configuracion NIBOL"
          title="Estados de observacion"
        />

        <DataTable config={tableConfig} endpoint="/observation-statuses" />
      </main>

      <ConfigurationDialogForm
        defaultValues={currentValues}
        description="Ajuste el orden, la clave interna y el comportamiento de cada estado dentro del ciclo de vida de una observacion."
        mode={editingRecord ? "edit" : "create"}
        onOpenChange={(open) => {
          setDialogOpen(open);

          if (!open) {
            setEditingRecord(null);
            setSubmitError(null);
          }
        }}
        onSubmit={async (values) => {
          try {
            const payload = buildPayload(values);

            if (editingRecord) {
              await configurationService.updateObservationStatus(editingRecord.id, payload);
            } else {
              await configurationService.createObservationStatus(payload);
            }

            setSubmitError(null);
            setDialogOpen(false);
            setEditingRecord(null);

            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["configuration", "observation-statuses", "table"],
              }),
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.configurationBootstrap,
              }),
            ]);
          } catch (error) {
            setSubmitError(getApiErrorMessage(error));
          }
        }}
        open={dialogOpen}
        renderFields={(form, isBusy) => (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Nombre</span>
                <input
                  className={inputClassName}
                  disabled={isBusy}
                  placeholder="Ej. En revision"
                  {...form.register("name")}
                />
                <FieldError error={form.formState.errors.name?.message} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Clave</span>
                <input
                  className={`${inputClassName} uppercase`}
                  disabled={isBusy}
                  placeholder="EN_REVISION"
                  {...form.register("key")}
                />
                <FieldError error={form.formState.errors.key?.message} />
              </label>

              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Orden</span>
                <input
                  className={inputClassName}
                  disabled={isBusy}
                  min={0}
                  type="number"
                  {...form.register("sortOrder")}
                />
                <FieldError error={form.formState.errors.sortOrder?.message} />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Descripcion</span>
              <textarea
                className="nibol-field min-h-28 resize-y py-3"
                disabled={isBusy}
                placeholder="Explique cuando debe usarse este estado en el flujo operativo."
                {...form.register("description")}
              />
              <FieldError error={form.formState.errors.description?.message} />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <ToggleCard
                description="Se propone automaticamente al crear una nueva observacion si es el unico estado inicial activo."
                disabled={isBusy}
                label="Estado inicial"
                registration={form.register("isInitial")}
              />
              <ToggleCard
                description="Marca el cierre o descarte definitivo de una observacion."
                disabled={isBusy}
                label="Estado final"
                registration={form.register("isFinal")}
              />
              <ToggleCard
                description="Permite que el sistema lo trate como observacion vencida para vistas y alertas."
                disabled={isBusy}
                label="Cuenta como vencida"
                registration={form.register("countsAsOverdue")}
              />
              <ToggleCard
                description="Los estados inactivos dejan de aparecer en formularios regulares."
                disabled={isBusy}
                label="Estado activo"
                registration={form.register("active")}
              />
            </div>
          </>
        )}
        resetKey={editingRecord?.id ?? "create"}
        saveLabel={editingRecord ? "Guardar cambios" : "Crear estado"}
        savingLabel={editingRecord ? "Guardando..." : "Creando..."}
        schema={observationStatusFormSchema}
        submitError={submitError}
        title={editingRecord ? "Editar estado" : "Nuevo estado"}
      />
    </>
  );
}
