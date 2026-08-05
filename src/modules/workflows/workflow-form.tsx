"use client";

import { useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, CircleAlert, FilePenLine, Save } from "lucide-react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import {
  workflowCreateFormSchema,
  type WorkflowCreateFormValues,
} from "@/modules/workflows/forms";
import { formatProcessType } from "@/modules/workflows/presentation";
import { workflowService } from "@/services/workflow-service";
import { getApiErrorMessage } from "@/utils";

const panelClassName = "nibol-panel p-6 sm:p-7";

export function WorkflowCreateForm() {
  const router = useRouter();
  const optionsQuery = useQuery({
    queryFn: workflowService.getWorkflowOptions,
    queryKey: QUERY_KEYS.workflowOptions,
  });
  const form = useForm<WorkflowCreateFormValues>({
    defaultValues: {
      description: "",
      name: "",
      processType: "",
      versionNotes: "",
    },
    resolver: zodResolver(
      workflowCreateFormSchema,
    ) as Resolver<WorkflowCreateFormValues>,
  });
  const values = useWatch({ control: form.control });
  const createMutation = useMutation({
    mutationFn: (input: WorkflowCreateFormValues) =>
      workflowService.createWorkflow({
        description: input.description.trim() || null,
        name: input.name.trim(),
        processType: input.processType,
        versionNotes: input.versionNotes.trim() || null,
      }),
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
    onSuccess: (workflow) => {
      toast.success("Flujo creado como borrador.");
      router.push(`/configuracion/flujos/${workflow.id}`);
      router.refresh();
    },
  });

  useEffect(() => {
    if (!optionsQuery.data || form.getValues("processType")) {
      return;
    }

    const firstProcess = optionsQuery.data.processes[0];
    if (firstProcess) {
      form.setValue("processType", firstProcess.key, { shouldValidate: true });
    }
  }, [form, optionsQuery.data]);

  if (optionsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary"
            onClick={() => {
              void optionsQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={optionsQuery.error.message}
        title="No fue posible cargar el catálogo de procesos"
      />
    );
  }

  const isBusy = optionsQuery.isLoading || createMutation.isPending;
  const selectedProcess = optionsQuery.data?.processes.find(
    (process) => process.key === values.processType,
  );
  const name = values.name?.trim() || "Sin nombre definido";
  const process =
    selectedProcess?.name ??
    (values.processType
      ? formatProcessType(values.processType, optionsQuery.data?.processes)
      : "Sin seleccionar");

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (nextValues) => {
        await createMutation.mutateAsync(nextValues);
      })}
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <div className={`${panelClassName} space-y-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
            <div className="space-y-2">
              <p className="nibol-eyebrow">Metadatos administrativos</p>
              <h2 className="font-display text-3xl leading-none font-bold tracking-[-0.03em] uppercase">
                Información general
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-[var(--foreground-soft)]">
                La primera versión se crea automáticamente como borrador. El
                diseñador y la publicación se habilitarán en fases posteriores.
              </p>
            </div>
            <Link
              className="nibol-btn-secondary px-3 py-2.5 text-sm"
              href="/configuracion/flujos"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--foreground-soft)]">
              Nombre del flujo <span className="text-[var(--accent)]">*</span>
            </span>
            <input
              className="nibol-field h-auto py-3"
              disabled={isBusy}
              placeholder="Ej. Aprobación de ampliaciones de plazo"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <span className="text-sm text-[var(--accent)]">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--foreground-soft)]">
              Proceso / módulo <span className="text-[var(--accent)]">*</span>
            </span>
            <select
              className="nibol-field h-auto py-3"
              disabled={isBusy}
              {...form.register("processType")}
            >
              <option value="">Seleccione un proceso</option>
              {optionsQuery.data?.processes.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.name}
                </option>
              ))}
            </select>
            {form.formState.errors.processType ? (
              <span className="text-sm text-[var(--accent)]">
                {form.formState.errors.processType.message}
              </span>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--foreground-soft)]">
              Descripción
            </span>
            <textarea
              className="nibol-field h-auto min-h-36 py-3"
              disabled={isBusy}
              placeholder="Explique el objetivo y alcance administrativo de este flujo."
              {...form.register("description")}
            />
            <div className="flex justify-between gap-3 text-xs text-[var(--muted)]">
              <span>Opcional</span>
              <span>{values.description?.length ?? 0}/10.000</span>
            </div>
            {form.formState.errors.description ? (
              <span className="text-sm text-[var(--accent)]">
                {form.formState.errors.description.message}
              </span>
            ) : null}
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-[var(--foreground-soft)]">
                Estado inicial
              </span>
              <div className="flex min-h-12 items-center gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--foreground-soft)]">
                <FilePenLine className="h-4 w-4 text-[var(--primary)]" />
                <span>Borrador</span>
              </div>
              <p className="text-xs leading-5 text-[var(--muted)]">
                No se puede publicar en esta fase.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-semibold text-[var(--foreground-soft)]">
                Versión inicial
              </span>
              <div className="flex min-h-12 items-center gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--foreground-soft)]">
                <span className="font-semibold text-[var(--foreground)]">
                  v1.0
                </span>
                <span>Primer borrador</span>
              </div>
              <p className="text-xs leading-5 text-[var(--muted)]">
                El número se asigna en el backend.
              </p>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--foreground-soft)]">
              Comentarios de versión
            </span>
            <textarea
              className="nibol-field h-auto min-h-28 py-3"
              disabled={isBusy}
              placeholder="Qué incluye esta primera versión administrativa."
              {...form.register("versionNotes")}
            />
            {form.formState.errors.versionNotes ? (
              <span className="text-sm text-[var(--accent)]">
                {form.formState.errors.versionNotes.message}
              </span>
            ) : null}
          </label>

          <div className="border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-sm leading-6 text-[var(--foreground-soft)]">
            <div className="flex gap-3">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
              <p>
                <strong className="text-[var(--foreground)]">
                  Intención de publicación:
                </strong>{" "}
                el flujo quedará preparado para validación y diseño. Publicar
                estará disponible después de completar la configuración.
              </p>
            </div>
          </div>
        </div>

        <aside
          className={`${panelClassName} h-fit space-y-6 xl:sticky xl:top-28`}
        >
          <div className="space-y-2">
            <p className="nibol-eyebrow">Vista previa</p>
            <h2 className="font-display text-3xl leading-none font-bold tracking-[-0.03em] uppercase">
              Resumen del flujo
            </h2>
            <p className="text-sm leading-6 text-[var(--foreground-soft)]">
              Revise la información base antes de crear el borrador.
            </p>
          </div>
          <div className="grid gap-3">
            <SummaryRow label="Nombre" value={name} />
            <SummaryRow label="Proceso" value={process} />
            <SummaryRow
              label="Estado"
              value="Borrador"
              valueClassName="text-[var(--primary)]"
            />
            <SummaryRow label="Versión" value="v1.0" />
          </div>
          <div className="border-t border-[var(--border)] pt-5">
            <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-[var(--muted)] uppercase">
              Requisitos iniciales
            </p>
            <div className="grid gap-3">
              <ChecklistItem
                complete={Boolean(values.name?.trim())}
                label="Información general completa"
              />
              <ChecklistItem
                complete={Boolean(values.processType)}
                label="Proceso seleccionado"
              />
              <ChecklistItem
                complete={false}
                label="Configuración del diseñador pendiente"
              />
              <ChecklistItem complete={false} label="Validación pendiente" />
            </div>
          </div>
        </aside>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          className="nibol-btn-secondary justify-center"
          href="/configuracion/flujos"
        >
          Cancelar
        </Link>
        <button
          className="nibol-btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          type="submit"
        >
          <Save className="h-4 w-4" />
          {createMutation.isPending
            ? "Guardando borrador..."
            : "Guardar y continuar"}
        </button>
      </div>
    </form>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${valueClassName ?? "text-[var(--foreground)]"}`}
      >
        {value}
      </p>
    </div>
  );
}

function ChecklistItem({
  complete,
  label,
}: {
  complete: boolean;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm leading-6 text-[var(--foreground-soft)]">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${complete ? "border-[var(--success)] bg-[var(--success)] text-white" : "border-[var(--border-strong)] bg-white text-transparent"}`}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      <span>{label}</span>
    </div>
  );
}
