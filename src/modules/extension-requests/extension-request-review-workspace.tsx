"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Download,
  FileText,
  History,
  RotateCcw,
  Search,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ErrorState } from "@/components/ui/error-state";
import { buildObservationUrl } from "@/lib/observation-links";
import { extensionRequestService } from "@/services/extension-request-service";
import { progressService } from "@/services/progress-service";
import type { ExtensionRequestDetail } from "@/types";
import { cn, getApiErrorMessage } from "@/utils";

const statusLabels: Record<ExtensionRequestDetail["status"], string> = {
  CANCELLED: "Cancelada",
  DRAFT: "Borrador",
  MANAGER_APPROVED: "Aprobada",
  MANAGER_REJECTED: "Rechazada",
  SENT_TO_MANAGER: "Pendiente",
};

const statusClasses: Record<ExtensionRequestDetail["status"], string> = {
  CANCELLED: "border-stone-200 bg-stone-100 text-stone-600",
  DRAFT: "border-stone-200 bg-stone-50 text-stone-700",
  MANAGER_APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MANAGER_REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  SENT_TO_MANAGER: "border-sky-200 bg-sky-50 text-sky-700",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const fileType = (mimeType: string) => {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLS";
  if (mimeType.includes("word")) return "DOC";
  if (mimeType.startsWith("image/")) return "IMG";
  return "FILE";
};

const uniqueUsers = (
  values: Array<{ id: string; name: string } | null | undefined>,
) =>
  Array.from(
    new Map(
      values
        .filter((value): value is { id: string; name: string } =>
          Boolean(value),
        )
        .map((value) => [value.id, value]),
    ).values(),
  ).sort((left, right) => left.name.localeCompare(right.name));

type ExtensionRequestReviewDetailProps = {
  canApprove: boolean;
  canReject: boolean;
  comment: string;
  error: string | null;
  isProcessing: boolean;
  onApprove: () => void;
  onCommentChange: (value: string) => void;
  onDownload: (file: { downloadPath: string; originalName: string }) => void;
  onReject: () => void;
  request: ExtensionRequestDetail;
};

export function ExtensionRequestReviewDetail({
  canApprove,
  canReject,
  comment,
  error,
  isProcessing,
  onApprove,
  onCommentChange,
  onDownload,
  onReject,
  request,
}: ExtensionRequestReviewDetailProps) {
  const responsible =
    request.observationArea?.areaResponsible ??
    request.actionPlan?.observationArea.areaResponsible ??
    null;
  const area =
    request.observationArea?.area ?? request.actionPlan?.observationArea.area;
  const canDecide =
    request.status === "SENT_TO_MANAGER" &&
    Boolean(request.reviewTask?.canAct) &&
    (canApprove || canReject);
  const canApproveRequest =
    canDecide &&
    canApprove &&
    Boolean(request.reviewTask?.allowedActions.includes("APPROVE"));
  const canRejectRequest =
    canDecide &&
    canReject &&
    Boolean(request.reviewTask?.allowedActions.includes("REJECT"));
  const observationHref = request.observation
    ? buildObservationUrl({
        observationId: request.observation.id,
        planId: request.actionPlan?.id,
        tab: "plans",
      })
    : null;

  return (
    <article className="min-w-0 space-y-5">
      <section className="nibol-panel overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--primary)] p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.18em] text-white/60 uppercase">
                {request.observation?.displayCode ?? "Solicitud de ampliación"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {request.actionPlan?.title ?? "Ampliación de plazo"}
              </h2>
              {request.observation ? (
                <Link
                  className="mt-2 inline-flex text-sm text-white/70 hover:text-white hover:underline"
                  href={
                    observationHref ??
                    `/observaciones/${request.observation.id}`
                  }
                >
                  Ver observación · {request.observation.title}
                </Link>
              ) : null}
            </div>
            <span className={cn("nibol-badge", statusClasses[request.status])}>
              {statusLabels[request.status]}
            </span>
          </div>
        </div>
        <dl className="grid gap-px bg-[var(--border)] sm:grid-cols-4">
          {[
            [
              "Fecha original",
              request.actionPlan?.originalDueDate ?? request.previousDueDate,
            ],
            ["Fecha actual", request.effectiveDueDate],
            ["Fecha propuesta", request.proposedDueDate],
            ["Duración", `+${request.impactDays} días`],
          ].map(([label, value]) => (
            <div className="bg-white p-4" key={label}>
              <dt className="text-xs font-bold tracking-wider text-stone-500 uppercase">
                {label}
              </dt>
              <dd className="mt-2 font-semibold">
                {label === "Duración" ? value : formatDate(value)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="nibol-panel p-5">
          <p className="nibol-eyebrow">Solicitud</p>
          <h3 className="mt-2 text-lg font-semibold">Justificación</h3>
          <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-[var(--foreground-soft)]">
            {request.reason}
          </p>
          <dl className="mt-5 grid gap-4 border-t border-stone-200 pt-5 text-sm">
            <div>
              <dt className="text-stone-500">Solicitante</dt>
              <dd className="mt-1 font-semibold">
                {request.requestedByUser.name}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Registrada</dt>
              <dd className="mt-1 font-semibold">
                {formatDateTime(request.createdAt)}
              </dd>
            </div>
            {request.classification ? (
              <div>
                <dt className="text-stone-500">Clasificación</dt>
                <dd className="mt-1 font-semibold">
                  {request.classification.name}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div className="nibol-panel p-5">
          <div className="flex items-start gap-3">
            <UserRound className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="nibol-eyebrow">Responsabilidad</p>
              <h3 className="mt-2 text-lg font-semibold">Área y personas</h3>
            </div>
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-stone-500">Área</dt>
              <dd className="mt-1 font-semibold">
                {area?.name ?? "No especificada"}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Responsable de área</dt>
              <dd className="mt-1 font-semibold">
                {responsible?.name ?? "No especificado"}
              </dd>
            </div>
            {request.actionPlan ? (
              <div>
                <dt className="text-stone-500">Ejecutor</dt>
                <dd className="mt-1 font-semibold">
                  {request.actionPlan.responsibleUser.name}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      {request.actionPlan ? (
        <section className="nibol-panel p-5">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="nibol-eyebrow">Plan de acción</p>
              <h3 className="mt-2 text-lg font-semibold">Contexto del plan</h3>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--foreground-soft)]">
            {request.actionPlan.description}
          </p>
          {observationHref ? (
            <Link
              className="mt-4 inline-flex text-sm font-semibold text-[var(--primary)] hover:underline"
              href={observationHref}
            >
              Ver plan de acción <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          ) : null}
          <p className="mt-4 text-sm text-stone-500">
            Fecha efectiva:{" "}
            <strong className="text-stone-800">
              {formatDate(request.effectiveDueDate)}
            </strong>
          </p>
        </section>
      ) : null}

      <section className="nibol-panel p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
          <div>
            <p className="nibol-eyebrow">Sustento</p>
            <h3 className="mt-2 text-lg font-semibold">Documentos adjuntos</h3>
          </div>
        </div>
        {request.attachments.length ? (
          <div className="mt-4 divide-y divide-stone-200 border-y border-stone-200">
            {request.attachments.map((file) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 py-3"
                key={file.id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-10 shrink-0 place-items-center border border-stone-200 bg-stone-50 text-[0.62rem] font-bold text-stone-600">
                    {fileType(file.mimeType)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {file.originalName}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {file.uploadedByUser.name} ·{" "}
                      {formatDateTime(file.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  className="nibol-btn-secondary px-3 py-2 text-xs"
                  disabled={isProcessing}
                  onClick={() => onDownload(file)}
                  type="button"
                >
                  <Download className="h-3.5 w-3.5" /> Descargar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500">
            No se adjuntaron documentos.
          </p>
        )}
      </section>

      <section className="nibol-panel p-5">
        <div className="flex items-start gap-3">
          <History className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
          <div>
            <p className="nibol-eyebrow">Decisión</p>
            <h3 className="mt-2 text-lg font-semibold">
              Estado y trazabilidad
            </h3>
          </div>
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Estado de workflow</dt>
            <dd className="mt-1 font-semibold">
              {request.reviewTask
                ? request.reviewTask.id
                  ? `Tarea pendiente · ${request.reviewTask.status}`
                  : "Revisión heredada"
                : request.status === "SENT_TO_MANAGER"
                  ? "Sin tarea disponible para este usuario"
                  : statusLabels[request.status]}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Revisor</dt>
            <dd className="mt-1 font-semibold">
              {request.managerReviewer?.name ?? "Pendiente"}
            </dd>
          </div>
          {request.managerReviewedAt ? (
            <div>
              <dt className="text-stone-500">Fecha de decisión</dt>
              <dd className="mt-1 font-semibold">
                {formatDateTime(request.managerReviewedAt)}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-stone-500">Comentario previo</dt>
            <dd className="mt-1 whitespace-pre-wrap text-stone-700">
              {request.managerComment ?? "Sin comentario"}
            </dd>
          </div>
        </dl>

        {canDecide ? (
          <div className="mt-6 border-t border-stone-200 pt-5">
            <label
              className="grid gap-2 text-sm font-semibold"
              htmlFor="extension-decision-comment"
            >
              Comentario de decisión
              <textarea
                className="nibol-field min-h-24 resize-y py-3"
                disabled={isProcessing}
                id="extension-decision-comment"
                onChange={(event) => onCommentChange(event.target.value)}
                placeholder="Opcional al aprobar; obligatorio al rechazar."
                value={comment}
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              {canApproveRequest ? (
                <button
                  className="nibol-btn-primary px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isProcessing}
                  onClick={onApprove}
                  type="button"
                >
                  <Check className="h-4 w-4" />
                  {isProcessing ? "Procesando…" : "Aprobar"}
                </button>
              ) : null}
              {canRejectRequest ? (
                <button
                  className="nibol-btn-secondary px-4 py-2.5 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isProcessing}
                  onClick={onReject}
                  type="button"
                >
                  <RotateCcw className="h-4 w-4" /> Rechazar
                </button>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-stone-500">
              La decisión se aplica a la solicitud completa; los documentos son
              solo sustento.
            </p>
          </div>
        ) : request.status === "SENT_TO_MANAGER" ? (
          <p className="mt-5 border-t border-stone-200 pt-5 text-sm text-stone-500">
            Esta solicitud está pendiente, pero no tiene una tarea de decisión
            asignada a este usuario.
          </p>
        ) : null}
        {error ? (
          <p
            className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </section>
    </article>
  );
}

export function ExtensionRequestReviewWorkspace({
  canApprove,
  canReject,
  pendingOnly = false,
}: {
  canApprove: boolean;
  canReject: boolean;
  pendingOnly?: boolean;
}) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState(searchParams.get("filter.status") ?? "");
  const [areaId, setAreaId] = useState(searchParams.get("filter.areaId") ?? "");
  const [responsibleUserId, setResponsibleUserId] = useState(
    searchParams.get("filter.responsibleUserId") ?? "",
  );
  const [executorUserId, setExecutorUserId] = useState(
    searchParams.get("filter.executorUserId") ?? "",
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("extensionId"),
  );
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listQuery = useQuery({
    queryFn: () => {
      const params = new URLSearchParams({ perPage: "100" });
      if (pendingOnly) {
        params.set("filter.status", "SENT_TO_MANAGER");
        params.set("reviewQueue", "true");
      } else if (status) params.set("filter.status", status);
      if (areaId) params.set("filter.areaId", areaId);
      if (executorUserId) params.set("filter.executorUserId", executorUserId);
      if (responsibleUserId)
        params.set("filter.responsibleUserId", responsibleUserId);
      if (search.trim()) params.set("search", search.trim());
      return extensionRequestService.list(`?${params.toString()}`);
    },
    queryKey: [
      "extension-requests",
      pendingOnly ? "review" : "all",
      areaId,
      executorUserId,
      responsibleUserId,
      search,
      status,
    ],
  });
  const rows = useMemo(
    () => listQuery.data?.data ?? [],
    [listQuery.data?.data],
  );
  const activeSelectedId =
    selectedId && rows.some((row) => row.id === selectedId)
      ? selectedId
      : (rows[0]?.id ?? null);
  const selectedFromList = rows.find((item) => item.id === activeSelectedId);
  const detailQuery = useQuery({
    enabled: Boolean(activeSelectedId),
    queryFn: () => extensionRequestService.getById(activeSelectedId as string),
    queryKey: ["extension-request", activeSelectedId],
  });
  const detail = detailQuery.data ?? selectedFromList ?? null;
  const areas = useMemo(
    () =>
      Array.from(
        new Map(
          rows
            .map(
              (row) =>
                row.observationArea?.area ??
                row.actionPlan?.observationArea.area,
            )
            .filter(Boolean)
            .map((area) => [area!.id, area!]),
        ).values(),
      ).sort((left, right) => left.name.localeCompare(right.name)),
    [rows],
  );
  const responsibles = useMemo(
    () =>
      uniqueUsers(
        rows.map(
          (row) =>
            row.observationArea?.areaResponsible ??
            row.actionPlan?.observationArea.areaResponsible,
        ),
      ),
    [rows],
  );
  const executors = useMemo(
    () => uniqueUsers(rows.map((row) => row.actionPlan?.responsibleUser)),
    [rows],
  );

  const reviewMutation = useMutation({
    mutationFn: async (input: { action: "approve" | "reject"; id: string }) => {
      if (input.action === "reject")
        return extensionRequestService.managerReject(input.id, {
          comment: comment.trim(),
        });
      return extensionRequestService.managerApprove(input.id, {
        comment: comment.trim() || null,
      });
    },
    onError: (cause) => {
      const message = getApiErrorMessage(cause);
      setError(message);
      toast.error(message);
    },
    onSuccess: async (_, variables) => {
      toast.success(
        variables.action === "approve"
          ? "Solicitud aprobada."
          : "Solicitud rechazada.",
      );
      setComment("");
      setError(null);
      const currentIndex = rows.findIndex((row) => row.id === variables.id);
      setSelectedId(
        rows[currentIndex + 1]?.id ?? rows[currentIndex - 1]?.id ?? null,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["extension-requests"] }),
        queryClient.invalidateQueries({
          queryKey: ["extension-request", variables.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["action-plan"] }),
      ]);
    },
  });
  const download = useMutation({
    mutationFn: (file: { downloadPath: string; originalName: string }) =>
      progressService.downloadEvidence(file),
    onError: (cause) => toast.error(getApiErrorMessage(cause)),
  });

  const decide = (action: "approve" | "reject") => {
    if (!detail) return;
    if (action === "reject" && !comment.trim()) {
      setError("Escriba un comentario para rechazar la solicitud.");
      return;
    }
    const label = action === "approve" ? "aprobar" : "rechazar";
    if (!window.confirm(`¿Confirma ${label} esta solicitud?`)) return;
    setError(null);
    reviewMutation.mutate({ action, id: detail.id });
  };

  if (listQuery.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(listQuery.error)}
        title="No fue posible cargar las solicitudes"
      />
    );

  return (
    <section className="nibol-panel overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-56 flex-1 text-sm font-semibold">
            <span className="sr-only">Buscar solicitudes</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                className="nibol-field pl-10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por observación, plan o motivo…"
                type="search"
                value={search}
              />
            </span>
          </label>
          <label className="grid min-w-40 gap-1 text-xs font-bold tracking-wide text-stone-500 uppercase">
            Estado
            <select
              className="nibol-field h-12"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="">Todos</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid min-w-40 gap-1 text-xs font-bold tracking-wide text-stone-500 uppercase">
            Área
            <select
              className="nibol-field h-12"
              onChange={(event) => setAreaId(event.target.value)}
              value={areaId}
            >
              <option value="">Todas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid min-w-44 gap-1 text-xs font-bold tracking-wide text-stone-500 uppercase">
            Responsable
            <select
              className="nibol-field h-12"
              onChange={(event) => setResponsibleUserId(event.target.value)}
              value={responsibleUserId}
            >
              <option value="">Todos</option>
              {responsibles.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid min-w-44 gap-1 text-xs font-bold tracking-wide text-stone-500 uppercase">
            Ejecutor
            <select
              className="nibol-field h-12"
              onChange={(event) => setExecutorUserId(event.target.value)}
              value={executorUserId}
            >
              <option value="">Todos</option>
              {executors.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid min-h-[38rem] lg:grid-cols-[minmax(20rem,0.7fr)_minmax(0,1.45fr)]">
        <div className="border-b border-[var(--border)] lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
            <p className="text-xs font-bold tracking-[0.16em] text-stone-500 uppercase">
              {pendingOnly ? "Pendientes" : "Solicitudes"}
            </p>
            <span className="text-xs font-semibold text-stone-500">
              {rows.length}
            </span>
          </div>
          {listQuery.isPending ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((item) => (
                <div className="h-24 animate-pulse bg-stone-100" key={item} />
              ))}
            </div>
          ) : rows.length ? (
            <div className="max-h-[58rem] overflow-y-auto">
              {rows.map((row) => {
                const area =
                  row.observationArea?.area ??
                  row.actionPlan?.observationArea.area;
                const selected = row.id === selectedId;
                return (
                  <button
                    aria-pressed={selected}
                    className={cn(
                      "block w-full border-b border-stone-200 p-4 text-left transition hover:bg-[var(--primary-soft)]",
                      selected && "bg-[var(--primary-soft)]",
                    )}
                    key={row.id}
                    onClick={() => {
                      setSelectedId(row.id);
                      setComment("");
                      setError(null);
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold tracking-wide text-[var(--primary)] uppercase">
                          {row.observation?.displayCode ?? "Solicitud"}
                        </p>
                        <p className="mt-1 truncate font-semibold">
                          {row.actionPlan?.title ?? "Ampliación de observación"}
                        </p>
                      </div>
                      <ChevronRight
                        className={cn(
                          "mt-1 h-4 w-4 shrink-0 text-stone-400",
                          selected && "text-[var(--primary)]",
                        )}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-500">
                      <span>{area?.name ?? "Sin área"}</span>
                      <span className="text-right">
                        {formatDate(row.createdAt)}
                      </span>
                      <span>{row.requestedByUser.name}</span>
                      <span className="text-right font-semibold text-stone-700">
                        +{row.impactDays} días
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span
                        className={cn("nibol-badge", statusClasses[row.status])}
                      >
                        {statusLabels[row.status]}
                      </span>
                      <span className="text-xs text-stone-500">
                        {formatDate(row.previousDueDate)} →{" "}
                        {formatDate(row.proposedDueDate)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-stone-500">
              {pendingOnly
                ? "No hay solicitudes de ampliación pendientes."
                : "No hay solicitudes de ampliación."}
            </p>
          )}
        </div>
        <div className="bg-white p-4 sm:p-6">
          {detailQuery.isPending && activeSelectedId ? (
            <div className="h-full min-h-96 animate-pulse bg-stone-100" />
          ) : detailQuery.isError ? (
            <ErrorState
              description={getApiErrorMessage(detailQuery.error)}
              title="No fue posible cargar el detalle"
            />
          ) : detail ? (
            <ExtensionRequestReviewDetail
              canApprove={canApprove}
              canReject={canReject}
              comment={comment}
              error={error}
              isProcessing={reviewMutation.isPending || download.isPending}
              onApprove={() => decide("approve")}
              onCommentChange={setComment}
              onDownload={(file) => download.mutate(file)}
              onReject={() => decide("reject")}
              request={detail}
            />
          ) : (
            <div className="grid min-h-96 place-items-center text-center text-sm text-stone-500">
              Seleccione una solicitud para revisar.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
