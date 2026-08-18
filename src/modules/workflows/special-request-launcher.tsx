"use client";

import { useMemo } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  GitBranch,
  Send,
  UserRound,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import {
  specialRequestStartFormSchema,
  type SpecialRequestStartFormValues,
} from "@/modules/workflows/forms";
import { workflowRuntimeService } from "@/services/workflow-runtime-service";
import { getApiErrorMessage } from "@/utils";

const createReference = (): string => {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `SR-${stamp}-${suffix}`;
};

export function SpecialRequestLauncher() {
  const router = useRouter();
  const optionsQuery = useQuery({
    queryFn: () => workflowRuntimeService.getStartOptions(),
    queryKey: QUERY_KEYS.workflowStartOptions,
  });
  const form = useForm<SpecialRequestStartFormValues>({
    defaultValues: {
      areaId: "",
      description: "",
      dueDate: "",
      requestType: "",
      responsibleUserId: "",
      riskLevel: "",
      title: "",
      workflowDefinitionId: "",
    },
    resolver: zodResolver(specialRequestStartFormSchema),
  });
  const selectedWorkflowId = useWatch({
    control: form.control,
    name: "workflowDefinitionId",
  });
  const selectedWorkflow = useMemo(
    () =>
      optionsQuery.data?.workflows.find(
        (workflow) => workflow.id === selectedWorkflowId,
      ) ?? null,
    [optionsQuery.data?.workflows, selectedWorkflowId],
  );
  const startMutation = useMutation({
    mutationFn: (values: SpecialRequestStartFormValues) => {
      const requestReference = createReference();
      return workflowRuntimeService.startInstance({
        context: {
          ...(values.areaId ? { areaId: values.areaId } : {}),
          custom: {
            description: values.description.trim(),
            reference: requestReference,
            title: values.title.trim(),
          },
          ...(values.dueDate ? { dueDate: values.dueDate } : {}),
          requestType: values.requestType.trim(),
          ...(values.responsibleUserId
            ? { responsibleUserId: values.responsibleUserId }
            : {}),
          ...(values.riskLevel ? { riskLevel: values.riskLevel } : {}),
        },
        entityId: requestReference,
        entityType: "special_request",
        processType: "SPECIAL_REQUEST",
        workflowDefinitionId: values.workflowDefinitionId,
      });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: (instance) => {
      toast.success(
        `Solicitud ${instance.specialRequest?.reference ?? instance.entityId} iniciada.`,
      );
      router.push(`/configuracion/flujos/instancias/${instance.id}`);
    },
  });

  if (optionsQuery.isPending) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="nibol-panel h-[42rem] animate-pulse bg-[var(--surface-muted)]" />
        <div className="nibol-panel h-72 animate-pulse bg-[var(--surface-muted)]" />
      </div>
    );
  }
  if (optionsQuery.isError) {
    return (
      <ErrorState
        description={getApiErrorMessage(optionsQuery.error)}
        title="No fue posible preparar la solicitud"
      />
    );
  }
  if (!optionsQuery.data.workflows.length) {
    return (
      <EmptyState
        action={
          <Link className="nibol-btn-primary" href="/configuracion/flujos">
            Abrir constructor de flujos
          </Link>
        }
        description="Publique al menos un flujo de tipo Solicitud especial para habilitar este formulario."
        title="No hay flujos disponibles"
      />
    );
  }

  const errors = form.formState.errors;
  return (
    <form
      className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
      onSubmit={form.handleSubmit((values) => startMutation.mutate(values))}
    >
      <div className="nibol-panel overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-6 py-5 sm:px-8">
          <div className="flex items-start gap-4">
            <div className="bg-[var(--primary-soft)] p-3 text-[var(--primary)]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="nibol-eyebrow">Datos de entrada</p>
              <h2 className="font-display mt-2 text-2xl font-bold text-[var(--foreground)] uppercase">
                Nueva solicitud
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground-soft)]">
                El flujo elegido queda fijado a su versión publicada actual. Los
                cambios futuros no alterarán esta ejecución.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8">
          <Field
            error={errors.workflowDefinitionId?.message}
            label="Flujo de aprobación"
            required
          >
            <select
              className="nibol-field"
              {...form.register("workflowDefinitionId")}
            >
              <option value="">Seleccione un flujo publicado</option>
              {optionsQuery.data.workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name} · v
                  {workflow.activeVersion?.versionNumber ?? "—"}.0
                </option>
              ))}
            </select>
          </Field>

          {selectedWorkflow ? (
            <div className="flex gap-3 border border-[var(--border)] bg-[var(--primary-soft)]/50 p-4">
              <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {selectedWorkflow.name} · versión{" "}
                  {selectedWorkflow.activeVersion?.versionNumber ?? "—"}.0
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--foreground-soft)]">
                  {selectedWorkflow.description ||
                    "Este flujo no tiene una descripción administrativa."}
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            <Field error={errors.title?.message} label="Título" required>
              <input
                className="nibol-field"
                placeholder="Ej. Excepción para compra urgente"
                {...form.register("title")}
              />
            </Field>
            <Field
              error={errors.requestType?.message}
              label="Tipo de solicitud"
              required
            >
              <input
                className="nibol-field"
                placeholder="Ej. Excepción operativa"
                {...form.register("requestType")}
              />
            </Field>
          </div>

          <Field
            error={errors.description?.message}
            label="Descripción"
            required
          >
            <textarea
              className="nibol-field min-h-36 resize-y"
              placeholder="Explique qué se solicita, por qué es necesario y cuál es el resultado esperado."
              {...form.register("description")}
            />
          </Field>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Prioridad o nivel">
              <select className="nibol-field" {...form.register("riskLevel")}>
                <option value="">Sin clasificación</option>
                {optionsQuery.data.riskLevels
                  .filter((risk) => risk.key)
                  .map((risk) => (
                    <option key={risk.key} value={risk.key ?? ""}>
                      {risk.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Fecha objetivo">
              <input
                className="nibol-field"
                min={new Date().toISOString().slice(0, 10)}
                type="date"
                {...form.register("dueDate")}
              />
            </Field>
            <Field label="Área relacionada">
              <select className="nibol-field" {...form.register("areaId")}>
                <option value="">Sin área específica</option>
                {optionsQuery.data.areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Responsable sugerido">
              <select
                className="nibol-field"
                {...form.register("responsibleUserId")}
              >
                <option value="">Determinado por el flujo</option>
                {optionsQuery.data.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} · {user.email}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-6">
        <div className="nibol-panel space-y-5 p-6">
          <div>
            <p className="nibol-eyebrow">Identificación</p>
            <p className="mt-2 text-xl font-bold tracking-tight text-[var(--foreground)]">
              Se asigna al iniciar
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-soft)]">
              Esta referencia acompañará la solicitud durante todo el flujo.
            </p>
          </div>
          <div className="grid gap-3 border-t border-[var(--border)] pt-4 text-sm">
            <SummaryRow
              icon={GitBranch}
              label="Flujo"
              value={selectedWorkflow?.name ?? "Pendiente de selección"}
            />
            <SummaryRow
              icon={UserRound}
              label="Asignación"
              value="Según diseño publicado"
            />
            <SummaryRow
              icon={CalendarClock}
              label="Seguimiento"
              value="Tareas, SLA e historial"
            />
          </div>
          <button
            className="nibol-btn-primary w-full justify-center"
            disabled={startMutation.isPending}
            type="submit"
          >
            <Send className="h-4 w-4" />
            {startMutation.isPending ? "Iniciando…" : "Iniciar solicitud"}
          </button>
          <Link
            className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
            href="/aprobaciones/flujos"
          >
            Ver tareas de flujos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </aside>
    </form>
  );
}

function Field({
  children,
  error,
  label,
  required = false,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--foreground)]">
      <span>
        {label}
        {required ? <span className="text-[var(--accent)]"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span className="text-xs font-medium text-[var(--accent)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GitBranch;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
      <div>
        <p className="text-xs text-[var(--muted)]">{label}</p>
        <p className="mt-0.5 font-semibold text-[var(--foreground)]">{value}</p>
      </div>
    </div>
  );
}
