"use client";

import { useMemo, useState } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { QUERY_KEYS } from "@/lib/constants";
import {
  catalogFormSchema,
  type CatalogFormValues,
} from "@/modules/configuration/forms";
import { configurationService } from "@/services/configuration-service";
import type { CatalogMutationInput, CatalogRecord } from "@/types";
import { getApiErrorMessage } from "@/utils";

import {
  ACTIVE_FILTER_OPTIONS,
  ActiveBadge,
  CONFIGURATION_CATALOG_TYPE_LABELS,
  CONFIGURATION_CATALOG_TYPE_OPTIONS,
  ConfigurationDialogForm,
  FieldError,
  formatConfigurationDate,
  inputClassName,
  renderOptionalText,
  ToggleCard,
  ToneBadge,
} from "./shared";

type CatalogsPageProps = {
  canCreate: boolean;
  canDelete: boolean;
  canEdit: boolean;
};

const catalogColumns: ColumnDef<CatalogRecord>[] = [
  {
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="min-w-[18rem] space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-stone-950">{row.original.name}</p>
          {row.original.key ? (
            <span className="inline-flex items-center border border-stone-300 bg-stone-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-700">
              {row.original.key}
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-stone-600">
          {renderOptionalText(row.original.description)}
        </p>
      </div>
    ),
    header: "Catalogo",
  },
  {
    accessorKey: "type",
    cell: ({ row }) => (
      <ToneBadge
        label={CONFIGURATION_CATALOG_TYPE_LABELS[row.original.type]}
        tone="info"
      />
    ),
    header: "Tipo",
  },
  {
    accessorKey: "sortOrder",
    cell: ({ row }) => (
      <span className="font-semibold text-stone-900">{row.original.sortOrder}</span>
    ),
    header: "Orden",
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

const emptyFormValues: CatalogFormValues = {
  active: true,
  description: "",
  key: "",
  name: "",
  sortOrder: 0,
  type: "proceso_auditado",
};

const mapRecordToFormValues = (record: CatalogRecord | null): CatalogFormValues => {
  if (!record) {
    return emptyFormValues;
  }

  return {
    active: record.active,
    description: record.description ?? "",
    key: record.key ?? "",
    name: record.name,
    sortOrder: record.sortOrder,
    type: record.type,
  };
};

const buildPayload = (values: CatalogFormValues): CatalogMutationInput => ({
  active: values.active,
  description: values.description.trim().length > 0 ? values.description.trim() : null,
  key: values.key.trim().length > 0 ? values.key.trim().toUpperCase() : null,
  name: values.name.trim(),
  sortOrder: values.sortOrder,
  type: values.type,
});

export function CatalogsPage({ canCreate, canDelete, canEdit }: CatalogsPageProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CatalogRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentValues = useMemo(
    () => mapRecordToFormValues(editingRecord),
    [editingRecord],
  );

  const tableConfig: DataTableConfig<CatalogRecord> = {
    columns: catalogColumns,
    defaultSort: {
      desc: false,
      id: "type",
    },
    emptyState: {
      description:
        "Agrupe procesos, tipos, fuentes y categorias que el auditor usara en los formularios de observaciones y hallazgos.",
      title: "No hay catalogos cargados",
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
        id: "type",
        label: "Tipo",
        options: CONFIGURATION_CATALOG_TYPE_OPTIONS,
        placeholder: "Todos los tipos",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: ["configuration", "catalogs", "table"],
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
          confirmLabel: "Eliminar catalogo",
          description: (rows) =>
            `Eliminar ${rows[0]?.name ?? "este catalogo"} mediante borrado logico?`,
          title: "Eliminar catalogo?",
          tone: "danger",
        },
        hidden: !canDelete,
        icon: Trash2,
        id: "delete",
        label: "Eliminar",
        onClick: async (row) => {
          await configurationService.deleteCatalog(row.id);
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
                Nuevo catalogo
              </button>
            ) : null
          }
          description="Centralice los catalogos basicos que alimentan los formularios de auditoria, observaciones y hallazgos dentro del mismo lenguaje corporativo."
          eyebrow="Configuracion NIBOL"
          title="Catalogos basicos"
        />

        <DataTable config={tableConfig} endpoint="/catalogs" />
      </main>

      <ConfigurationDialogForm
        defaultValues={currentValues}
        description="Mantenga claves, orden y tipo de catalogo para poblar las listas de seleccion del modulo de observaciones."
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
              await configurationService.updateCatalog(editingRecord.id, payload);
            } else {
              await configurationService.createCatalog(payload);
            }

            setSubmitError(null);
            setDialogOpen(false);
            setEditingRecord(null);

            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["configuration", "catalogs", "table"],
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
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Tipo de catalogo</span>
                <select
                  className={inputClassName}
                  disabled={isBusy}
                  {...form.register("type")}
                >
                  {CONFIGURATION_CATALOG_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError error={form.formState.errors.type?.message} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Nombre</span>
                <input
                  className={inputClassName}
                  disabled={isBusy}
                  placeholder="Ej. Auditoria interna"
                  {...form.register("name")}
                />
                <FieldError error={form.formState.errors.name?.message} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Clave</span>
                <input
                  className={`${inputClassName} uppercase`}
                  disabled={isBusy}
                  placeholder="AUDITORIA_INTERNA"
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
                placeholder="Agregue contexto para el catalogo o uso esperado en formularios."
                {...form.register("description")}
              />
              <FieldError error={form.formState.errors.description?.message} />
            </label>

            <ToggleCard
              description="Los catalogos inactivos dejan de mostrarse en las listas de seleccion del formulario de observaciones."
              disabled={isBusy}
              label="Catalogo activo"
              registration={form.register("active")}
            />
          </>
        )}
        resetKey={editingRecord?.id ?? "create"}
        saveLabel={editingRecord ? "Guardar cambios" : "Crear catalogo"}
        savingLabel={editingRecord ? "Guardando..." : "Creando..."}
        schema={catalogFormSchema}
        submitError={submitError}
        title={editingRecord ? "Editar catalogo" : "Nuevo catalogo"}
      />
    </>
  );
}
