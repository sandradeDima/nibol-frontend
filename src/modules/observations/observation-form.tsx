"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { FilePicker } from "@/components/ui/file-picker";
import { RiskSearchMultiSelect } from "@/components/ui/risk-search-multi-select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { UserSearchSelect } from "@/components/ui/user-search-select";
import { QUERY_KEYS } from "@/lib/constants";
import {
  observationFormSchema,
  type ObservationFormValues,
} from "@/modules/observations/forms";
import { observationService } from "@/services/observation-service";
import { progressService } from "@/services/progress-service";
import { getApiErrorMessage } from "@/utils";

import { formatObservationDate } from "./presentation";

type ObservationFormProps =
  | { mode: "create" }
  | { mode: "edit"; observationId: string };

const emptyValues: ObservationFormValues = {
  areaAssignments: [
    { areaId: "", areaResponsibleUserId: "", processOwnerUserId: "" },
  ],
  auditRecommendation: "",
  auditReportId: "",
  auditorUserId: "",
  category: null,
  commitmentDate: "",
  currentStage: null,
  description: "",
  mainObservationId: "",
  process: null,
  riskIds: [],
  riskLevelId: "",
  source: null,
  title: "",
};

const fieldClass = "nibol-field";
const textareaClass = "nibol-field min-h-28 resize-y py-3 leading-6";

function Field({
  error,
  label,
  children,
  hint,
}: {
  children: React.ReactNode;
  error?: string;
  hint?: string;
  label: string;
}) {
  return (
    <label className="space-y-2 text-sm font-semibold text-stone-800">
      <span>{label}</span>
      {children}
      {hint && !error ? (
        <span className="block text-xs leading-5 font-normal text-stone-500">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="block text-xs font-medium text-rose-700">{error}</span>
      ) : null}
    </label>
  );
}

type ActionPlanDraft = {
  description: string;
  dueDate: string;
  id: string;
  responsibleUserId: string;
};

const updatePlanDraft = (
  setter: React.Dispatch<
    React.SetStateAction<Record<string, ActionPlanDraft[]>>
  >,
  areaKey: string,
  planId: string,
  property: Exclude<keyof ActionPlanDraft, "id">,
  value: string,
) =>
  setter((current) => ({
    ...current,
    [areaKey]: (current[areaKey] ?? []).map((plan) =>
      plan.id === planId ? { ...plan, [property]: value } : plan,
    ),
  }));

