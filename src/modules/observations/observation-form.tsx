"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import {
  observationFormSchema,
  type ObservationFormValues,
} from "@/modules/observations/forms";
import { observationService } from "@/services/observation-service";
import type { ObservationDetail } from "@/types";
import { getApiErrorMessage } from "@/utils";

type ObservationFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      observationId: string;
    };

const sectionClassName = "nibol-panel p-6";

const toDateInputValue = (value: string): string => value.slice(0, 10);

const normalizeOptionalValue = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const addDaysToDateInputValue = (value: string, days: number): string => {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return "";
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
};

function AdditionalAreasSelector({
  areaId,
  disabled,
  error,
  selectedAreaIds,
  areas,
  onChange,
}: {
  areaId: string;
  disabled: boolean;
  error?: string;
  onChange: (nextValue: string[]) => void;
  selectedAreaIds: string[];
  areas: Array<{
    id: string;
    name: string;
  }>;
}) {
  const availableAreas = areas.filter((area) => area.id !== areaId);

  if (availableAreas.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-stone-700">Areas adicionales</p>
        <p className="text-xs leading-5 text-stone-500">
          Registre gerencias o areas de apoyo relacionadas con el hallazgo para futuras fases de seguimiento.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {availableAreas.map((area) => {
          const checked = selectedAreaIds.includes(area.id);

          return (
            <label
              key={area.id}
              className="flex items-start gap-3 rounded-[1.2rem] border border-stone-200/90 bg-white/80 px-4 py-4 transition hover:border-stone-300"
            >
              <input
                checked={checked}
                className="mt-1 h-4 w-4 rounded border-stone-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                disabled={disabled}
                onChange={(event) => {
                  const nextValues = event.target.checked
                    ? [...selectedAreaIds, area.id]
                    : selectedAreaIds.filter((value) => value !== area.id);

                  onChange(nextValues);
                }}
                type="checkbox"
              />
              <span className="text-sm font-medium text-stone-800">{area.name}</span>
            </label>
          );
        })}
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}

export function ObservationForm(props: ObservationFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [shouldSuggestDueDate, setShouldSuggestDueDate] = useState(props.mode === "create");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const editingObservationId = props.mode === "edit" ? props.observationId : null;

  const optionsQuery = useQuery({
    queryFn: observationService.getObservationOptions,
    queryKey: QUERY_KEYS.configurationBootstrap,
    staleTime: 60_000,
  });

  const observationQuery = useQuery({
    enabled: Boolean(editingObservationId),
    queryFn: () => observationService.getObservationById(editingObservationId as string),
    queryKey: editingObservationId
      ? QUERY_KEYS.observationDetails(editingObservationId)
      : ["observations", "draft"],
  });

  const initialValues = useMemo<ObservationFormValues>(
    () => ({
      additionalAreaIds: [],
      areaId: "",
      auditRecommendation: "",
      category: "",
      code: "",
      currentStage: "",
      description: "",
      detectedAt: "",
      dueDate: "",
      observationType: "",
      process: "",
      progressPercent: 0,
      responsibleUserId: "",
      riskLevelId: "",
      source: "",
      statusId: "",
      title: "",
    }),
    [],
  );

  const form = useForm<ObservationFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(observationFormSchema) as Resolver<ObservationFormValues>,
  });

  const watchedAreaId = useWatch({
    control: form.control,
    name: "areaId",
  });
  const watchedAdditionalAreaIds = useWatch({
    control: form.control,
    name: "additionalAreaIds",
  });
  const watchedDetectedAt = useWatch({
    control: form.control,
    name: "detectedAt",
  });
  const watchedDueDate = useWatch({
    control: form.control,
    name: "dueDate",
  });
  const watchedRiskLevelId = useWatch({
    control: form.control,
    name: "riskLevelId",
  });
  const watchedStatusId = useWatch({
    control: form.control,
    name: "statusId",
  });

  useEffect(() => {
    if (props.mode !== "edit" || !observationQuery.data) {
      return;
    }

    form.reset({
      additionalAreaIds: observationQuery.data.additionalAreas.map((item) => item.area.id),
      areaId: observationQuery.data.area.id,
      auditRecommendation: observationQuery.data.auditRecommendation,
      category: observationQuery.data.category ?? "",
      code: observationQuery.data.code,
      currentStage: observationQuery.data.currentStage ?? "",
      description: observationQuery.data.description,
      detectedAt: toDateInputValue(observationQuery.data.detectedAt),
      dueDate: toDateInputValue(observationQuery.data.dueDate),
      observationType: observationQuery.data.observationType ?? "",
      process: observationQuery.data.process ?? "",
      progressPercent: observationQuery.data.progressPercent,
      responsibleUserId: observationQuery.data.responsibleUser?.id ?? "",
      riskLevelId: observationQuery.data.riskLevel.id,
      source: observationQuery.data.source ?? "",
      statusId: observationQuery.data.status.id,
      title: observationQuery.data.title,
    });
    setShouldSuggestDueDate(false);
  }, [form, observationQuery.data, props.mode]);

  useEffect(() => {
    if (props.mode !== "create") {
      return;
    }

    const initialStatus = optionsQuery.data?.statuses.find((status) => status.isInitial);

    if (!initialStatus || watchedStatusId) {
      return;
    }

    form.setValue("statusId", initialStatus.id, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [form, optionsQuery.data, props.mode, watchedStatusId]);

  useEffect(() => {
    if (!shouldSuggestDueDate || !watchedDetectedAt || !watchedRiskLevelId) {
      return;
    }

    const riskLevel = optionsQuery.data?.riskLevels.find(
      (item) => item.id === watchedRiskLevelId,
    );

    if (!riskLevel?.defaultDeadlineDays) {
      return;
    }

    const suggestedDueDate = addDaysToDateInputValue(
      watchedDetectedAt,
      riskLevel.defaultDeadlineDays,
    );

    if (!suggestedDueDate || watchedDueDate === suggestedDueDate) {
      return;
    }

    form.setValue("dueDate", suggestedDueDate, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [
    form,
    optionsQuery.data,
    shouldSuggestDueDate,
    watchedDetectedAt,
    watchedDueDate,
    watchedRiskLevelId,
  ]);

  const saveMutation = useMutation({
    mutationFn: async (values: ObservationFormValues) => {
      const payload = {
        additionalAreaIds: values.additionalAreaIds,
        areaId: values.areaId,
        auditRecommendation: values.auditRecommendation.trim(),
        category: normalizeOptionalValue(values.category ?? null),
        code: values.code.trim().toUpperCase(),
        currentStage: normalizeOptionalValue(values.currentStage ?? null),
        description: values.description.trim(),
        detectedAt: values.detectedAt,
        dueDate: values.dueDate,
        observationType: normalizeOptionalValue(values.observationType ?? null),
        process: normalizeOptionalValue(values.process ?? null),
        progressPercent: values.progressPercent,
        responsibleUserId: values.responsibleUserId || null,
        riskLevelId: values.riskLevelId,
        source: normalizeOptionalValue(values.source ?? null),
        statusId: values.statusId,
        title: values.title.trim(),
      };

      if (props.mode === "create") {
        return observationService.createObservation(payload);
      }

      return observationService.updateObservation(props.observationId, payload);
    },
    onSuccess: async (observation: ObservationDetail) => {
      setSubmitError(null);
      setSubmitMessage(
        props.mode === "create"
          ? "Observacion registrada correctamente."
          : "Observacion actualizada correctamente.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.observations,
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.configurationBootstrap,
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.observationDetails(observation.id),
        }),
      ]);

      router.push(`/observaciones/${observation.id}`);
      router.refresh();
    },
    onError: (error) => {
      setSubmitMessage(null);
      setSubmitError(getApiErrorMessage(error));
    },
  });

  if (optionsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void optionsQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={optionsQuery.error.message}
        title="No fue posible cargar los catalogos de observaciones"
      />
    );
  }

  if (props.mode === "edit" && observationQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void observationQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={observationQuery.error.message}
        title="No fue posible cargar la observacion"
      />
    );
  }

  const isBusy = saveMutation.isPending || optionsQuery.isLoading || observationQuery.isLoading;
  const options = optionsQuery.data;
  const selectedRiskLevel = options?.riskLevels.find(
    (riskLevel) => riskLevel.id === watchedRiskLevelId,
  );

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await saveMutation.mutateAsync(values);
      })}
    >
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              {props.mode === "create" ? "Nueva observacion" : "Edicion de observacion"}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {props.mode === "create"
                ? "Registrar hallazgo de auditoria"
                : `Actualizar ${observationQuery.data?.code ?? "observacion"}`}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              El auditor responsable se asigna desde la sesion actual y el resto del flujo queda listo para las siguientes fases de remediacion y evidencia.
            </p>
          </div>

          <Link
            className="nibol-btn-secondary px-4 py-2.5 text-sm"
            href={
              props.mode === "create"
                ? "/observaciones"
                : `/observaciones/${props.observationId}`
            }
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </section>

      <section className={`${sectionClassName} grid gap-6 xl:grid-cols-[1.25fr_0.75fr]`}>
        <div className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Codigo</span>
            <input
              className="nibol-field h-auto py-3 uppercase"
              disabled={isBusy}
              placeholder="OBS-2026-001"
              {...form.register("code")}
            />
            {form.formState.errors.code ? (
              <span className="text-sm text-rose-700">
                {form.formState.errors.code.message}
              </span>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Titulo</span>
            <input
              className="nibol-field h-auto py-3"
              disabled={isBusy}
              placeholder="Resuma el hallazgo principal"
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <span className="text-sm text-rose-700">
                {form.formState.errors.title.message}
              </span>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Descripcion</span>
            <textarea
              className="nibol-field min-h-36 resize-y py-3"
              disabled={isBusy}
              placeholder="Detalle la situacion observada, el contexto y el impacto esperado."
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <span className="text-sm text-rose-700">
                {form.formState.errors.description.message}
              </span>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Recomendacion de auditoria</span>
            <textarea
              className="nibol-field min-h-32 resize-y py-3"
              disabled={isBusy}
              placeholder="Defina la accion correctiva o preventiva recomendada."
              {...form.register("auditRecommendation")}
            />
            {form.formState.errors.auditRecommendation ? (
              <span className="text-sm text-rose-700">
                {form.formState.errors.auditRecommendation.message}
              </span>
            ) : null}
          </label>
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.3rem] border border-stone-200/90 bg-[var(--surface-soft)] px-4 py-4 text-sm text-stone-600">
            <div className="flex items-start gap-3">
              <div className="rounded-[0.9rem] bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-stone-900">Auditor responsable</p>
                <p>
                  Se asigna automaticamente con el usuario autenticado para mantener la trazabilidad del registro.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Nivel de riesgo</span>
              <select
                className="nibol-field h-auto py-3"
                disabled={isBusy}
                {...form.register("riskLevelId")}
              >
                <option value="">Seleccione</option>
                {options?.riskLevels.map((riskLevel) => (
                  <option key={riskLevel.id} value={riskLevel.id}>
                    {riskLevel.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.riskLevelId ? (
                <span className="text-sm text-rose-700">
                  {form.formState.errors.riskLevelId.message}
                </span>
              ) : null}
              {selectedRiskLevel?.defaultDeadlineDays ? (
                <span className="text-xs text-stone-500">
                  Sugiere un vencimiento a {selectedRiskLevel.defaultDeadlineDays} dias si la fecha limite esta vacia.
                </span>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Estado</span>
              <select
                className="nibol-field h-auto py-3"
                disabled={isBusy}
                {...form.register("statusId")}
              >
                <option value="">Seleccione</option>
                {options?.statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.statusId ? (
                <span className="text-sm text-rose-700">
                  {form.formState.errors.statusId.message}
                </span>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Area principal</span>
              <select
                className="nibol-field h-auto py-3"
                disabled={isBusy}
                {...form.register("areaId", {
                  onChange: (event) => {
                    const nextAreaId = String(event.target.value);
                    const nextAdditionalAreas = (watchedAdditionalAreaIds ?? []).filter(
                      (value) => value !== nextAreaId,
                    );

                    form.setValue("additionalAreaIds", nextAdditionalAreas, {
                      shouldDirty: true,
                    });
                  },
                })}
              >
                <option value="">Seleccione</option>
                {options?.areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.areaId ? (
                <span className="text-sm text-rose-700">
                  {form.formState.errors.areaId.message}
                </span>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Responsable</span>
              <select
                className="nibol-field h-auto py-3"
                disabled={isBusy}
                {...form.register("responsibleUserId")}
              >
                <option value="">Sin asignar</option>
                {options?.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Fecha de deteccion</span>
              <input
                className="nibol-field h-auto py-3"
                disabled={isBusy}
                type="date"
                {...form.register("detectedAt")}
              />
              {form.formState.errors.detectedAt ? (
                <span className="text-sm text-rose-700">
                  {form.formState.errors.detectedAt.message}
                </span>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Fecha limite</span>
              <input
                className="nibol-field h-auto py-3"
                disabled={isBusy}
                type="date"
                {...form.register("dueDate", {
                  onChange: (event) => {
                    const nextValue = String(event.target.value);
                    setShouldSuggestDueDate(nextValue.length === 0);
                  },
                })}
              />
              {form.formState.errors.dueDate ? (
                <span className="text-sm text-rose-700">
                  {form.formState.errors.dueDate.message}
                </span>
              ) : null}
              <span className="text-xs text-stone-500">
                Puede modificar manualmente la fecha sugerida en cualquier momento.
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">% Avance</span>
              <input
                className="nibol-field h-auto py-3"
                disabled={isBusy}
                max={100}
                min={0}
                type="number"
                {...form.register("progressPercent", {
                  valueAsNumber: true,
                })}
              />
              {form.formState.errors.progressPercent ? (
                <span className="text-sm text-rose-700">
                  {form.formState.errors.progressPercent.message}
                </span>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Etapa actual</span>
              <input
                className="nibol-field h-auto py-3"
                disabled={isBusy}
                placeholder="Ej. Validacion de plan"
                {...form.register("currentStage")}
              />
            </label>
          </div>

          <AdditionalAreasSelector
            areaId={watchedAreaId ?? ""}
            areas={(options?.areas ?? []).map((area) => ({
              id: area.id,
              name: area.name,
            }))}
            disabled={isBusy}
            error={form.formState.errors.additionalAreaIds?.message}
            onChange={(nextValue) => {
              form.setValue("additionalAreaIds", nextValue, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            selectedAreaIds={watchedAdditionalAreaIds ?? []}
          />
        </div>
      </section>

      <section className={`${sectionClassName} grid gap-5 md:grid-cols-2 xl:grid-cols-4`}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">Tipo de observacion</span>
          <select
            className="nibol-field h-auto py-3"
            disabled={isBusy}
            {...form.register("observationType")}
          >
            <option value="">Seleccione</option>
            {(options?.catalogs.tipo_observacion ?? []).map((catalog) => (
              <option key={catalog.id} value={catalog.name}>
                {catalog.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">Fuente</span>
          <select
            className="nibol-field h-auto py-3"
            disabled={isBusy}
            {...form.register("source")}
          >
            <option value="">Seleccione</option>
            {(options?.catalogs.fuente_hallazgo ?? []).map((catalog) => (
              <option key={catalog.id} value={catalog.name}>
                {catalog.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">Proceso</span>
          <select
            className="nibol-field h-auto py-3"
            disabled={isBusy}
            {...form.register("process")}
          >
            <option value="">Seleccione</option>
            {(options?.catalogs.proceso_auditado ?? []).map((catalog) => (
              <option key={catalog.id} value={catalog.name}>
                {catalog.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">Categoria</span>
          <select
            className="nibol-field h-auto py-3"
            disabled={isBusy}
            {...form.register("category")}
          >
            <option value="">Seleccione</option>
            {(options?.catalogs.categoria_hallazgo ?? []).map((catalog) => (
              <option key={catalog.id} value={catalog.name}>
                {catalog.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {submitError ? (
        <div className="rounded-[1.3rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      {submitMessage ? (
        <div className="rounded-[1.3rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {submitMessage}
        </div>
      ) : null}

      <section className={`${sectionClassName} flex flex-wrap justify-end gap-3`}>
        <Link
          className="nibol-btn-secondary px-4 py-2.5 text-sm"
          href={
            props.mode === "create"
              ? "/observaciones"
              : `/observaciones/${props.observationId}`
          }
        >
          <ArrowLeft className="h-4 w-4" />
          Cancelar
        </Link>
        <button
          className="nibol-btn-primary px-4 py-2.5 text-sm"
          disabled={isBusy}
          type="submit"
        >
          <Save className="h-4 w-4" />
          {props.mode === "create" ? "Guardar observacion" : "Guardar cambios"}
        </button>
      </section>
    </form>
  );
}
