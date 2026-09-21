"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronRight,
  Download,
  FileText,
  History,
  Search,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ErrorState } from "@/components/ui/error-state";
import { buildObservationUrl } from "@/lib/observation-links";
import { progressService } from "@/services/progress-service";
import type { ActionPlanStatus, ProgressEvaluationItem } from "@/types";
import { cn, getApiErrorMessage } from "@/utils";

import {
  formatFileSize,
  formatProgressDate,
  getProgressStatusClasses,
  getProgressStatusLabel,
  getProgressTypeLabel,
} from "./presentation";
import {
  getActionPlanStatusClasses,
  getActionPlanStatusLabel,
} from "../remediation/presentation";
import {
  ProgressReviewDecisionPanel,
  useProgressReviewDecision,
} from "./progress-review-decision";

const typeLabels: Record<ProgressEvaluationItem["type"], string> = {
  ADVANCE: "Avance",
  FINALIZATION: "Finalización",
};

const formatDateOnly = (value: string) =>
  new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));

const fileType = (mimeType: string) => {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLS";
  if (mimeType.includes("word")) return "DOC";
  if (mimeType.startsWith("image/")) return "IMG";
  return "FILE";
};

type ProgressReviewDetailProps = {
  canApprove: boolean;
  canReturn: boolean;
  comment: string;
  error: string | null;
  isProcessing: boolean;
  onApprove: () => void;
  onCommentChange: (value: string) => void;
  onDownload: (file: { downloadPath: string; originalName: string }) => void;
  onReturn: () => void;
  onStatusChange: (status: ActionPlanStatus) => void;
  selectedStatus: ActionPlanStatus;
  item: ProgressEvaluationItem;
};

