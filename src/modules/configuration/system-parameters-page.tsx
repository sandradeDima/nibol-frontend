"use client";

import { useMemo, useState } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  systemParameterFormSchema,
  type SystemParameterFormValues,
} from "@/modules/configuration/forms";
import { configurationService } from "@/services/configuration-service";
import type {
  SystemParameterMutationInput,
  SystemParameterRecord,
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
  SYSTEM_PARAMETER_VALUE_TYPE_LABELS,
  SYSTEM_PARAMETER_VALUE_TYPE_OPTIONS,
  ToggleCard,
  ToneBadge,
} from "./shared";

type SystemParametersPageProps = {
  canCreate: boolean;
  canDelete: boolean;
  canEdit: boolean;
};

const parameterGroupOptions = [
  {
    label: "Seguimiento",
    value: "seguimiento",
  },
  {
    label: "Observaciones",
    value: "observaciones",
  },
  {
    label: "Evidencias",
    value: "evidencias",
  },
];

const systemParameterColumns: ColumnDef<SystemParameterRecord>[] = [
  {
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="min-w-[18rem] space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-stone-950">{row.original.name}</p>
          <span className="inline-flex items-center border border-stone-300 bg-stone-100 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-stone-700">
            {row.original.key}
          </span>
        </div>
        <p className="text-sm leading-6 text-stone-600">
          {renderOptionalText(row.original.description)}
        </p>
      </div>
    ),
    header: "Parametro",
  },
  {
    accessorKey: "group",
    cell: ({ row }) => (
      <span className="font-medium capitalize text-stone-800">
        {row.original.group.replaceAll("_", " ")}
      </span>
    ),
    header: "Grupo",
  },
  {
    accessorKey: "valueType",
    cell: ({ row }) => (
      <ToneBadge
        label={SYSTEM_PARAMETER_VALUE_TYPE_LABELS[row.original.valueType]}
        tone="warning"
      />
    ),
    header: "Tipo",
  },
  {
    accessorKey: "value",
    cell: ({ row }) => (
      <code className="rounded bg-stone-100 px-2 py-1 text-xs text-stone-700">
        {row.original.value}
      </code>
    ),
    enableSorting: false,
    header: "Valor",
  },
  {
    accessorKey: "editable",
    cell: ({ row }) =>
      row.original.editable ? (
        <ToneBadge label="Editable" tone="success" />
      ) : (
        <ToneBadge label="Bloqueado" tone="neutral" />
      ),
    enableSorting: false,
    header: "Edicion",
  },
  {
    accessorKey: "active",
    cell: ({ row }) => <ActiveBadge active={row.original.active} />,
    enableSorting: false,
    header: "Estado",
  },
];

const emptyFormValues: SystemParameterFormValues = {
  active: true,
  description: "",
  editable: true,
  group: "seguimiento",
  key: "",
  name: "",
  value: "",
  valueType: "string",
};

const mapRecordToFormValues = (
  record: SystemParameterRecord | null,
): SystemParameterFormValues => {
  if (!record) {
    return emptyFormValues;
  }

  return {
    active: record.active,
    description: record.description ?? "",
    editable: record.editable,
    group: record.group,
    key: record.key,
    name: record.name,
    value: record.value,
    valueType: record.valueType,
  };
};

const buildPayload = (
  values: SystemParameterFormValues,
): SystemParameterMutationInput => ({
  active: values.active,
  description: values.description.trim().length > 0 ? values.description.trim() : null,
  editable: values.editable,
  group: values.group.trim().toLowerCase(),
  key: values.key.trim().toLowerCase(),
  name: values.name.trim(),
  value: values.value.trim(),
  valueType: values.valueType,
});

