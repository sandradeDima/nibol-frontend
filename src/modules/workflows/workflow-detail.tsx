"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Copy,
  FilePenLine,
  GitBranch,
  History,
  Layers3,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { FormDialog } from "@/components/ui/form-dialog";
import { QUERY_KEYS } from "@/lib/constants";
import {
  workflowDraftFormSchema,
  workflowDuplicateFormSchema,
  workflowMetadataFormSchema,
  type WorkflowDraftFormValues,
  type WorkflowDuplicateFormValues,
  type WorkflowMetadataFormValues,
} from "@/modules/workflows/forms";
import {
  formatDate,
  formatProcessType,
  formatUser,
  formatVersionStatus,
  formatWorkflowStatus,
  getActivityEntityLabel,
  getActivityLabel,
  getActivitySummary,
  getLatestVersionLabel,
  getStatusBadgeClass,
} from "@/modules/workflows/presentation";
import { workflowService } from "@/services/workflow-service";
import type { WorkflowDefinitionDetail, WorkflowVersionSummary } from "@/types";
import { getApiErrorMessage } from "@/utils";

type WorkflowDetailProps = {
  canArchive: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canSimulate: boolean;
  canViewVersions: boolean;
  workflowId: string;
};

export function WorkflowDetail({
  canArchive,
  canCreate,
  canEdit,
  canSimulate,
  canViewVersions,
  workflowId,
}: WorkflowDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(searchParams.get("edit") === "1");
  const [draftOpen, setDraftOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const workflowQuery = useQuery({
    queryFn: () => workflowService.getWorkflow(workflowId),
    queryKey: QUERY_KEYS.workflowDetails(workflowId),
  });
  const optionsQuery = useQuery({
    queryFn: workflowService.getWorkflowOptions,
    queryKey: QUERY_KEYS.workflowOptions,
  });
  const versionsQuery = useQuery({
    enabled: canViewVersions,
    queryFn: () =>
      workflowService.listWorkflowVersions(workflowId, { perPage: 50 }),
    queryKey: QUERY_KEYS.workflowVersions(workflowId),
  });
  const activityQuery = useQuery({
    queryFn: () =>
      workflowService.listWorkflowActivity(workflowId, { perPage: 8 }),
    queryKey: QUERY_KEYS.workflowActivity(workflowId),
  });

  const invalidateWorkflow = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workflowDetails(workflowId),
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workflowVersions(workflowId),
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workflowActivity(workflowId),
      }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workflows }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workflowSummary }),
    ]);
  };

  const archiveMutation = useMutation({
    mutationFn: () => workflowService.archiveWorkflow(workflowId),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: async () => {
      toast.success(
        "Flujo archivado. Las versiones e historial se conservaron.",
      );
      setArchiveOpen(false);
      await invalidateWorkflow();
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (values: WorkflowDuplicateFormValues) =>
      workflowService.duplicateWorkflow(workflowId, {
        name: values.name.trim(),
        sourceVersionId: values.sourceVersionId,
        versionNotes: values.versionNotes.trim() || null,
      }),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: (workflow) => {
      toast.success("Flujo duplicado como borrador.");
      setDuplicateOpen(false);
      router.push(`/configuracion/flujos/${workflow.id}`);
    },
  });

  const draftMutation = useMutation({
    mutationFn: (values: WorkflowDraftFormValues) =>
      workflowService.createDraftVersion(workflowId, {
        changeDescription: values.changeDescription.trim() || null,
        sourceVersionId: values.sourceVersionId || undefined,
      }),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: async (version) => {
      toast.success(
        `Versión v${version.versionNumber}.0 creada como borrador.`,
      );
      setDraftOpen(false);
      await invalidateWorkflow();
    },
  });

  if (workflowQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary"
            onClick={() => {
              void workflowQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={workflowQuery.error.message}
        title="No fue posible cargar el flujo"
      />
    );
  }

  if (workflowQuery.isLoading || !workflowQuery.data) {
    return <DetailSkeleton />;
  }

  const workflow = workflowQuery.data;
  const processes = optionsQuery.data?.processes ?? [];
  const versions = versionsQuery.data?.data ?? [];
  const canMutateMetadata = canEdit && workflow.status !== "ARCHIVED";
  const isProcessLocked =
    workflow.activeVersion !== null || workflow._count.instances > 0;
  const sourceVersions =
    versions.length > 0
      ? versions
      : [workflow.activeVersion, workflow.latestVersion].filter(
          (version): version is WorkflowVersionSummary => Boolean(version),
        );

  return (
    <div className="space-y-6">
      <section className="nibol-panel overflow-hidden">
        <div className="bg-[var(--primary)] px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="nibol-badge border-white/20 bg-white/10 text-white">
                  {formatWorkflowStatus(workflow.status)}
                </span>
                <span className="text-sm text-slate-300">
                  {formatProcessType(workflow.processType, processes)}
                </span>
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-4xl leading-none font-bold tracking-[-0.03em] uppercase sm:text-5xl">
                  {workflow.name}
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-slate-300">
                  {workflow.description ||
                    "Este flujo todavía no tiene una descripción administrativa."}
                </p>
              </div>
            </div>
            <div className="grid min-w-[13rem] gap-3 border border-white/12 bg-white/6 px-4 py-4">
              <span className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                Versión de referencia
              </span>
              <span className="text-3xl font-semibold">
                {getLatestVersionLabel(
                  workflow.activeVersion,
                  workflow.latestVersion,
                )}
              </span>
              <span className="text-sm text-slate-300">
                {workflow.activeVersion
                  ? "Activa publicada"
                  : "Último borrador"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-[var(--border)] bg-[var(--surface-soft)] px-6 py-4 sm:px-8">
          <Link className="nibol-btn-secondary" href="/configuracion/flujos">
            <ArrowLeft className="h-4 w-4" /> Volver a flujos
          </Link>
          {canMutateMetadata ? (
            <button
              className="nibol-btn-secondary"
              onClick={() => setEditOpen(true)}
              type="button"
            >
              <FilePenLine className="h-4 w-4" /> Editar metadatos
            </button>
          ) : null}
          {canEdit && workflow.status !== "ARCHIVED" ? (
            <button
              className="nibol-btn-secondary"
              onClick={() => setDraftOpen(true)}
              type="button"
            >
              <Plus className="h-4 w-4" /> Nueva versión borrador
            </button>
          ) : null}
          {canCreate ? (
            <button
              className="nibol-btn-secondary"
              onClick={() => setDuplicateOpen(true)}
              type="button"
            >
              <Copy className="h-4 w-4" /> Duplicar
            </button>
          ) : null}
          {canViewVersions ? (
            <Link
              className="nibol-btn-secondary"
              href={`/configuracion/flujos/${workflow.id}/versiones`}
            >
              <History className="h-4 w-4" /> Ver historial
            </Link>
          ) : null}
          {canArchive && workflow.status !== "ARCHIVED" ? (
            <button
              className="nibol-btn-secondary text-[var(--accent)] hover:border-[var(--accent)]"
              onClick={() => setArchiveOpen(true)}
              type="button"
            >
              <Archive className="h-4 w-4" /> Archivar
            </button>
          ) : null}
          {canViewVersions &&
          workflow.latestVersion &&
          workflow.status !== "ARCHIVED" ? (
            <Link
              className="nibol-btn-secondary ml-auto"
              href={`/configuracion/flujos/${workflow.id}/versiones/${workflow.latestVersion.id}/disenador`}
            >
              <GitBranch className="h-4 w-4" /> Abrir diseñador
            </Link>
          ) : null}
          {canSimulate && workflow.activeVersion ? (
            <Link
              className="nibol-btn-secondary"
              href={`/configuracion/flujos/${workflow.id}/versiones/${workflow.activeVersion.id}/simulacion`}
            >
              <ShieldCheck className="h-4 w-4" /> Simular activa
            </Link>
          ) : null}
        </div>
      </section>

      {workflow.status === "ARCHIVED" ? (
        <div className="flex items-start gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-sm leading-6 text-[var(--foreground-soft)]">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
          <p>
            <strong className="text-[var(--foreground)]">
              Flujo archivado.
            </strong>{" "}
            No puede iniciar nuevas instancias ni recibir cambios de metadatos.
            Sus versiones, instancias existentes e historial siguen disponibles.
          </p>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="nibol-panel p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
            <div className="space-y-2">
              <p className="nibol-eyebrow">Ficha administrativa</p>
              <h2 className="font-display text-3xl leading-none font-bold tracking-[-0.03em] uppercase">
                Información general
              </h2>
            </div>
            <span className={getStatusBadgeClass(workflow.status)}>
              {formatWorkflowStatus(workflow.status)}
            </span>
          </div>
          <dl className="mt-6 grid gap-x-6 gap-y-6 sm:grid-cols-2">
            <DefinitionFact
              icon={GitBranch}
              label="Proceso relacionado"
              value={formatProcessType(workflow.processType, processes)}
            />
            <DefinitionFact
              icon={UserRound}
              label="Creado por"
              value={formatUser(workflow.createdBy)}
            />
            <DefinitionFact
              icon={CalendarDays}
              label="Fecha de creación"
              value={formatDate(workflow.createdAt)}
            />
            <DefinitionFact
              icon={CalendarDays}
              label="Última actualización"
              value={formatDate(workflow.updatedAt)}
            />
            <DefinitionFact
              icon={Layers3}
              label="Versiones"
              value={String(workflow._count.versions)}
            />
            <DefinitionFact
              icon={ShieldCheck}
              label="Instancias de runtime"
              value={String(workflow._count.instances)}
            />
            <DefinitionFact
              icon={CheckCircle2}
              label="Versión publicada"
              value={
                workflow.activeVersion
                  ? `v${workflow.activeVersion.versionNumber}.0 · ${formatDate(workflow.activeVersion.publishedAt)}`
                  : "No disponible"
              }
            />
            <DefinitionFact
              icon={FilePenLine}
              label="Último borrador"
              value={
                workflow.latestVersion?.status === "DRAFT"
                  ? `v${workflow.latestVersion.versionNumber}.0 · ${formatDate(workflow.latestVersion.createdAt)}`
                  : "No disponible"
              }
            />
            {workflow.archivedAt ? (
              <DefinitionFact
                icon={Archive}
                label="Fecha de archivo"
                value={formatDate(workflow.archivedAt)}
              />
            ) : null}
          </dl>
        </div>

        <section className="nibol-panel p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="nibol-eyebrow">Vista rápida</p>
              <h2 className="font-display text-3xl leading-none font-bold tracking-[-0.03em] uppercase">
                Versiones recientes
              </h2>
            </div>
            {canViewVersions ? (
              <Link
                className="text-sm font-semibold text-[var(--primary)] hover:underline"
                href={`/configuracion/flujos/${workflow.id}/versiones`}
              >
                Ver todas
              </Link>
            ) : null}
          </div>
          <div className="mt-6">
            {versionsQuery.isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-12 bg-[var(--border)]" />
                <div className="h-12 bg-[var(--border)]" />
                <div className="h-12 bg-[var(--border)]" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-sm leading-6 text-[var(--muted)]">
                No hay versiones disponibles para mostrar.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {versions.slice(0, 4).map((version) => (
                  <VersionPreview
                    canSimulate={canSimulate}
                    key={version.id}
                    version={version}
                    workflowId={workflow.id}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </section>

      <section className="nibol-panel p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div className="space-y-2">
            <p className="nibol-eyebrow">Trazabilidad</p>
            <h2 className="font-display text-3xl leading-none font-bold tracking-[-0.03em] uppercase">
              Actividad reciente
            </h2>
            <p className="text-sm leading-6 text-[var(--foreground-soft)]">
              Eventos administrativos registrados por la infraestructura
              existente de actividad y auditoría.
            </p>
          </div>
          <span className="text-sm text-[var(--muted)]">
            {activityQuery.data?.pagination.total ?? 0} eventos
          </span>
        </div>
        {activityQuery.isError ? (
          <div className="mt-5 border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-sm text-[var(--foreground-soft)]">
            No fue posible cargar la actividad reciente.
          </div>
        ) : activityQuery.isLoading ? (
          <div className="mt-5 animate-pulse space-y-3">
            <div className="h-12 bg-[var(--border)]" />
            <div className="h-12 bg-[var(--border)]" />
            <div className="h-12 bg-[var(--border)]" />
          </div>
        ) : activityQuery.data?.data.length ? (
          <div className="mt-5 divide-y divide-[var(--border)]">
            {activityQuery.data.data.map((item) => (
              <div
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                key={item.id}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-8 w-8 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                    <History className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {getActivityLabel(item.action)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {getActivitySummary(item.metadata) ||
                        getActivityEntityLabel(item.entityType)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatUser(item.user)} ·{" "}
                      {getActivityEntityLabel(item.entityType)}
                    </p>
                  </div>
                </div>
                <span className="text-xs whitespace-nowrap text-[var(--muted)]">
                  {formatDate(item.createdAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-[var(--muted)]">
            Todavía no hay actividad registrada para este flujo.
          </p>
        )}
      </section>

      <MetadataDialog
        isProcessLocked={isProcessLocked}
        onClose={() => {
          setEditOpen(false);
          router.replace(`/configuracion/flujos/${workflow.id}`);
        }}
        onSuccess={async () => {
          setEditOpen(false);
          await invalidateWorkflow();
        }}
        open={editOpen}
        options={processes}
        workflow={workflow}
      />
      <DraftDialog
        onClose={() => setDraftOpen(false)}
        onSubmit={async (values) => {
          await draftMutation.mutateAsync(values);
        }}
        open={draftOpen}
        pending={draftMutation.isPending}
        versions={sourceVersions}
      />
      <DuplicateDialog
        onClose={() => setDuplicateOpen(false)}
        onSubmit={async (values) => {
          await duplicateMutation.mutateAsync(values);
        }}
        open={duplicateOpen}
        pending={duplicateMutation.isPending}
        versions={sourceVersions}
        workflow={workflow}
      />
      <ConfirmDialog
        confirmLabel="Archivar flujo"
        description="Los flujos archivados no pueden iniciar nuevas instancias. Las instancias existentes, versiones publicadas y el historial de ejecución se conservan."
        isLoading={archiveMutation.isPending}
        onConfirm={() => {
          void archiveMutation.mutateAsync();
        }}
        onOpenChange={setArchiveOpen}
        open={archiveOpen}
        title="Archivar flujo"
      />
    </div>
  );
}

function MetadataDialog({
  isProcessLocked,
  onClose,
  onSuccess,
  open,
  options,
  workflow,
}: {
  isProcessLocked: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  open: boolean;
  options: Array<{ key: string; name: string }>;
  workflow: WorkflowDefinitionDetail;
}) {
  const form = useForm<WorkflowMetadataFormValues>({
    defaultValues: {
      description: workflow.description ?? "",
      name: workflow.name,
      processType: workflow.processType,
    },
    resolver: zodResolver(
      workflowMetadataFormSchema,
    ) as Resolver<WorkflowMetadataFormValues>,
  });
  const mutation = useMutation({
    mutationFn: (values: WorkflowMetadataFormValues) =>
      workflowService.updateWorkflow(workflow.id, {
        description: values.description.trim() || null,
        name: values.name.trim(),
        processType: values.processType,
      }),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: async () => {
      toast.success("Metadatos actualizados y registrados en auditoría.");
      await onSuccess();
    },
  });

  useEffect(() => {
    if (open)
      form.reset({
        description: workflow.description ?? "",
        name: workflow.name,
        processType: workflow.processType,
      });
  }, [form, open, workflow]);

  return (
    <FormDialog
      description="Los cambios se registran en actividad y auditoría. Los workflows archivados no se pueden editar."
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="nibol-btn-secondary justify-center"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="nibol-btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60"
            disabled={mutation.isPending}
            onClick={() => {
              void form.handleSubmit(async (values) => {
                await mutation.mutateAsync(values);
              })();
            }}
            type="button"
          >
            {mutation.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      }
      onOpenChange={(next) => {
        if (!next && !mutation.isPending) onClose();
      }}
      open={open}
      title="Editar metadatos"
    >
      <div className="grid gap-5">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground-soft)]">
            Nombre
          </span>
          <input
            className="nibol-field h-auto py-3"
            disabled={mutation.isPending}
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
            Proceso
          </span>
          <select
            className="nibol-field h-auto py-3"
            disabled={isProcessLocked || mutation.isPending}
            {...form.register("processType")}
          >
            {options.map((option) => (
              <option key={option.key} value={option.key}>
                {option.name}
              </option>
            ))}
          </select>
          {isProcessLocked ? (
            <span className="text-xs leading-5 text-[var(--muted)]">
              No se puede cambiar porque el workflow ya tiene una versión
              publicada o instancias runtime.
            </span>
          ) : null}
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground-soft)]">
            Descripción
          </span>
          <textarea
            className="nibol-field h-auto min-h-32 py-3"
            disabled={mutation.isPending}
            {...form.register("description")}
          />
          {form.formState.errors.description ? (
            <span className="text-sm text-[var(--accent)]">
              {form.formState.errors.description.message}
            </span>
          ) : null}
        </label>
      </div>
    </FormDialog>
  );
}

function DraftDialog({
  onClose,
  onSubmit,
  open,
  pending,
  versions,
}: {
  onClose: () => void;
  onSubmit: (values: WorkflowDraftFormValues) => Promise<void>;
  open: boolean;
  pending: boolean;
  versions: WorkflowVersionSummary[];
}) {
  const form = useForm<WorkflowDraftFormValues>({
    defaultValues: {
      changeDescription: "",
      sourceVersionId: versions[0]?.id ?? "",
    },
    resolver: zodResolver(
      workflowDraftFormSchema,
    ) as Resolver<WorkflowDraftFormValues>,
  });
  useEffect(() => {
    if (open)
      form.reset({
        changeDescription: "",
        sourceVersionId: versions[0]?.id ?? "",
      });
  }, [form, open, versions]);
  return (
    <FormDialog
      description="Se creará una nueva versión secuencial en borrador. El contenido normalizado de la versión origen se clona de forma transaccional."
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="nibol-btn-secondary justify-center"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="nibol-btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            onClick={() => {
              void form.handleSubmit(onSubmit)();
            }}
            type="button"
          >
            {pending ? "Creando..." : "Crear borrador"}
          </button>
        </div>
      }
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
      open={open}
      title="Nueva versión borrador"
    >
      <div className="grid gap-5">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground-soft)]">
            Versión origen
          </span>
          <select
            className="nibol-field h-auto py-3"
            disabled={pending}
            {...form.register("sourceVersionId")}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                v{version.versionNumber}.0 ·{" "}
                {formatVersionStatus(version.status)}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground-soft)]">
            Descripción del cambio
          </span>
          <textarea
            className="nibol-field h-auto min-h-32 py-3"
            disabled={pending}
            placeholder="Qué se preparará en esta versión."
            {...form.register("changeDescription")}
          />
          {form.formState.errors.changeDescription ? (
            <span className="text-sm text-[var(--accent)]">
              {form.formState.errors.changeDescription.message}
            </span>
          ) : null}
        </label>
      </div>
    </FormDialog>
  );
}

function DuplicateDialog({
  onClose,
  onSubmit,
  open,
  pending,
  versions,
  workflow,
}: {
  onClose: () => void;
  onSubmit: (values: WorkflowDuplicateFormValues) => Promise<void>;
  open: boolean;
  pending: boolean;
  versions: WorkflowVersionSummary[];
  workflow: WorkflowDefinitionDetail;
}) {
  const form = useForm<WorkflowDuplicateFormValues>({
    defaultValues: {
      name: `Copia de ${workflow.name}`.slice(0, 191),
      sourceVersionId: versions[0]?.id ?? "",
      versionNotes: "",
    },
    resolver: zodResolver(
      workflowDuplicateFormSchema,
    ) as Resolver<WorkflowDuplicateFormValues>,
  });
  useEffect(() => {
    if (open)
      form.reset({
        name: `Copia de ${workflow.name}`.slice(0, 191),
        sourceVersionId: versions[0]?.id ?? "",
        versionNotes: "",
      });
  }, [form, open, versions, workflow.name]);
  return (
    <FormDialog
      description="La copia será una definición independiente, siempre en borrador y sin relación con instancias o historial del original."
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="nibol-btn-secondary justify-center"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="nibol-btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            onClick={() => {
              void form.handleSubmit(onSubmit)();
            }}
            type="button"
          >
            {pending ? "Duplicando..." : "Duplicar como borrador"}
          </button>
        </div>
      }
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
      open={open}
      title="Duplicar flujo"
    >
      <div className="grid gap-5">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground-soft)]">
            Nombre
          </span>
          <input
            className="nibol-field h-auto py-3"
            disabled={pending}
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
            Duplicar versión
          </span>
          <select
            className="nibol-field h-auto py-3"
            disabled={pending}
            {...form.register("sourceVersionId")}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                v{version.versionNumber}.0 ·{" "}
                {formatVersionStatus(version.status)}
              </option>
            ))}
          </select>
          {form.formState.errors.sourceVersionId ? (
            <span className="text-sm text-[var(--accent)]">
              {form.formState.errors.sourceVersionId.message}
            </span>
          ) : null}
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground-soft)]">
            Comentarios de versión
          </span>
          <textarea
            className="nibol-field h-auto min-h-28 py-3"
            disabled={pending}
            {...form.register("versionNotes")}
          />
          {form.formState.errors.versionNotes ? (
            <span className="text-sm text-[var(--accent)]">
              {form.formState.errors.versionNotes.message}
            </span>
          ) : null}
        </label>
      </div>
    </FormDialog>
  );
}

function DefinitionFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <dt className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
          {label}
        </dt>
        <dd className="mt-1 text-sm leading-6 font-semibold text-[var(--foreground)]">
          {value}
        </dd>
      </div>
    </div>
  );
}

function VersionPreview({
  canSimulate,
  version,
  workflowId,
}: {
  canSimulate: boolean;
  version: WorkflowVersionSummary;
  workflowId: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]">
          v{version.versionNumber}
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Versión {version.versionNumber}.0
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {formatUser(version.createdBy)} · {formatDate(version.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className={getStatusBadgeClass(version.status)}>
          {formatVersionStatus(version.status)}
        </span>
        {canSimulate ? (
          <Link
            className="text-xs font-semibold text-[var(--primary)] hover:underline"
            href={`/configuracion/flujos/${workflowId}/versiones/${version.id}/simulacion`}
          >
            Simular
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-56 bg-[var(--border)]" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 bg-[var(--border)]" />
        <div className="h-80 bg-[var(--border)]" />
      </div>
    </div>
  );
}
