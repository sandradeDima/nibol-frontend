"use client";

import { useMemo, useState } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { QUERY_KEYS } from "@/lib/constants";
import {
  riskLevelFormSchema,
  type RiskLevelFormValues,
} from "@/modules/configuration/forms";
import { configurationService } from "@/services/configuration-service";
import type { RiskLevelMutationInput, RiskLevelRecord } from "@/types";
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

type RiskLevelsPageProps = {
  canCreate: boolean;
  canDelete: boolean;
  canEdit: boolean;
};

const riskLevelColumns: ColumnDef<RiskLevelRecord>[] = [
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
    header: "Nivel",
  },
  {
    accessorKey: "severityOrder",
    cell: ({ row }) => (
      <span className="font-semibold text-stone-900">{row.original.severityOrder}</span>
    ),
    header: "Prioridad",
  },
  {
    accessorKey: "defaultDeadlineDays",
    cell: ({ row }) => (
      <span className="text-stone-700">
        {row.original.defaultDeadlineDays
          ? `${row.original.defaultDeadlineDays} dias`
          : "Sin plazo por defecto"}
      </span>
    ),
    header: "Plazo sugerido",
  },
  {
    accessorKey: "colorToken",
    cell: ({ row }) =>
      row.original.colorToken ? (
        <ToneBadge label={row.original.colorToken} tone="info" />
      ) : (
        <span className="text-stone-500">Sin token</span>
      ),
    enableSorting: false,
    header: "Color",
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

const emptyFormValues: RiskLevelFormValues = {
  active: true,
  colorToken: "",
  defaultDeadlineDays: "",
  description: "",
  key: "",
  name: "",
  severityOrder: 1,
};

const mapRecordToFormValues = (record: RiskLevelRecord | null): RiskLevelFormValues => {
  if (!record) {
    return emptyFormValues;
  }

  return {
    active: record.active,
    colorToken: record.colorToken ?? "",
    defaultDeadlineDays:
      record.defaultDeadlineDays === null ? "" : String(record.defaultDeadlineDays),
    description: record.description ?? "",
    key: record.key,
    name: record.name,
    severityOrder: record.severityOrder,
  };
};

const buildPayload = (values: RiskLevelFormValues): RiskLevelMutationInput => ({
  active: values.active,
  colorToken: values.colorToken.trim().length > 0 ? values.colorToken.trim() : null,
  defaultDeadlineDays:
    values.defaultDeadlineDays.trim().length > 0
      ? Number(values.defaultDeadlineDays)
      : null,
  description: values.description.trim().length > 0 ? values.description.trim() : null,
  key: values.key.trim().toUpperCase(),
  name: values.name.trim(),
  severityOrder: values.severityOrder,
});

export function RiskLevelsPage({
  canCreate,
  canDelete,
  canEdit,
}: RiskLevelsPageProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RiskLevelRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentValues = useMemo(
    () => mapRecordToFormValues(editingRecord),
    [editingRecord],
  );

  const tableConfig: DataTableConfig<RiskLevelRecord> = {
    columns: riskLevelColumns,
    defaultSort: {
      desc: false,
      id: "severityOrder",
    },
    emptyState: {
      description:
        "Configure los niveles que definen la severidad, el color corporativo y el plazo sugerido para cada observacion.",
      title: "No hay niveles de riesgo cargados",
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
    queryKey: ["configuration", "risk-levels", "table"],
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
          confirmLabel: "Eliminar nivel",
          description: (rows) =>
            `Eliminar ${rows[0]?.name ?? "este nivel"} mediante borrado logico?`,
          title: "Eliminar nivel de riesgo?",
          tone: "danger",
        },
        hidden: !canDelete,
        icon: Trash2,
        id: "delete",
        label: "Eliminar",
        onClick: async (row) => {
          await configurationService.deleteRiskLevel(row.id);
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
                Nuevo nivel
              </button>
            ) : null
          }
          description="Controle la criticidad de los hallazgos y el plazo sugerido que el formulario aplicara automaticamente cuando el auditor seleccione un nivel de riesgo."
          eyebrow="Configuracion NIBOL"
          title="Niveles de riesgo"
        />

        <DataTable config={tableConfig} endpoint="/risk-levels" />
      </main>

      <ConfigurationDialogForm
        defaultValues={currentValues}
        description="Mantenga la severidad, el plazo por defecto y el token visual usado por el sistema de seguimiento."
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
              await configurationService.updateRiskLevel(editingRecord.id, payload);
            } else {
              await configurationService.createRiskLevel(payload);
            }

            setSubmitError(null);
            setDialogOpen(false);
            setEditingRecord(null);

            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["configuration", "risk-levels", "table"],
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
                  placeholder="Ej. Critico"
                  {...form.register("name")}
                />
                <FieldError error={form.formState.errors.name?.message} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Clave</span>
                <input
                  className={`${inputClassName} uppercase`}
                  disabled={isBusy}
                  placeholder="CRITICO"
                  {...form.register("key")}
                />
                <FieldError error={form.formState.errors.key?.message} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Orden de severidad</span>
                <input
                  className={inputClassName}
                  disabled={isBusy}
                  min={1}
                  type="number"
                  {...form.register("severityOrder")}
                />
                <FieldError error={form.formState.errors.severityOrder?.message} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Dias de plazo por defecto</span>
                <input
                  className={inputClassName}
                  disabled={isBusy}
                  min={1}
                  placeholder="30"
                  type="number"
                  {...form.register("defaultDeadlineDays")}
                />
                <FieldError error={form.formState.errors.defaultDeadlineDays?.message} />
              </label>

              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Token de color</span>
                <input
                  className={inputClassName}
                  disabled={isBusy}
                  placeholder="critical, high, medium, low"
                  {...form.register("colorToken")}
                />
                <FieldError error={form.formState.errors.colorToken?.message} />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Descripcion</span>
              <textarea
                className="nibol-field min-h-28 resize-y py-3"
                disabled={isBusy}
                placeholder="Explique el criterio operativo de este nivel."
                {...form.register("description")}
              />
              <FieldError error={form.formState.errors.description?.message} />
            </label>

            <ToggleCard
              description="Los niveles inactivos ya no podran seleccionarse en altas o ediciones normales."
              disabled={isBusy}
              label="Nivel activo"
              registration={form.register("active")}
            />
          </>
        )}
        resetKey={editingRecord?.id ?? "create"}
        saveLabel={editingRecord ? "Guardar cambios" : "Crear nivel"}
        savingLabel={editingRecord ? "Guardando..." : "Creando..."}
        schema={riskLevelFormSchema}
        submitError={submitError}
        title={editingRecord ? "Editar nivel de riesgo" : "Nuevo nivel de riesgo"}
      />
    </>
  );
}
