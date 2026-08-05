"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Copy,
  Eye,
  FilePenLine,
  History,
  ListChecks,
  RefreshCcw,
  Route,
  ShieldCheck,
} from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormDialog } from "@/components/ui/form-dialog";
import { QUERY_KEYS } from "@/lib/constants";
import {
  workflowDraftFormSchema,
  type WorkflowDraftFormValues,
} from "@/modules/workflows/forms";
import {
  formatDate,
  formatProcessType,
  formatUser,
  formatVersionStatus,
  getStatusBadgeClass,
} from "@/modules/workflows/presentation";
import { workflowService } from "@/services/workflow-service";
import type { WorkflowVersionDetail, WorkflowVersionSummary } from "@/types";
import { getApiErrorMessage } from "@/utils";

export function WorkflowVersionHistory({
  canCreateDraft,
  canSimulate,
  workflowId,
}: {
  canCreateDraft: boolean;
  canSimulate: boolean;
  workflowId: string;
}) {
  const queryClient = useQueryClient();
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );
  const [draftVersion, setDraftVersion] =
    useState<WorkflowVersionSummary | null>(null);
  const [status, setStatus] = useState("");
  const versionsQuery = useQuery({
    queryFn: () =>
      workflowService.listWorkflowVersions(workflowId, {
        perPage: 50,
        status: status || undefined,
      }),
    queryKey: [...QUERY_KEYS.workflowVersions(workflowId), status],
  });
  const detailQuery = useQuery({
    enabled: Boolean(selectedVersionId),
    queryFn: () =>
      workflowService.getWorkflowVersion(selectedVersionId as string),
    queryKey: selectedVersionId
      ? QUERY_KEYS.workflowVersionDetails(selectedVersionId)
      : ["workflows", "version", "empty"],
  });
  const draftMutation = useMutation({
    mutationFn: (values: WorkflowDraftFormValues) =>
      workflowService.createDraftVersion(workflowId, {
        changeDescription: values.changeDescription.trim() || null,
        sourceVersionId: values.sourceVersionId,
      }),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: async (version) => {
      toast.success(
        `Versión v${version.versionNumber}.0 creada como borrador.`,
      );
      setDraftVersion(null);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workflowVersions(workflowId),
      });
    },
  });

  const rows = versionsQuery.data?.data ?? [];
  const identity = rows[0]?.definition;
  const definitionStatus = identity?.status;

  return (
    <div className="space-y-6">
      <section className="nibol-panel flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="nibol-btn-ghost px-0 py-0 text-sm"
              href={`/configuracion/flujos/${workflowId}`}
            >
              <ArrowLeft className="h-4 w-4" /> Volver al flujo
            </Link>
            {identity ? (
              <>
                <span className={getStatusBadgeClass(identity.status)}>
                  {formatVersionStatus(identity.status)}
                </span>
                <span className="text-sm text-[var(--muted)]">
                  {identity.activeVersion
                    ? `Activa: v${identity.activeVersion.versionNumber}.0`
                    : "Sin versión activa"}
                </span>
              </>
            ) : null}
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-3xl leading-none font-bold tracking-[-0.03em] uppercase">
              {identity?.name ?? "Historial del flujo"}
            </h2>
            <p className="text-sm leading-7 text-[var(--foreground-soft)]">
              {identity
                ? `${formatProcessType(identity.processType)} · Versiones ordenadas de la más reciente a la más antigua.`
                : "Consulte los cambios y estados registrados para esta definición."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="workflow-version-status">
            Filtrar por estado
          </label>
          <select
            className="nibol-field h-11 w-48"
            id="workflow-version-status"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="">Todos los estados</option>
            <option value="DRAFT">Borradores</option>
            <option value="PUBLISHED">Publicadas</option>
            <option value="INACTIVE">Inactivas</option>
            <option value="ARCHIVED">Archivadas</option>
          </select>
          <button
            className="nibol-btn-secondary h-11"
            disabled={versionsQuery.isFetching}
            onClick={() => {
              void versionsQuery.refetch();
            }}
            type="button"
          >
            <RefreshCcw className="h-4 w-4" /> Actualizar
          </button>
        </div>
      </section>

      {definitionStatus === "ARCHIVED" ? (
        <div className="flex items-start gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-sm leading-6 text-[var(--foreground-soft)]">
          <History className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
          <p>
            Este workflow está archivado. Sus versiones pueden consultarse, pero
            no se pueden crear nuevos borradores.
          </p>
        </div>
      ) : null}

      {versionsQuery.isError ? (
        <ErrorState
          action={
            <button
              className="nibol-btn-secondary"
              onClick={() => {
                void versionsQuery.refetch();
              }}
              type="button"
            >
              <RefreshCcw className="h-4 w-4" /> Reintentar
            </button>
          }
          description={versionsQuery.error.message}
          title="No fue posible cargar las versiones"
        />
      ) : versionsQuery.isLoading ? (
        <VersionsSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          description={
            status
              ? "Pruebe con otro estado para ver las versiones disponibles."
              : "Este workflow todavía no tiene versiones registradas."
          }
          icon={History}
          title="No hay versiones para mostrar"
        />
      ) : (
        <section className="relative border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[74rem] border-separate border-spacing-0">
              <thead className="bg-[var(--secondary)] text-left text-sm text-slate-100">
                <tr>
                  {[
                    "Versión",
                    "Estado",
                    "Descripción del cambio",
                    "Creado por",
                    "Fecha de creación",
                    "Publicado por",
                    "Fecha de publicación",
                    "Instancias",
                    "Acciones",
                  ].map((heading) => (
                    <th
                      className="border-b border-white/8 px-4 py-4 first:pl-5 last:pr-5"
                      key={heading}
                    >
                      <span className="font-semibold">{heading}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((version) => (
                  <VersionRow
                    canCreateDraft={
                      canCreateDraft && definitionStatus !== "ARCHIVED"
                    }
                    canSimulate={canSimulate}
                    key={version.id}
                    onDraft={setDraftVersion}
                    onView={setSelectedVersionId}
                    version={version}
                    workflowId={workflowId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <VersionDetailDialog
        onClose={() => setSelectedVersionId(null)}
        open={Boolean(selectedVersionId)}
        pending={detailQuery.isLoading}
        version={detailQuery.data ?? null}
        canSimulate={canSimulate}
        workflowId={workflowId}
      />
      <CreateDraftDialog
        onClose={() => setDraftVersion(null)}
        onSubmit={async (values) => {
          await draftMutation.mutateAsync(values);
        }}
        open={Boolean(draftVersion)}
        pending={draftMutation.isPending}
        version={draftVersion}
      />
    </div>
  );
}

function VersionRow({
  canCreateDraft,
  canSimulate,
  onDraft,
  onView,
  version,
  workflowId,
}: {
  canCreateDraft: boolean;
  canSimulate: boolean;
  onDraft: (version: WorkflowVersionSummary) => void;
  onView: (versionId: string) => void;
  version: WorkflowVersionSummary;
  workflowId: string;
}) {
  return (
    <tr className="text-sm transition hover:bg-[var(--surface-soft)]">
      <td className="border-b border-[var(--border)] px-4 py-4 align-top first:pl-5">
        <button
          className="flex items-center gap-2 font-semibold text-[var(--foreground)] hover:underline"
          onClick={() => onView(version.id)}
          type="button"
        >
          <span className="flex h-8 w-8 items-center justify-center bg-[var(--primary-soft)] text-xs text-[var(--primary)]">
            v{version.versionNumber}
          </span>
          v{version.versionNumber}.0
        </button>
      </td>
      <td className="border-b border-[var(--border)] px-4 py-4 align-top">
        <span className={getStatusBadgeClass(version.status)}>
          {formatVersionStatus(version.status)}
        </span>
      </td>
      <td className="max-w-[18rem] border-b border-[var(--border)] px-4 py-4 align-top text-[var(--foreground-soft)]">
        {version.changeDescription || "Sin descripción de cambio."}
      </td>
      <td className="border-b border-[var(--border)] px-4 py-4 align-top text-[var(--foreground-soft)]">
        {formatUser(version.createdBy)}
      </td>
      <td className="border-b border-[var(--border)] px-4 py-4 align-top whitespace-nowrap text-[var(--foreground-soft)]">
        {formatDate(version.createdAt)}
      </td>
      <td className="border-b border-[var(--border)] px-4 py-4 align-top text-[var(--foreground-soft)]">
        {formatUser(version.publishedBy)}
      </td>
      <td className="border-b border-[var(--border)] px-4 py-4 align-top whitespace-nowrap text-[var(--foreground-soft)]">
        {formatDate(version.publishedAt)}
      </td>
      <td className="border-b border-[var(--border)] px-4 py-4 align-top font-semibold text-[var(--foreground)]">
        {version._count?.instances ?? 0}
      </td>
      <td className="border-b border-[var(--border)] px-4 py-4 align-top last:pr-5">
        <div className="flex flex-wrap gap-2">
          <button
            className="nibol-btn-ghost px-2 py-2 text-xs"
            onClick={() => onView(version.id)}
            type="button"
          >
            <Eye className="h-4 w-4" /> Ver
          </button>
          {version.status === "DRAFT" && canCreateDraft ? (
            <Link
              className="nibol-btn-ghost px-2 py-2 text-xs"
              href={`/configuracion/flujos/${workflowId}/versiones/${version.id}/disenador`}
            >
              <FilePenLine className="h-4 w-4" /> Continuar al diseñador
            </Link>
          ) : null}
          {canCreateDraft ? (
            <button
              className="nibol-btn-ghost px-2 py-2 text-xs"
              onClick={() => onDraft(version)}
              type="button"
            >
              <Copy className="h-4 w-4" /> Crear borrador
            </button>
          ) : null}
          <span className="nibol-btn-ghost cursor-not-allowed px-2 py-2 text-xs text-[var(--muted)]">
            Comparar después
          </span>
          {canSimulate ? (
            <Link
              className="nibol-btn-ghost px-2 py-2 text-xs"
              href={`/configuracion/flujos/${workflowId}/versiones/${version.id}/simulacion`}
            >
              <Route className="h-4 w-4" /> Simular
            </Link>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function CreateDraftDialog({
  onClose,
  onSubmit,
  open,
  pending,
  version,
}: {
  onClose: () => void;
  onSubmit: (values: WorkflowDraftFormValues) => Promise<void>;
  open: boolean;
  pending: boolean;
  version: WorkflowVersionSummary | null;
}) {
  const form = useForm<WorkflowDraftFormValues>({
    defaultValues: {
      changeDescription: "",
      sourceVersionId: version?.id ?? "",
    },
    resolver: zodResolver(
      workflowDraftFormSchema,
    ) as Resolver<WorkflowDraftFormValues>,
  });
  useEffect(() => {
    if (open)
      form.reset({ changeDescription: "", sourceVersionId: version?.id ?? "" });
  }, [form, open, version]);
  return (
    <FormDialog
      description={
        version
          ? `Se clonará v${version.versionNumber}.0 a una nueva versión editable. No se copian instancias ni historial de ejecución.`
          : undefined
      }
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
      title="Crear borrador desde versión"
    >
      <div className="grid gap-5">
        <div className="border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-sm leading-6 text-[var(--foreground-soft)]">
          <div className="flex gap-3">
            <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
            <span>
              Contenido normalizado, referencias internas y condiciones se
              copian dentro de una transacción segura.
            </span>
          </div>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground-soft)]">
            Descripción del cambio
          </span>
          <textarea
            className="nibol-field h-auto min-h-32 py-3"
            disabled={pending}
            placeholder="Qué se preparará en este borrador."
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

function VersionDetailDialog({
  canSimulate,
  onClose,
  open,
  pending,
  version,
  workflowId,
}: {
  canSimulate: boolean;
  onClose: () => void;
  open: boolean;
  pending: boolean;
  version: WorkflowVersionDetail | null;
  workflowId: string;
}) {
  return (
    <FormDialog
      description={
        version
          ? `v${version.versionNumber}.0 · ${formatVersionStatus(version.status)} · creada por ${formatUser(version.createdBy)}`
          : "Cargando metadatos de versión."
      }
      footer={
        <div className="flex justify-end">
          <button className="nibol-btn-primary" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
      }
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      open={open}
      title={
        version ? `Versión v${version.versionNumber}.0` : "Detalle de versión"
      }
    >
      {pending || !version ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-[var(--border)]" />
          <div className="h-24 bg-[var(--border)]" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric
              label="Estado"
              value={formatVersionStatus(version.status)}
            />
            <Metric
              label="Activa"
              value={
                version.definition.activeVersion?.id === version.id
                  ? "Sí · versión de ejecución"
                  : "No"
              }
            />
            <Metric label="Creado" value={formatDate(version.createdAt)} />
            <Metric
              label="Publicado"
              value={
                version.publishedAt
                  ? `${formatUser(version.publishedBy)} · ${formatDate(version.publishedAt)}`
                  : "No publicada"
              }
            />
            <Metric
              label="Editable"
              value={
                version.status === "DRAFT"
                  ? "Sí · borrador"
                  : "No · versión inmutable"
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Nodos" value={String(version.counts.nodes)} />
            <Metric
              label="Transiciones"
              value={String(version.counts.transitions)}
            />
            <Metric
              label="Condiciones"
              value={String(version.counts.conditionGroups)}
            />
            <Metric
              label="Instancias"
              value={String(version.counts.instances)}
            />
          </div>
          <div className="border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-sm leading-6 text-[var(--foreground-soft)]">
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
              Descripción del cambio
            </p>
            <p className="mt-2">
              {version.changeDescription || "Sin descripción registrada."}
            </p>
          </div>
          <div className="flex items-start gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-sm leading-6 text-[var(--foreground-soft)]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
            <span>
              {version.status === "DRAFT"
                ? "Esta versión es editable desde el diseñador visual."
                : "Esta versión es inmutable porque está publicada o archivada."}
            </span>
          </div>
          {canSimulate ? (
            <Link
              className="nibol-btn-secondary w-fit"
              href={`/configuracion/flujos/${workflowId}/versiones/${version.id}/simulacion`}
            >
              <Route className="h-4 w-4" /> Abrir simulación
            </Link>
          ) : null}
        </div>
      )}
    </FormDialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 font-semibold text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function VersionsSkeleton() {
  return (
    <section className="border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)]">
      <div className="animate-pulse space-y-3">
        <div className="h-12 bg-[var(--border)]" />
        {Array.from({ length: 5 }, (_, index) => (
          <div className="h-16 bg-[var(--surface-muted)]" key={index} />
        ))}
      </div>
    </section>
  );
}
