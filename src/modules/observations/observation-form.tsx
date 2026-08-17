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
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import {
  observationFormSchema,
  type ObservationFormValues,
} from "@/modules/observations/forms";
import { observationService } from "@/services/observation-service";
import { progressService } from "@/services/progress-service";
import { getApiErrorMessage } from "@/utils";

type ObservationFormProps =
  { mode: "create" } | { mode: "edit"; observationId: string };

const emptyValues: ObservationFormValues = {
  areaAssignments: [
    { areaId: "", areaResponsibleUserId: "", processOwnerUserId: "" },
  ],
  auditRecommendation: "",
  auditReportId: "",
  auditorUserId: "",
  category: null,
  currentStage: null,
  description: "",
  mainObservationId: "",
  observationNumber: 1,
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

function UserCaption({
  userId,
  users,
}: {
  userId: string;
  users: Array<{
    email: string;
    id: string;
    jobTitle: string | null;
    name: string;
  }>;
}) {
  const user = users.find((item) => item.id === userId);
  if (!user) return null;
  return (
    <span className="block text-xs font-normal text-stone-500">
      {user.jobTitle ?? "Cargo no registrado"} · {user.email}
    </span>
  );
}

const calculatedDeadline = (
  reportDate: string | undefined,
  days: number | null | undefined,
) => {
  if (!reportDate || !days) return null;
  const date = new Date(`${reportDate.slice(0, 10)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export function ObservationForm(props: ObservationFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
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
  const riskLevelId = useWatch({ control: form.control, name: "riskLevelId" });
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
      auditorUserId: item.auditorUser.id,
      category: item.category,
      currentStage: item.currentStage,
      description: item.description,
      mainObservationId: item.mainObservation.id,
      observationNumber: item.observationNumber,
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
    selectedLevel?.defaultDeadlineDays,
  );
  const mutation = useMutation({
    mutationFn: async (values: ObservationFormValues) => {
      const observation =
        props.mode === "create"
          ? observationService.createObservation(values)
          : observationService.updateObservation(props.observationId, values);
      const savedObservation = await observation;
      if (supportFiles.length > 0) {
        await progressService.uploadObservationEvidence(
          savedObservation.id,
          supportFiles,
          "Documentos soporte registrados con el hallazgo.",
        );
      }
      return savedObservation;
    },
    onError: (error) => setSubmitError(getApiErrorMessage(error)),
    onSuccess: async (observation) => {
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
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit((values) => {
        setSubmitError(null);
        mutation.mutate(values);
      })}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="nibol-btn-secondary px-4 py-2.5 text-sm"
          href={
            observationId ? `/observaciones/${observationId}` : "/observaciones"
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

      <section className="nibol-panel overflow-hidden">
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
            <select
              className={fieldClass}
              disabled={unavailable || props.mode === "edit"}
              {...form.register("auditReportId")}
            >
              <option value="">Seleccione un informe</option>
              {optionsQuery.data?.auditReports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.reportNumber} · {report.title}
                </option>
              ))}
            </select>
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
                  {selectedReport.reportDate.slice(0, 10)}
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
            error={form.formState.errors.observationNumber?.message}
            label="Número de observación"
          >
            <input
              className={fieldClass}
              min={1}
              type="number"
              {...form.register("observationNumber")}
            />
          </Field>
          <Field
            error={form.formState.errors.mainObservationId?.message}
            label="Observación principal"
          >
            <select
              className={fieldClass}
              {...form.register("mainObservationId")}
            >
              <option value="">Seleccione del diccionario</option>
              {optionsQuery.data?.mainObservations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field error={form.formState.errors.title?.message} label="Título">
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
          <Field label="Auditor responsable">
            <select className={fieldClass} {...form.register("auditorUserId")}>
              <option value="">Seleccione un auditor</option>
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
              Los riesgos asociados son independientes del nivel que calcula el
              plazo.
            </p>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Field
            error={form.formState.errors.riskIds?.message}
            label="Riesgos asociados"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {optionsQuery.data?.risks.map((risk) => (
                <label
                  className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 font-medium"
                  key={risk.id}
                >
                  <input
                    className="mt-1 h-4 w-4 accent-amber-700"
                    type="checkbox"
                    value={risk.id}
                    {...form.register("riskIds")}
                  />
                  <span>
                    {risk.name}
                    {risk.description ? (
                      <small className="mt-1 block font-normal text-stone-500">
                        {risk.description}
                      </small>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </Field>
          <div className="space-y-4">
            <Field
              error={form.formState.errors.riskLevelId?.message}
              label="Nivel de riesgo"
            >
              <select className={fieldClass} {...form.register("riskLevelId")}>
                <option value="">Seleccione el nivel</option>
                {optionsQuery.data?.riskLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <CalendarDays className="h-4 w-4" />
                Fecha límite calculada
              </div>
              <p className="mt-2 text-2xl font-semibold text-stone-950">
                {dueDate ?? "—"}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {selectedLevel?.name ?? "Nivel pendiente"} ·{" "}
                {selectedLevel?.defaultDeadlineDays ?? "—"} días desde la fecha
                del informe. El backend realiza el cálculo definitivo.
              </p>
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
                Asigne quién es dueño del proceso y quién ejecuta por cada área.
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
                    onClick={() => areas.remove(index)}
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
                  <select
                    className={fieldClass}
                    {...form.register(
                      `areaAssignments.${index}.processOwnerUserId`,
                    )}
                  >
                    <option value="">Seleccione</option>
                    {optionsQuery.data?.users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <UserCaption
                    userId={watchedAreas[index]?.processOwnerUserId ?? ""}
                    users={optionsQuery.data?.users ?? []}
                  />
                </Field>
                <Field
                  error={
                    form.formState.errors.areaAssignments?.[index]
                      ?.areaResponsibleUserId?.message
                  }
                  label="Responsable del área"
                >
                  <select
                    className={fieldClass}
                    {...form.register(
                      `areaAssignments.${index}.areaResponsibleUserId`,
                    )}
                  >
                    <option value="">Seleccione</option>
                    {optionsQuery.data?.users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <UserCaption
                    userId={watchedAreas[index]?.areaResponsibleUserId ?? ""}
                    users={optionsQuery.data?.users ?? []}
                  />
                </Field>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="nibol-panel p-6">
        <div className="mb-5 flex items-center gap-3">
          <Upload className="h-5 w-5 text-amber-700" />
          <div>
            <h2 className="text-lg font-semibold text-stone-950">
              Documentos soporte del hallazgo
            </h2>
            <p className="text-sm text-stone-500">
              Adjunte la evidencia de origen. Se conservará con contexto
              Hallazgo y trazabilidad del usuario.
            </p>
          </div>
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-8 text-center transition hover:border-amber-400 hover:bg-amber-50/40">
          <Upload className="mb-3 h-6 w-6 text-amber-700" />
          <span className="text-sm font-semibold text-stone-900">
            Seleccionar archivos
          </span>
          <span className="mt-1 text-xs text-stone-500">
            Puede elegir varios documentos en una sola carga.
          </span>
          <input
            className="sr-only"
            multiple
            onChange={(event) =>
              setSupportFiles(Array.from(event.target.files ?? []))
            }
            type="file"
          />
        </label>
        {supportFiles.length > 0 ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {supportFiles.map((file) => (
              <li
                className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
                key={`${file.name}-${file.size}`}
              >
                {file.name}
                <span className="ml-2 text-xs text-stone-400">
                  {Math.ceil(file.size / 1024)} KB
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {submitError ? (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800"
          role="alert"
        >
          {submitError}
        </div>
      ) : null}
    </form>
  );
}
