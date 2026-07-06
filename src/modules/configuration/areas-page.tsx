"use client";

import { useMemo, useState } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { QUERY_KEYS } from "@/lib/constants";
import {
  areaFormSchema,
  type AreaFormValues,
} from "@/modules/configuration/forms";
import { configurationService } from "@/services/configuration-service";
import type { AreaMutationInput, AreaRecord } from "@/types";
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
} from "./shared";

type AreasPageProps = {
  canCreate: boolean;
  canDelete: boolean;
  canEdit: boolean;
};

const areaColumns: ColumnDef<AreaRecord>[] = [
  {
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="min-w-[18rem] space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-stone-950">{row.original.name}</p>
          {row.original.code ? (
            <span className="inline-flex items-center border border-stone-300 bg-stone-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-700">
              {row.original.code}
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-stone-600">
          {renderOptionalText(row.original.description)}
        </p>
      </div>
    ),
    header: "Area / gerencia",
  },
  {
    accessorKey: "managerUser",
    cell: ({ row }) =>
      row.original.managerUser ? (
        <div className="space-y-1">
          <p className="font-medium text-stone-900">{row.original.managerUser.name}</p>
          <p className="text-xs text-stone-500">{row.original.managerUser.email}</p>
        </div>
      ) : (
        <span className="text-stone-500">Sin responsable asignado</span>
      ),
    enableSorting: false,
    header: "Responsable",
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

const emptyFormValues: AreaFormValues = {
  active: true,
  code: "",
  description: "",
  managerUserId: "",
  name: "",
};

const mapRecordToFormValues = (record: AreaRecord | null): AreaFormValues => {
  if (!record) {
    return emptyFormValues;
  }

  return {
    active: record.active,
    code: record.code ?? "",
    description: record.description ?? "",
    managerUserId: record.managerUser?.id ?? "",
    name: record.name,
  };
};

const buildPayload = (values: AreaFormValues): AreaMutationInput => ({
  active: values.active,
  code: values.code.trim().length > 0 ? values.code.trim().toUpperCase() : null,
  description: values.description.trim().length > 0 ? values.description.trim() : null,
  managerUserId: values.managerUserId.trim().length > 0 ? values.managerUserId : null,
  name: values.name.trim(),
});

export function AreasPage({ canCreate, canDelete, canEdit }: AreasPageProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AreaRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const bootstrapQuery = useQuery({
    queryFn: configurationService.getBootstrap,
    queryKey: QUERY_KEYS.configurationBootstrap,
    staleTime: 60_000,
  });

  const currentValues = useMemo(
    () => mapRecordToFormValues(editingRecord),
    [editingRecord],
  );

  const tableConfig: DataTableConfig<AreaRecord> = {
    columns: areaColumns,
    defaultSort: {
      desc: false,
      id: "name",
    },
    emptyState: {
      description:
        "Cree una gerencia o active un area existente para asignar responsables dentro del seguimiento de observaciones.",
      title: "No hay areas registradas",
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
    queryKey: ["configuration", "areas", "table"],
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
          confirmLabel: "Eliminar area",
          description: (rows) =>
            `Eliminar ${rows[0]?.name ?? "esta area"} mediante borrado logico? Las observaciones historicas conservaran su traza.`,
          title: "Eliminar area?",
          tone: "danger",
        },
        hidden: !canDelete,
        icon: Trash2,
        id: "delete",
        label: "Eliminar",
        onClick: async (row) => {
          await configurationService.deleteArea(row.id);
          await queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.configurationBootstrap,
          });
        },
        tone: "danger",
        variant: "delete",
      },
    ],
    searchPlaceholder: "Buscar por nombre, codigo o descripcion",
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
                Nueva gerencia
              </button>
            ) : null
          }
          description="Defina las areas y gerencias dueñas de las observaciones para enrutar responsables, revisiones y aprobaciones dentro del circuito NIBOL."
          eyebrow="Configuracion NIBOL"
          title="Areas y gerencias"
        />

        <DataTable config={tableConfig} endpoint="/areas" />
      </main>

      <ConfigurationDialogForm
        defaultValues={currentValues}
        description="Actualice el nombre, codigo y responsable principal del area que interviene en el seguimiento de observaciones."
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
              await configurationService.updateArea(editingRecord.id, payload);
            } else {
              await configurationService.createArea(payload);
            }

            setSubmitError(null);
            setDialogOpen(false);
            setEditingRecord(null);

            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["configuration", "areas", "table"],
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
                  placeholder="Ej. Gerencia de Operaciones"
                  {...form.register("name")}
                />
                <FieldError error={form.formState.errors.name?.message} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Codigo</span>
                <input
                  className={`${inputClassName} uppercase`}
                  disabled={isBusy}
                  placeholder="OPER"
                  {...form.register("code")}
                />
                <FieldError error={form.formState.errors.code?.message} />
              </label>

              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Responsable principal</span>
                <select
                  className={inputClassName}
                  disabled={isBusy || bootstrapQuery.isLoading}
                  {...form.register("managerUserId")}
                >
                  <option value="">Sin responsable asignado</option>
                  {(bootstrapQuery.data?.users ?? []).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                {bootstrapQuery.isError ? (
                  <p className="text-xs text-amber-700">
                    No fue posible cargar usuarios ahora mismo. Puede guardar el area sin responsable y asignarlo luego.
                  </p>
                ) : null}
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Descripcion</span>
              <textarea
                className="nibol-field min-h-28 resize-y py-3"
                disabled={isBusy}
                placeholder="Describa el alcance operativo o gerencial de esta area."
                {...form.register("description")}
              />
              <FieldError error={form.formState.errors.description?.message} />
            </label>

            <ToggleCard
              description="Las areas inactivas dejan de mostrarse en formularios operativos y quedan fuera de nuevas asignaciones."
              disabled={isBusy}
              label="Area activa"
              registration={form.register("active")}
            />
          </>
        )}
        resetKey={editingRecord?.id ?? "create"}
        saveLabel={editingRecord ? "Guardar cambios" : "Crear area"}
        savingLabel={editingRecord ? "Guardando..." : "Creando..."}
        schema={areaFormSchema}
        submitError={submitError}
        title={editingRecord ? "Editar area" : "Nueva area"}
      />
    </>
  );
}
