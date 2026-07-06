"use client";

import { useEffect, useId, type ReactNode } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type UseFormRegisterReturn,
  type UseFormReturn,
} from "react-hook-form";
import type { ZodType } from "zod";

import { FormDialog } from "@/components/ui/form-dialog";
import type { ConfigurationCatalogType, SystemParameterValueType } from "@/types";
import { cn } from "@/utils";

export const CONFIGURATION_CATALOG_TYPE_LABELS: Record<ConfigurationCatalogType, string> = {
  categoria_hallazgo: "Categoria de hallazgo",
  fuente_hallazgo: "Fuente de hallazgo",
  proceso_auditado: "Proceso auditado",
  tipo_observacion: "Tipo de observacion",
};

export const CONFIGURATION_CATALOG_TYPE_OPTIONS = Object.entries(
  CONFIGURATION_CATALOG_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as ConfigurationCatalogType,
}));

export const SYSTEM_PARAMETER_VALUE_TYPE_LABELS: Record<SystemParameterValueType, string> = {
  boolean: "Booleano",
  date: "Fecha",
  json: "JSON",
  number: "Numero",
  string: "Texto",
};

export const SYSTEM_PARAMETER_VALUE_TYPE_OPTIONS = Object.entries(
  SYSTEM_PARAMETER_VALUE_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as SystemParameterValueType,
}));

export const ACTIVE_FILTER_OPTIONS = [
  {
    label: "Solo activos",
    value: "true",
  },
  {
    label: "Solo inactivos",
    value: "false",
  },
];

const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const inputClassName = "nibol-field h-auto py-3";

export const formatConfigurationDate = (value: string): string => {
  return dateTimeFormatter.format(new Date(value));
};

export const renderOptionalText = (
  value: string | null | undefined,
  fallback = "Sin dato registrado.",
): string => {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  return value;
};

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-stone-300 bg-stone-100 text-stone-600",
      )}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

export function ToneBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "danger" | "info" | "neutral" | "success" | "warning";
}) {
  const toneClassName =
    tone === "danger"
      ? "border-rose-300 bg-rose-50 text-rose-700"
      : tone === "info"
        ? "border-sky-300 bg-sky-50 text-sky-700"
        : tone === "success"
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : tone === "warning"
            ? "border-amber-300 bg-amber-50 text-amber-700"
            : "border-stone-300 bg-stone-100 text-stone-700";

  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        toneClassName,
      )}
    >
      {label}
    </span>
  );
}

export function FieldError({ error }: { error?: string }) {
  if (!error) {
    return null;
  }

  return <p className="text-sm text-rose-700">{error}</p>;
}

export function ToggleCard({
  description,
  disabled,
  label,
  registration,
}: {
  description: string;
  disabled: boolean;
  label: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <label className="flex items-start gap-3 rounded-[1.35rem] border border-stone-200/90 bg-white/80 px-4 py-4">
      <input
        className="mt-1 h-4 w-4 rounded border-stone-300 text-amber-700 focus:ring-amber-300"
        disabled={disabled}
        type="checkbox"
        {...registration}
      />
      <span className="space-y-1">
        <span className="block text-sm font-semibold text-stone-900">{label}</span>
        <span className="block text-xs leading-5 text-stone-500">{description}</span>
      </span>
    </label>
  );
}

type ConfigurationDialogFormProps<TFormValues extends FieldValues> = {
  defaultValues: DefaultValues<TFormValues>;
  description: string;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TFormValues) => Promise<void>;
  open: boolean;
  renderFields: (form: UseFormReturn<TFormValues>, isBusy: boolean) => ReactNode;
  resetKey: string;
  saveLabel: string;
  savingLabel: string;
  schema: ZodType<TFormValues>;
  submitError: string | null;
  title: string;
};

export function ConfigurationDialogForm<TFormValues extends FieldValues>({
  defaultValues,
  description,
  mode,
  onOpenChange,
  onSubmit,
  open,
  renderFields,
  resetKey,
  saveLabel,
  savingLabel,
  schema,
  submitError,
  title,
}: ConfigurationDialogFormProps<TFormValues>) {
  const formId = useId();
  const form = useForm<TFormValues>({
    defaultValues,
    resolver: zodResolver(schema as never) as Resolver<TFormValues>,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(defaultValues);
  }, [defaultValues, form, open, resetKey]);

  const isBusy = form.formState.isSubmitting;

  return (
    <FormDialog
      description={description}
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button
            className="nibol-btn-secondary px-4 py-2.5 text-sm"
            disabled={isBusy}
            onClick={() => {
              onOpenChange(false);
            }}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="nibol-btn-primary px-4 py-2.5 text-sm"
            disabled={isBusy}
            form={formId}
            type="submit"
          >
            <Save className="h-4 w-4" />
            {isBusy ? savingLabel : saveLabel}
          </button>
        </div>
      }
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      <form
        className="space-y-6"
        id={formId}
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        {renderFields(form, isBusy)}

        {submitError ? (
          <div className="rounded-[1.35rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        {mode === "create" ? (
          <p className="text-xs leading-5 text-stone-500">
            Los cambios quedaran auditados automaticamente al guardar el nuevo registro.
          </p>
        ) : null}
      </form>
    </FormDialog>
  );
}
