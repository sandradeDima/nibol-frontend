"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { QUERY_KEYS } from "@/lib/constants";
import {
  formatDate,
  formatProcessType,
} from "@/modules/workflows/presentation";
import { workflowRuntimeService } from "@/services/workflow-runtime-service";
import { getApiErrorMessage } from "@/utils";

const PROCESS_OPTIONS = [
  ["", "Todos los procesos"],
  ["DEADLINE_EXTENSION", "Ampliación de plazo"],
  ["OBSERVATION_CLOSURE", "Cierre de observación"],
  ["REMEDIATION_PLAN_APPROVAL", "Plan de remediación"],
  ["EVIDENCE_REVIEW", "Revisión de evidencias"],
  ["SPECIAL_REQUEST", "Solicitud especial"],
] as const;

const DUE_OPTIONS = [
  ["ALL", "Todos los vencimientos"],
  ["ON_TIME", "En plazo"],
  ["DUE_SOON", "Próximas a vencer"],
  ["OVERDUE", "Vencidas"],
  ["NO_SLA", "Sin SLA"],
] as const;

const DUE_LABELS: Record<string, string> = {
  DUE_SOON: "Próxima",
  NO_SLA: "Sin SLA",
  ON_TIME: "En plazo",
  OVERDUE: "Vencida",
};

const ACTION_LABELS: Record<string, string> = {
  APPROVE: "Aprobar",
  COMPLETE: "Completar",
  OBSERVE: "Observar",
  REJECT: "Rechazar",
  REQUEST_CORRECTION: "Solicitar corrección",
};

export function WorkflowTaskInbox() {
  const [dueState, setDueState] = useState<
    "ALL" | "DUE_SOON" | "NO_SLA" | "ON_TIME" | "OVERDUE"
  >("ALL");
  const [page, setPage] = useState(1);
  const [processType, setProcessType] = useState("");
  const [search, setSearch] = useState("");
  const params = useMemo(
    () => ({
      dueState,
      page,
      perPage: 20,
      ...(processType ? { processType } : {}),
      search: search.trim(),
    }),
    [dueState, page, processType, search],
  );
  const query = useQuery({
    queryFn: () => workflowRuntimeService.listMyPending(params),
    queryKey: [QUERY_KEYS.workflowTasks, params],
  });

  return (
    <section className="space-y-5">
      <div className="nibol-panel grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_15rem_15rem]">
        <label className="relative block">
          <span className="sr-only">Buscar tarea</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="nibol-field pl-10"
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Buscar por registro, flujo o solicitante"
            value={search}
          />
        </label>
        <label>
          <span className="mb-2 block text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
            Proceso
          </span>
          <select
            className="nibol-field"
            onChange={(event) => {
              setPage(1);
              setProcessType(event.target.value);
            }}
            value={processType}
          >
            {PROCESS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
            Vencimiento
          </span>
          <select
            className="nibol-field"
            onChange={(event) => {
              setPage(1);
              setDueState(event.target.value as typeof dueState);
            }}
            value={dueState}
          >
            {DUE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3 text-sm text-[var(--foreground-soft)]">
        <SlidersHorizontal className="h-4 w-4 text-[var(--primary)]" />
        <span>
          {query.data
            ? `${query.data.pagination.total} tarea${query.data.pagination.total === 1 ? "" : "s"} pendiente${query.data.pagination.total === 1 ? "" : "s"}`
            : "Cargando tareas…"}
        </span>
      </div>

      {query.isPending ? (
        <div className="nibol-panel h-80 animate-pulse bg-[var(--surface-muted)]" />
      ) : query.isError ? (
        <ErrorState
          description={getApiErrorMessage(query.error)}
          title="No fue posible cargar las tareas"
        />
      ) : query.data.data.length === 0 ? (
        <EmptyState
          description="No hay tareas de workflow que coincidan con los filtros actuales."
          title="Bandeja al día"
        />
      ) : (
        <div className="nibol-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[62rem] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-soft)] text-xs tracking-[0.12em] text-[var(--muted)] uppercase">
                <tr>
                  <th className="px-5 py-4">Proceso</th>
                  <th className="px-5 py-4">Registro</th>
                  <th className="px-5 py-4">Flujo / etapa</th>
                  <th className="px-5 py-4">Solicitante</th>
                  <th className="px-5 py-4">Asignación</th>
                  <th className="px-5 py-4">Fecha límite</th>
                  <th className="px-5 py-4">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {query.data.data.map((task) => (
                  <tr
                    className="align-top transition hover:bg-[var(--surface-soft)]"
                    key={task.id}
                  >
                    <td className="px-5 py-5 font-semibold text-[var(--foreground)]">
                      {formatProcessType(task.instance.processType)}
                    </td>
                    <td className="px-5 py-5">
                      <p className="font-semibold text-[var(--foreground)]">
                        {task.instance.specialRequest?.title ??
                          task.instance.evidenceReview?.originalName ??
                          task.instance.entityId}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {task.instance.specialRequest?.reference ??
                          task.instance.evidenceReview?.context ??
                          task.instance.entityType}
                      </p>
                    </td>
                    <td className="px-5 py-5">
                      <p className="font-semibold text-[var(--foreground)]">
                        {task.instance.workflow.name}
                      </p>
                      <p className="mt-1 text-xs text-[var(--foreground-soft)]">
                        {task.node.name}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        v{task.instance.version.versionNumber}.0 · visita{" "}
                        {task.entrySequence}
                      </p>
                    </td>
                    <td className="px-5 py-5 text-[var(--foreground-soft)]">
                      {task.instance.startedBy.name}
                    </td>
                    <td className="px-5 py-5">
                      <p className="text-[var(--foreground-soft)]">
                        {task.assignedUser?.name ??
                          task.assignedRole?.name ??
                          task.assignedArea?.name ??
                          "Asignación pendiente"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {task.assignmentStrategy}
                      </p>
                    </td>
                    <td className="px-5 py-5">
                      <p className="text-[var(--foreground-soft)]">
                        {formatDate(task.dueAt)}
                      </p>
                      <span
                        className={`mt-2 inline-flex px-2 py-1 text-[0.68rem] font-semibold tracking-[0.12em] uppercase ${task.dueState === "OVERDUE" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-[var(--primary-soft)] text-[var(--primary)]"}`}
                      >
                        {DUE_LABELS[task.dueState] ?? task.dueState}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <Link
                        className="inline-flex items-center gap-2 font-semibold text-[var(--primary)] hover:underline"
                        href={`/aprobaciones/flujos/${task.id}`}
                      >
                        {ACTION_LABELS[task.allowedActions[0] ?? ""] ??
                          "Revisar"}
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DataTablePagination
            onPageSizeChange={() => undefined}
            onPageChange={setPage}
            page={query.data.pagination.page}
            pageSize={query.data.pagination.perPage}
            pageSizeOptions={[20]}
            total={query.data.pagination.total}
          />
        </div>
      )}
    </section>
  );
}