const calculatedDeadline = (
  reportDate: string | undefined,
  days: number | null | undefined,
) => {
  if (!reportDate || !days) return null;
  const date = new Date(`${reportDate.slice(0, 10)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

function AreaEvidencePicker({
  files,
  inputKey,
  onFilesChange,
  onInputReset,
  onLimitExceeded,
  onRemove,
}: {
  files: File[];
  inputKey: number;
  onFilesChange: (files: File[]) => void;
  onInputReset: () => void;
  onLimitExceeded: () => void;
  onRemove: (file: File) => void;
}) {
  return (
    <div className="mt-5 border-t border-stone-200 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-900">
            Documentos de respaldo y evidencias
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Los archivos quedan asociados a la observación; el área solo se
            conserva como referencia.
          </p>
        </div>
        <FilePicker
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          files={files}
          id={`area-evidence-${inputKey}`}
          onChange={(selected) => {
            const next = [...files, ...selected].filter(
              (file, index, allFiles) =>
                allFiles.findIndex(
                  (candidate) =>
                    candidate.name === file.name &&
                    candidate.size === file.size &&
                    candidate.lastModified === file.lastModified,
                ) === index,
            );
            if (next.length > 10) onLimitExceeded();
            onFilesChange(next.slice(0, 10));
            onInputReset();
          }}
          onRemove={onRemove}
        />
      </div>
      {!files.length ? (
        <p className="mt-4 rounded-xl border border-dashed border-stone-300 px-4 py-3 text-xs text-stone-500">
          Todavía no hay documentos para esta área.
        </p>
      ) : null}
    </div>
  );
}

export function ObservationForm(props: ObservationFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [supportFilesByArea, setSupportFilesByArea] = useState<
    Record<string, File[]>
  >({});
  const [supportFileInputKeys, setSupportFileInputKeys] = useState<
    Record<string, number>
  >({});
  const [plansByArea, setPlansByArea] = useState<
    Record<string, ActionPlanDraft[]>
  >({});
  const observationId = props.mode === "edit" ? props.observationId : null;
  const optionsQuery = useQuery({
    queryFn: observationService.getObservationOptions,
    queryKey: QUERY_KEYS.observationOptions,
  });
  const observationQuery = useQuery({
    enabled: Boolean(observationId),
    queryFn: () => observationService.getObservationById(observationId!),
    queryKey: observationId
      ? QUERY_KEYS.observationDetails(observationId)
      : ["observations", "new"],
  });
  const form = useForm<ObservationFormValues>({
    defaultValues: emptyValues,
    resolver: zodResolver(
      observationFormSchema,
    ) as Resolver<ObservationFormValues>,
  });
  const areas = useFieldArray({
    control: form.control,
    name: "areaAssignments",
  });
  const reportId = useWatch({ control: form.control, name: "auditReportId" });
  const mainObservationId = useWatch({
    control: form.control,
    name: "mainObservationId",
  });
  const riskLevelId = useWatch({ control: form.control, name: "riskLevelId" });
  const watchedRiskIds = useWatch({ control: form.control, name: "riskIds" });
  const watchedAreas = useWatch({
    control: form.control,
    name: "areaAssignments",
  });

  useEffect(() => {
    const item = observationQuery.data;
    if (!item || props.mode !== "edit") return;
    form.reset({
      areaAssignments: item.areas.map((row) => ({
        areaId: row.area.id,
        areaResponsibleUserId: row.areaResponsible.id,
        processOwnerUserId: row.processOwner.id,
      })),
      auditRecommendation: item.auditRecommendation,
      auditReportId: item.auditReport.id,
      auditorUserId: item.auditorUser?.id ?? "",
      category: item.category,
      commitmentDate: item.currentDueDate.slice(0, 10),
      currentStage: item.currentStage,
      description: item.description,
      mainObservationId: item.mainObservation.id,
      process: item.process,
      riskIds: item.risks.map((risk) => risk.id),
      riskLevelId: item.riskLevel.id,
      source: item.source,
      title: item.title,
    });
  }, [form, observationQuery.data, props.mode]);

  const selectedReport = optionsQuery.data?.auditReports.find(
    (item) => item.id === reportId,
  );
  const selectedLevel = optionsQuery.data?.riskLevels.find(
    (item) => item.id === riskLevelId,
  );
  const dueDate = calculatedDeadline(
    selectedReport?.reportDate,
    selectedLevel?.maxRemediationDays,
  );
  const minimumDate = selectedReport?.reportDate.slice(0, 10);
  const commitmentDate = useWatch({
    control: form.control,
    name: "commitmentDate",
  });

  useEffect(() => {
    if (
      optionsQuery.isLoading ||
      !commitmentDate ||
      !selectedReport ||
      !selectedLevel ||
      !dueDate ||
      !minimumDate
    )
      return;
    if (commitmentDate > dueDate || commitmentDate < minimumDate) {
      form.setValue("commitmentDate", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [
    commitmentDate,
    dueDate,
    form,
    minimumDate,
    optionsQuery.isLoading,
    reportId,
    riskLevelId,
    selectedLevel,
    selectedReport,
  ]);
  const mutation = useMutation({
    mutationFn: async (values: ObservationFormValues) => {
      const observation =
        props.mode === "create"
          ? observationService.createObservation({
              ...values,
              actionPlans: areas.fields.flatMap((areaField, index) =>
                (plansByArea[areaField.id] ?? []).map((plan) => ({
                  areaId: watchedAreas[index]?.areaId ?? "",
                  description: plan.description,
                  dueDate: plan.dueDate,
                  responsibleUserId: plan.responsibleUserId,
                })),
              ),
            })
          : observationService.updateObservation(props.observationId, values);
      const savedObservation = await observation;
      try {
        await Promise.all(
          areas.fields.flatMap((areaField, index) => {
            const files = supportFilesByArea[areaField.id] ?? [];
            if (files.length === 0) return [];
            const areaId = values.areaAssignments[index]?.areaId;
            const observationArea = savedObservation.areas.find(
              (area) => area.area.id === areaId,
            );
            if (!observationArea)
              throw new Error(
                "No fue posible asociar los documentos con el área seleccionada.",
              );
            return [
              progressService.uploadObservationEvidence(
                savedObservation.id,
                files,
                "Documentos soporte registrados para el área.",
                observationArea.id,
              ),
            ];
          }),
        );
      } catch (error) {
        return {
          observation: savedObservation,
          uploadError: getApiErrorMessage(error),
        };
      }
      return { observation: savedObservation, uploadError: null };
    },
    onError: (error) => setSubmitError(getApiErrorMessage(error)),
    onSuccess: async ({ observation, uploadError }) => {
      if (props.mode === "create")
        toast.success("Observación creada exitosamente.");
      if (uploadError)
        toast.warning(
          `La observación fue guardada, pero no se pudieron cargar los documentos: ${uploadError}`,
        );
      setSupportFilesByArea({});
      setSupportFileInputKeys({});
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.observations,
      });
      router.push(`/observaciones/${observation.id}`);
    },
  });

  const unavailable =
    optionsQuery.isLoading ||
    (props.mode === "edit" && observationQuery.isLoading);
  if (optionsQuery.isError || observationQuery.isError) {
    return (
      <ErrorState
        description={getApiErrorMessage(
          optionsQuery.error ?? observationQuery.error,
        )}
        title="No fue posible preparar el formulario"
      />
    );
  }

  return (
    <>
      {mutation.isPending ? (
        <div
          aria-label="Guardando observación"
          aria-live="polite"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/35 p-4"
          role="status"
        >
          <div className="rounded-xl bg-white px-5 py-4 text-sm font-semibold text-stone-900 shadow-xl">
            Guardando observación…
          </div>
        </div>
      ) : null}
      <form
        className="space-y-6"
        aria-busy={mutation.isPending}
        onSubmit={form.handleSubmit(
          (values) => {
            if (mutation.isPending) return;
            setSubmitError(null);
            const incompletePlan = Object.values(plansByArea)
              .flat()
              .some(
                (plan) =>
                  !plan.description.trim() ||
                  !plan.dueDate ||
                  !plan.responsibleUserId,
              );
            if (incompletePlan) {
              setSubmitError(
                "Complete ejecutor, descripción y fecha límite de cada plan de acción agregado.",
              );
              return;
            }
            if (!values.commitmentDate) {
              setSubmitError("Seleccione una fecha de compromiso.");
              return;
            }
            if (
              dueDate &&
              minimumDate &&
              (values.commitmentDate > dueDate ||
                values.commitmentDate < minimumDate)
            ) {
              setSubmitError(
                `La fecha de compromiso no puede superar el plazo máximo de ${selectedLevel?.maxRemediationDays ?? "configurado"} días.`,
              );
              return;
            }
            mutation.mutate(values);
          },
          () => {
            setSubmitError(
              "Revise los campos marcados antes de crear la observación.",
            );
          },
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className="nibol-btn-secondary px-4 py-2.5 text-sm"
            href={
              observationId
                ? `/observaciones/${observationId}`
                : "/observaciones"
            }
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <button
            className="nibol-btn-primary px-5 py-2.5 text-sm"
            disabled={unavailable || mutation.isPending}
            type="submit"
          >
            <Save className="h-4 w-4" />
            {mutation.isPending
              ? "Guardando…"
              : props.mode === "create"
                ? "Crear observación"
                : "Guardar cambios"}
          </button>
        </div>

        {submitError ? (
          <div
            aria-live="polite"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800"
            role="alert"
          >
            {submitError}
          </div>
        ) : null}

        <section className="nibol-panel relative z-30 overflow-visible">
          <div className="border-b border-stone-200 bg-stone-50 px-6 py-5">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-amber-700" />
              <div>
                <h2 className="text-lg font-semibold text-stone-950">
                  Información del informe
                </h2>
                <p className="text-sm text-stone-500">
                  El informe agrupa observaciones y determina la fecha base del
                  plazo.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-5 p-6 lg:grid-cols-[1fr_1.5fr]">
            <Field
              error={form.formState.errors.auditReportId?.message}
              label="Informe de Auditoría"
            >
              <SearchableSelect
                disabled={unavailable || props.mode === "edit"}
                onChange={(value) =>
                  form.setValue("auditReportId", value, {
                    shouldValidate: true,
                  })
                }
                options={(optionsQuery.data?.auditReports ?? []).map(
                  (report) => ({
                    id: report.id,
                    label: `${report.reportNumber} · ${report.title}`,
                    search: report.reportNumber,
                  }),
                )}
                placeholder="Buscar informe por número o título"
                value={reportId}
              />
            </Field>
            {selectedReport ? (
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm">
                <div>
                  <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                    Título
                  </p>
                  <p className="mt-1 font-medium text-stone-900">
                    {selectedReport.title}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                    Fecha del informe
                  </p>
                  <p className="mt-1 font-medium text-stone-900">
                    {formatObservationDate(selectedReport.reportDate)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                Cree los informes una sola vez desde{" "}
                <Link
                  className="font-semibold text-amber-800 underline underline-offset-2"
                  href="/administracion/informes-auditoria"
                >
                  Informes de Auditoría
                </Link>{" "}
                y selecciónelos aquí.
              </div>
            )}
          </div>
        </section>

        <section className="nibol-panel p-6">
          <div className="mb-6 flex items-center gap-3">
            <FileText className="h-5 w-5 text-amber-700" />
            <div>
              <h2 className="text-lg font-semibold text-stone-950">
                Información de la observación
              </h2>
              <p className="text-sm text-stone-500">
                Identificación y contenido del hallazgo.
              </p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              error={form.formState.errors.mainObservationId?.message}
              label="Observación principal"
            >
              <SearchableSelect
                onChange={(value) =>
                  form.setValue("mainObservationId", value, {
                    shouldValidate: true,
                  })
                }
                options={(optionsQuery.data?.mainObservations ?? []).map(
                  (item) => ({
                    description: item.description,
                    id: item.id,
                    label: item.name,
                  }),
                )}
                placeholder="Buscar observación principal"
                value={mainObservationId}
              />
            </Field>
            <div className="md:col-span-2">
              <Field
                error={form.formState.errors.title?.message}
                label="Título"
              >
                <input
                  className={fieldClass}
                  placeholder="Resumen claro y específico"
                  {...form.register("title")}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field
                error={form.formState.errors.description?.message}
                label="Observación detallada"
              >
                <textarea
                  className={textareaClass}
                  {...form.register("description")}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field
                error={form.formState.errors.auditRecommendation?.message}
                label="Recomendación / plan recomendado"
              >
                <textarea
                  className={textareaClass}
                  {...form.register("auditRecommendation")}
                />
              </Field>
            </div>
            <Field
              error={form.formState.errors.auditorUserId?.message}
              label="Auditor responsable"
            >
              <select
                className={fieldClass}
                {...form.register("auditorUserId")}
              >
                <option value="">Sin auditor responsable</option>
                {optionsQuery.data?.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} · {user.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Proceso">
              <input className={fieldClass} {...form.register("process")} />
            </Field>
            <Field label="Fuente">
              <input className={fieldClass} {...form.register("source")} />
            </Field>
            <Field label="Categoría">
              <input className={fieldClass} {...form.register("category")} />
            </Field>
          </div>
        </section>

        <section className="nibol-panel p-6">
          <div className="mb-6 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-700" />
            <div>
              <h2 className="text-lg font-semibold text-stone-950">
                Riesgos y plazo
              </h2>
              <p className="text-sm text-stone-500">
                Los riesgos asociados son independientes del nivel que calcula
                el plazo.
              </p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Field
              error={form.formState.errors.riskIds?.message}
              label="Riesgos asociados"
            >
              <RiskSearchMultiSelect
                onChange={(riskIds) =>
                  form.setValue("riskIds", riskIds, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                risks={optionsQuery.data?.risks ?? []}
                value={watchedRiskIds}
              />
            </Field>
            <div className="space-y-4">
              <Field
                error={form.formState.errors.riskLevelId?.message}
                label="Nivel de riesgo"
              >
                <select
                  className={fieldClass}
                  {...form.register("riskLevelId")}
                >
                  <option value="">Seleccione el nivel</option>
                  {optionsQuery.data?.riskLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                error={form.formState.errors.commitmentDate?.message}
                hint={
                  selectedReport && selectedLevel
                    ? "Puede elegir cualquier fecha hasta el máximo permitido."
                    : "Seleccione el informe y el nivel de riesgo para habilitar el calendario."
                }
                label="Fecha de compromiso"
              >
                <input
                  className={fieldClass}
                  disabled={
                    unavailable ||
                    mutation.isPending ||
                    !selectedReport ||
                    !selectedLevel
                  }
                  max={dueDate ?? undefined}
                  min={minimumDate}
                  type="date"
                  {...form.register("commitmentDate")}
                />
              </Field>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <CalendarDays className="h-4 w-4" />
                  Fecha límite calculada
                </div>
                <p className="mt-2 text-2xl font-semibold text-stone-950">
                  {dueDate ? formatObservationDate(dueDate) : "—"}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {selectedLevel?.name ?? "Nivel pendiente"} ·{" "}
                  {selectedLevel?.maxRemediationDays ?? "—"} días desde la fecha
                  del informe. El backend realiza el cálculo definitivo.
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-amber-200 pt-4 text-xs text-stone-600">
                  <div>
                    <dt>Fecha del informe</dt>
                    <dd className="font-semibold text-stone-900">
                      {selectedReport
                        ? formatObservationDate(selectedReport.reportDate)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Fecha máxima permitida</dt>
                    <dd className="font-semibold text-stone-900">
                      {dueDate ? formatObservationDate(dueDate) : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="nibol-panel p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-amber-700" />
              <div>
                <h2 className="text-lg font-semibold text-stone-950">
                  Áreas involucradas
                </h2>
                <p className="text-sm text-stone-500">
                  Asigne quién es dueño del proceso y quién ejecuta por cada
                  área.
                </p>
              </div>
            </div>
            <button
              className="nibol-btn-secondary px-4 py-2 text-sm"
              onClick={() =>
                areas.append({
                  areaId: "",
                  areaResponsibleUserId: "",
                  processOwnerUserId: "",
                })
              }
              type="button"
            >
              <Plus className="h-4 w-4" />
              Agregar área
            </button>
          </div>
          <div className="space-y-4">
            {areas.fields.map((field, index) => (
              <article
                className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
                key={field.id}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-stone-900">
                    <Users className="h-4 w-4 text-amber-700" />
                    Área {index + 1}
                  </div>
                  {areas.fields.length > 1 ? (
                    <button
                      aria-label={`Quitar área ${index + 1}`}
                      className="rounded-lg p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => {
                        areas.remove(index);
                        setPlansByArea((current) => {
                          const next = { ...current };
                          delete next[field.id];
                          return next;
                        });
                        setSupportFilesByArea((current) => {
                          const next = { ...current };
                          delete next[field.id];
                          return next;
                        });
                        setSupportFileInputKeys((current) => {
                          const next = { ...current };
                          delete next[field.id];
                          return next;
                        });
                      }}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <Field
                    error={
                      form.formState.errors.areaAssignments?.[index]?.areaId
                        ?.message
                    }
                    label="Área"
                  >
                    <select
                      className={fieldClass}
                      {...form.register(`areaAssignments.${index}.areaId`)}
                      onChange={(event) => {
                        const previousAreaId = watchedAreas[index]?.areaId;
                        if (
                          previousAreaId &&
                          previousAreaId !== event.target.value &&
                          (supportFilesByArea[field.id]?.length ?? 0) > 0
                        ) {
                          setSupportFilesByArea((current) => ({
                            ...current,
                            [field.id]: [],
                          }));
                          setSupportFileInputKeys((current) => ({
                            ...current,
                            [field.id]: (current[field.id] ?? 0) + 1,
                          }));
                          setSubmitError(
                            "Se quitaron los documentos porque cambió el área seleccionada.",
                          );
                        }
                        form.setValue(
                          `areaAssignments.${index}.areaId`,
                          event.target.value,
                          { shouldDirty: true, shouldValidate: true },
                        );
                      }}
                    >
                      <option value="">Seleccione</option>
                      {optionsQuery.data?.areas
                        .filter(
                          (area) =>
                            !watchedAreas.some(
                              (row, rowIndex) =>
                                rowIndex !== index && row.areaId === area.id,
                            ),
                        )
                        .map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field
                    error={
                      form.formState.errors.areaAssignments?.[index]
                        ?.processOwnerUserId?.message
                    }
                    label="Dueño del proceso"
                  >
                    <UserSearchSelect
                      onChange={(userId) =>
                        form.setValue(
                          `areaAssignments.${index}.processOwnerUserId`,
                          userId,
                          { shouldDirty: true, shouldValidate: true },
                        )
                      }
                      users={optionsQuery.data?.users ?? []}
                      value={watchedAreas[index]?.processOwnerUserId ?? ""}
                    />
                  </Field>
                  <Field
                    error={
                      form.formState.errors.areaAssignments?.[index]
                        ?.areaResponsibleUserId?.message
                    }
                    label="Responsable del área"
                  >
                    <UserSearchSelect
                      onChange={(userId) =>
                        form.setValue(
                          `areaAssignments.${index}.areaResponsibleUserId`,
                          userId,
                          { shouldDirty: true, shouldValidate: true },
                        )
                      }
                      users={optionsQuery.data?.users ?? []}
                      value={watchedAreas[index]?.areaResponsibleUserId ?? ""}
                    />
                  </Field>
                </div>
                {props.mode === "create" ? (
                  <div className="mt-5 border-t border-stone-200 pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-stone-900">
                          Planes de acción opcionales
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          Puede crear ninguno, uno o varios para esta área.
                        </p>
                      </div>
                      <button
                        className="nibol-btn-secondary px-3 py-2 text-xs"
                        onClick={() =>
                          setPlansByArea((current) => ({
                            ...current,
                            [field.id]: [
                              ...(current[field.id] ?? []),
                              {
                                description: "",
                                dueDate: dueDate ?? "",
                                id: crypto.randomUUID(),
                                responsibleUserId:
                                  watchedAreas[index]?.areaResponsibleUserId ??
                                  "",
                              },
                            ],
                          }))
                        }
                        type="button"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Agregar plan de acción
                      </button>
                    </div>
                    <div className="mt-4 space-y-4">
                      {(plansByArea[field.id] ?? []).map((plan, planIndex) => (
                        <div
                          className="rounded-xl border border-amber-200 bg-white p-4"
                          key={plan.id}
                        >
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-stone-900">
                              Plan {planIndex + 1}
                            </p>
                            <button
                              aria-label={`Quitar plan ${planIndex + 1}`}
                              className="rounded-lg p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() =>
                                setPlansByArea((current) => ({
                                  ...current,
                                  [field.id]:
                                    current[field.id]?.filter(
                                      (item) => item.id !== plan.id,
                                    ) ?? [],
                                }))
                              }
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Ejecutor">
                              <UserSearchSelect
                                onChange={(userId) =>
                                  updatePlanDraft(
                                    setPlansByArea,
                                    field.id,
                                    plan.id,
                                    "responsibleUserId",
                                    userId,
                                  )
                                }
                                users={optionsQuery.data?.users ?? []}
                                value={plan.responsibleUserId}
                              />
                              {!plan.responsibleUserId ? (
                                <span className="block text-xs font-normal text-stone-500">
                                  Seleccione por nombre o correo.
                                </span>
                              ) : null}
                            </Field>
                            <div className="md:col-span-2">
                              <Field label="Descripción">
                                <textarea
                                  className={textareaClass}
                                  onChange={(event) =>
                                    updatePlanDraft(
                                      setPlansByArea,
                                      field.id,
                                      plan.id,
                                      "description",
                                      event.target.value,
                                    )
                                  }
                                  required
                                  value={plan.description}
                                />
                              </Field>
                            </div>
                            <Field label="Fecha límite">
                              <input
                                className={fieldClass}
                                onChange={(event) =>
                                  updatePlanDraft(
                                    setPlansByArea,
                                    field.id,
                                    plan.id,
                                    "dueDate",
                                    event.target.value,
                                  )
                                }
                                required
                                type="date"
                                value={plan.dueDate}
                              />
                            </Field>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <AreaEvidencePicker
                  files={supportFilesByArea[field.id] ?? []}
                  inputKey={supportFileInputKeys[field.id] ?? 0}
                  onFilesChange={(files) =>
                    setSupportFilesByArea((current) => ({
                      ...current,
                      [field.id]: files,
                    }))
                  }
                  onInputReset={() =>
                    setSupportFileInputKeys((current) => ({
                      ...current,
                      [field.id]: (current[field.id] ?? 0) + 1,
                    }))
                  }
                  onLimitExceeded={() =>
                    setSubmitError(
                      "Puede adjuntar hasta 10 documentos por área.",
                    )
                  }
                  onRemove={(file) =>
                    setSupportFilesByArea((current) => ({
                      ...current,
                      [field.id]: (current[field.id] ?? []).filter(
                        (candidate) =>
                          candidate.name !== file.name ||
                          candidate.size !== file.size ||
                          candidate.lastModified !== file.lastModified,
                      ),
                    }))
                  }
                />
              </article>
            ))}
          </div>
        </section>
      </form>
    </>
  );
}