export function ProgressReviewDetail({
  canApprove,
  canReturn,
  comment,
  error,
  isProcessing,
  onApprove,
  onCommentChange,
  onDownload,
  onReturn,
  onStatusChange,
  selectedStatus,
  item,
}: ProgressReviewDetailProps) {
  const task = item.reviewTask;
  const observationHref = buildObservationUrl({
    advanceId: item.id,
    observationId: item.observation.id,
    planId: item.actionPlan.id,
    tab: "plans",
  });
  return (
    <article className="min-w-0 space-y-5">
      <section className="nibol-panel overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--primary)] p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <Link
                className="text-xs font-bold tracking-[0.18em] text-white/60 uppercase hover:text-white hover:underline"
                href={observationHref}
              >
                {item.observation.displayCode}
              </Link>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {item.actionPlan.title}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {item.observation.title}
              </p>
            </div>
            <span
              className={cn(
                "nibol-badge",
                getProgressStatusClasses(item.reviewStatus),
              )}
            >
              {getProgressStatusLabel(item.reviewStatus)}
            </span>
          </div>
        </div>
        <div className="grid gap-px bg-[var(--border)] sm:grid-cols-4">
          <div className="bg-white p-4">
            <p className="text-xs font-bold tracking-wider text-stone-500 uppercase">
              Avance actual
            </p>
            <p className="mt-2 text-xl font-semibold">
              {item.officialProgressPercent}%
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {getActionPlanStatusLabel(item.officialStatus)}
            </p>
          </div>
          <div className="bg-white p-4">
            <p className="text-xs font-bold tracking-wider text-stone-500 uppercase">
              Avance enviado
            </p>
            <p className="mt-2 text-xl font-semibold">
              {item.reportedProgressPercent ?? 0}%
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {typeLabels[item.type]}
            </p>
          </div>
          <div className="bg-white p-4">
            <p className="text-xs font-bold tracking-wider text-stone-500 uppercase">
              Fecha de envío
            </p>
            <p className="mt-2 font-semibold">
              {formatDateOnly(item.submittedAt)}
            </p>
          </div>
          <div className="bg-white p-4">
            <p className="text-xs font-bold tracking-wider text-stone-500 uppercase">
              Fecha efectiva
            </p>
            <p className="mt-2 font-semibold">
              {formatDateOnly(item.effectiveDueDate)}
            </p>
            <p
              className={cn(
                "mt-1 text-xs font-semibold",
                item.deadlineStatus === "VENCIDO"
                  ? "text-rose-700"
                  : "text-emerald-700",
              )}
            >
              {item.deadlineStatus === "VENCIDO" ? "Vencido" : "Vigente"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="nibol-panel p-5">
          <p className="nibol-eyebrow">Contexto del plan</p>
          <h3 className="mt-2 text-lg font-semibold">Descripción</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">
            {item.actionPlan.description}
          </p>
          <Link
            className="mt-4 inline-flex text-sm font-semibold text-[var(--primary)] hover:underline"
            href={observationHref}
          >
            Ver observación y plan <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="nibol-panel p-5">
          <div className="flex items-start gap-3">
            <UserRound className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="nibol-eyebrow">Responsabilidad</p>
              <h3 className="mt-2 text-lg font-semibold">Personas a cargo</h3>
            </div>
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-stone-500">Ejecutor</dt>
              <dd className="mt-1 font-semibold">
                {item.actionPlan.responsibleUser.name}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Responsable de área</dt>
              <dd className="mt-1 font-semibold">
                {item.actionPlan.areaResponsible.name}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Área</dt>
              <dd className="mt-1 font-semibold">
                {item.actionPlan.area.name}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="nibol-panel p-5">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
          <div>
            <p className="nibol-eyebrow">Entrega</p>
            <h3 className="mt-2 text-lg font-semibold">Avance reportado</h3>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 whitespace-pre-wrap text-[var(--foreground-soft)]">
          {item.comment}
        </p>
        <dl className="mt-5 grid gap-4 border-t border-stone-200 pt-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-stone-500">Tipo</dt>
            <dd className="mt-1 font-semibold">
              {getProgressTypeLabel(item.type)}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Enviado por</dt>
            <dd className="mt-1 font-semibold">{item.submittedByUser.name}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Última actualización</dt>
            <dd className="mt-1 font-semibold">
              {formatProgressDate(item.updatedAt)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="nibol-panel p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
          <div>
            <p className="nibol-eyebrow">Sustento</p>
            <h3 className="mt-2 text-lg font-semibold">Evidencia del avance</h3>
          </div>
        </div>
        {item.evidence.length ? (
          <div className="mt-4 divide-y divide-stone-200 border-y border-stone-200">
            {item.evidence.map((file) => (
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
                      {file.uploadedByUser?.name ?? "Usuario"} ·{" "}
                      {formatProgressDate(file.createdAt, false)} ·{" "}
                      {formatFileSize(file.sizeBytes)}
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
            No se adjuntaron documentos. La finalización no requiere un archivo
            por sí misma.
          </p>
        )}
        <p className="mt-4 text-xs font-semibold tracking-wide text-stone-500 uppercase">
          La decisión corresponde al Plan / Avance, no a cada archivo.
        </p>
      </section>

      <section className="nibol-panel p-5">
        <div className="flex items-start gap-3">
          <History className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
          <div>
            <p className="nibol-eyebrow">Historial</p>
            <h3 className="mt-2 text-lg font-semibold">Revisión y workflow</h3>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {item.history.length ? (
            item.history.map((entry) => (
              <div
                className="border-b border-stone-200 pb-3 text-sm last:border-b-0"
                key={entry.id}
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-semibold">{entry.user.name}</span>
                  <span className="text-xs text-stone-500">
                    {formatProgressDate(entry.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-stone-600">
                  {entry.action === "SENT"
                    ? "Enviado a revisión"
                    : entry.action === "APPROVED"
                      ? "Aprobado"
                      : "Devuelto"}
                  {entry.comment ? ` · ${entry.comment}` : ""}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-stone-500">Sin decisiones previas.</p>
          )}
        </div>
        <div className="mt-4 border-t border-stone-200 pt-4 text-sm">
          <span className="text-stone-500">Tarea actual: </span>
          <strong>
            {task?.id
              ? `${task.status} · asignada`
              : task
                ? "Revisión heredada"
                : "No asignada a este usuario"}
          </strong>
          {item.workflowInstanceId ? (
            <Link
              className="ml-3 font-semibold text-[var(--primary)] hover:underline"
              href={`/configuracion/flujos/instancias/${item.workflowInstanceId}`}
            >
              Ver ejecución
            </Link>
          ) : null}
        </div>

        <ProgressReviewDecisionPanel
          canApprove={canApprove}
          canReturn={canReturn}
          comment={comment}
          error={error}
          isProcessing={isProcessing}
          item={item}
          onApprove={onApprove}
          onCommentChange={onCommentChange}
          onReturn={onReturn}
          onStatusChange={onStatusChange}
          selectedStatus={selectedStatus}
        />
      </section>
    </article>
  );
}

export function ProgressReviewWorkspace({
  canApprove,
  canReturn,
}: {
  canApprove: boolean;
  canReturn: boolean;
}) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [areaId, setAreaId] = useState(searchParams.get("filter.areaId") ?? "");
  const [responsibleUserId, setResponsibleUserId] = useState(
    searchParams.get("filter.responsibleUserId") ?? "",
  );
  const [type, setType] = useState<ProgressEvaluationItem["type"] | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("advanceId"),
  );
  const listQuery = useQuery({
    queryFn: () => {
      const params = new URLSearchParams({
        "filter.reviewStatus": "SENT_TO_AUDIT",
        perPage: "100",
        reviewQueue: "true",
      });
      if (areaId) params.set("filter.areaId", areaId);
      if (responsibleUserId)
        params.set("filter.responsibleUserId", responsibleUserId);
      if (search.trim()) params.set("search", search.trim());
      return progressService.listProgressEvaluations(`?${params.toString()}`);
    },
    queryKey: [
      "progress-evaluations",
      "review",
      areaId,
      responsibleUserId,
      search,
    ],
  });
  const rows = useMemo(
    () =>
      (listQuery.data?.data ?? []).filter(
        (item) => !type || item.type === type,
      ),
    [listQuery.data?.data, type],
  );
  const activeSelectedId =
    selectedId && rows.some((row) => row.id === selectedId)
      ? selectedId
      : (rows[0]?.id ?? null);
  const selectedFromList = rows.find((item) => item.id === activeSelectedId);
  const detailQuery = useQuery({
    enabled: Boolean(activeSelectedId),
    queryFn: () =>
      progressService.getProgressEvaluation(activeSelectedId as string),
    queryKey: ["progress-evaluation", activeSelectedId],
  });
  const detail = detailQuery.data ?? selectedFromList ?? null;
  const decision = useProgressReviewDecision({
    canApprove,
    canReturn,
    item: detail,
    onDecision: async ({ id }) => {
      const currentIndex = rows.findIndex((row) => row.id === id);
      setSelectedId(
        rows[currentIndex + 1]?.id ?? rows[currentIndex - 1]?.id ?? null,
      );
    },
  });
  const areas = useMemo(
    () =>
      Array.from(
        new Map(
          (listQuery.data?.data ?? []).map((item) => [
            item.actionPlan.area.id,
            item.actionPlan.area,
          ]),
        ).values(),
      ).sort((left, right) => left.name.localeCompare(right.name)),
    [listQuery.data?.data],
  );
  const executors = useMemo(
    () =>
      Array.from(
        new Map(
          (listQuery.data?.data ?? []).map((item) => [
            item.actionPlan.responsibleUser.id,
            item.actionPlan.responsibleUser,
          ]),
        ).values(),
      ).sort((left, right) => left.name.localeCompare(right.name)),
    [listQuery.data?.data],
  );

  const download = useMutation({
    mutationFn: (file: { downloadPath: string; originalName: string }) =>
      progressService.downloadEvidence(file),
    onError: (cause) => toast.error(getApiErrorMessage(cause)),
  });
  if (listQuery.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(listQuery.error)}
        title="No fue posible cargar los avances"
      />
    );

  return (
    <section className="nibol-panel overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-56 flex-1 text-sm font-semibold">
            <span className="sr-only">Buscar avances</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                className="nibol-field pl-9"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por observación, plan o comentario…"
                type="search"
                value={search}
              />
            </span>
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
            Ejecutor
            <select
              className="nibol-field h-12"
              onChange={(event) => setResponsibleUserId(event.target.value)}
              value={responsibleUserId}
            >
              <option value="">Todos</option>
              {executors.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid min-w-40 gap-1 text-xs font-bold tracking-wide text-stone-500 uppercase">
            Tipo
            <select
              className="nibol-field h-12"
              onChange={(event) =>
                setType(
                  event.target.value as ProgressEvaluationItem["type"] | "",
                )
              }
              value={type}
            >
              <option value="">Todos</option>
              <option value="ADVANCE">Avance</option>
              <option value="FINALIZATION">Finalización</option>
            </select>
          </label>
        </div>
      </div>
      <div className="grid min-h-[38rem] lg:grid-cols-[minmax(20rem,0.7fr)_minmax(0,1.45fr)]">
        <div className="border-b border-[var(--border)] lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
            <p className="text-xs font-bold tracking-[0.16em] text-stone-500 uppercase">
              Avances pendientes
            </p>
            <span className="text-xs font-semibold text-stone-500">
              {rows.length}
            </span>
          </div>
          {listQuery.isPending ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((item) => (
                <div className="h-28 animate-pulse bg-stone-100" key={item} />
              ))}
            </div>
          ) : rows.length ? (
            <div className="max-h-[58rem] overflow-y-auto">
              {rows.map((row) => {
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
                      decision.reset();
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold tracking-wide text-[var(--primary)] uppercase">
                          {row.observation.displayCode}
                        </p>
                        <p className="mt-1 truncate font-semibold">
                          {row.actionPlan.title}
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
                      <span>{row.actionPlan.area.name}</span>
                      <span className="text-right">
                        {formatProgressDate(row.submittedAt, false)}
                      </span>
                      <span>{row.actionPlan.responsibleUser.name}</span>
                      <span className="text-right font-semibold text-stone-700">
                        {row.reportedProgressPercent ?? 0}% ·{" "}
                        {getProgressTypeLabel(row.type)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span
                        className={cn(
                          "nibol-badge",
                          getActionPlanStatusClasses(row.officialStatus),
                        )}
                      >
                        {getActionPlanStatusLabel(row.officialStatus)}
                      </span>
                      <span className="text-xs text-stone-500">
                        {formatDateOnly(row.effectiveDueDate)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-stone-500">
              No hay avances pendientes de revisión.
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
            <ProgressReviewDetail
              canApprove={canApprove}
              canReturn={canReturn}
              comment={decision.comment}
              error={decision.error}
              isProcessing={decision.isProcessing || download.isPending}
              item={detail}
              onApprove={() => decision.decide("approve")}
              onCommentChange={decision.setComment}
              onDownload={(file) => download.mutate(file)}
              onReturn={() => decision.decide("return")}
              onStatusChange={decision.setSelectedStatus}
              selectedStatus={decision.decisionStatus}
            />
          ) : (
            <div className="grid min-h-96 place-items-center text-center text-sm text-stone-500">
              Seleccione un avance para revisar.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