export function SystemParametersPage({
  canCreate,
  canDelete,
  canEdit,
}: SystemParametersPageProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SystemParameterRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentValues = useMemo(
    () => mapRecordToFormValues(editingRecord),
    [editingRecord],
  );

  const tableConfig: DataTableConfig<SystemParameterRecord> = {
    columns: systemParameterColumns,
    defaultSort: {
      desc: false,
      id: "group",
    },
    emptyState: {
      description:
        "Cree parametros para recordatorios, vencimientos y otras reglas operativas reutilizables del modulo de seguimiento.",
      title: "No hay parametros definidos",
    },
    filters: [
      {
        id: "active",
        label: "Estado",
        options: ACTIVE_FILTER_OPTIONS,
        placeholder: "Todos los registros",
        type: "select",
      },
      {
        id: "valueType",
        label: "Tipo",
        options: SYSTEM_PARAMETER_VALUE_TYPE_OPTIONS,
        placeholder: "Todos los tipos",
        type: "select",
      },
      {
        id: "group",
        label: "Grupo",
        options: parameterGroupOptions,
        placeholder: "Todos los grupos",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: ["configuration", "system-parameters", "table"],
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
          confirmLabel: "Eliminar parametro",
          description: (rows) =>
            `Eliminar ${rows[0]?.name ?? "este parametro"} mediante borrado logico?`,
          title: "Eliminar parametro?",
          tone: "danger",
        },
        hidden: !canDelete,
        icon: Trash2,
        id: "delete",
        label: "Eliminar",
        onClick: async (row) => {
          await configurationService.deleteSystemParameter(row.id);
        },
        tone: "danger",
        variant: "delete",
      },
    ],
    searchPlaceholder: "Buscar por nombre, clave, descripcion o grupo",
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
                Nuevo parametro
              </button>
            ) : null
          }
          description="Administre recordatorios, reglas de vencimiento y defaults operativos que soportan el comportamiento general del sistema de seguimiento."
          eyebrow="Configuracion NIBOL"
          title="Parametros generales"
        />

        <DataTable config={tableConfig} endpoint="/system-parameters" />
      </main>

      <ConfigurationDialogForm
        defaultValues={currentValues}
        description="Mantenga claves operativas, grupo funcional y tipo de valor para cada parametro del sistema."
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
              await configurationService.updateSystemParameter(editingRecord.id, payload);
            } else {
              await configurationService.createSystemParameter(payload);
            }

            setSubmitError(null);
            setDialogOpen(false);
            setEditingRecord(null);

            await queryClient.invalidateQueries({
              queryKey: ["configuration", "system-parameters", "table"],
            });
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
                  placeholder="Ej. Dias previos para recordatorio"
                  {...form.register("name")}
                />
                <FieldError error={form.formState.errors.name?.message} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Clave</span>
                <input
                  className={`${inputClassName} lowercase`}
                  disabled={isBusy}
                  placeholder="reminder_days_before_due"
                  {...form.register("key")}
                />
                <FieldError error={form.formState.errors.key?.message} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Grupo</span>
                <input
                  className={`${inputClassName} lowercase`}
                  disabled={isBusy}
                  placeholder="seguimiento"
                  {...form.register("group")}
                />
                <FieldError error={form.formState.errors.group?.message} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Tipo de valor</span>
                <select
                  className={inputClassName}
                  disabled={isBusy}
                  {...form.register("valueType")}
                >
                  {SYSTEM_PARAMETER_VALUE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError error={form.formState.errors.valueType?.message} />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Valor</span>
              <textarea
                className="nibol-field min-h-28 resize-y py-3 font-mono text-sm"
                disabled={isBusy}
                placeholder="Ingrese el valor segun el tipo definido"
                {...form.register("value")}
              />
              <FieldError error={form.formState.errors.value?.message} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Descripcion</span>
              <textarea
                className="nibol-field min-h-24 resize-y py-3"
                disabled={isBusy}
                placeholder="Documente el uso funcional y el impacto de este parametro."
                {...form.register("description")}
              />
              <FieldError error={form.formState.errors.description?.message} />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <ToggleCard
                description="Permite que el parametro siga disponible para la operacion actual."
                disabled={isBusy}
                label="Parametro activo"
                registration={form.register("active")}
              />
              <ToggleCard
                description="Cuando se desactiva la edicion, el valor permanece visible pero no deberia alterarse en la administracion cotidiana."
                disabled={isBusy}
                label="Editable"
                registration={form.register("editable")}
              />
            </div>
          </>
        )}
        resetKey={editingRecord?.id ?? "create"}
        saveLabel={editingRecord ? "Guardar cambios" : "Crear parametro"}
        savingLabel={editingRecord ? "Guardando..." : "Creando..."}
        schema={systemParameterFormSchema}
        submitError={submitError}
        title={editingRecord ? "Editar parametro" : "Nuevo parametro"}
      />
    </>
  );
}
