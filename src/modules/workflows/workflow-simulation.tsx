"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheck,
  Clock3,
  GitBranch,
  Play,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import {
  formatProcessType,
  formatVersionStatus,
  getStatusBadgeClass,
} from "@/modules/workflows/presentation";
import { workflowService } from "@/services/workflow-service";
import type {
  WorkflowDesignerValidationIssue,
  WorkflowNode,
  WorkflowSimulationContext,
  WorkflowSimulationInput,
  WorkflowSimulationResult,
} from "@/types";
import { getApiErrorMessage } from "@/utils";

type SimulationContextState = Omit<WorkflowSimulationContext, "processType"> & {
  processType: string;
};

const inputClass = "nibol-field h-11 py-2 text-sm";

const toConfiguration = (node: WorkflowNode) =>
  node.configurationJson as {
    allowedActions?: string[];
    nodeType?: string;
    name?: string;
  };

const issueLabel = (issue: WorkflowDesignerValidationIssue): string =>
  issue.nodeKey ?? issue.nodeId ?? "Grafo";

const totalSlaMinutes = (result: WorkflowSimulationResult | null): number => {
  if (!result) return 0;
  return result.route.reduce((total, step) => {
    if (!step.projectedSla) return total;
    const multiplier =
      step.projectedSla.unit === "MINUTES"
        ? 1
        : step.projectedSla.unit === "HOURS"
          ? 60
          : 1_440;
    return total + step.projectedSla.duration * multiplier;
  }, 0);
};

const formatSla = (minutes: number): string => {
  if (minutes === 0) return "—";
  if (minutes % 1_440 === 0) return `${minutes / 1_440} días`;
  if (minutes % 60 === 0) return `${minutes / 60} horas`;
  return `${minutes} minutos`;
};

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-semibold text-[var(--foreground-soft)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function MetricCard({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "danger" | "neutral" | "success" | "warning";
  value: string | number;
}) {
  const toneClass = {
    danger: "text-[var(--accent)]",
    neutral: "text-[var(--foreground)]",
    success: "text-[var(--success)]",
    warning: "text-[var(--primary)]",
  }[tone];
  return (
    <div className="nibol-panel grid gap-2 p-4">
      <span className="text-[0.68rem] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
        {label}
      </span>
      <strong
        className={`font-display text-3xl font-bold tracking-[-0.03em] ${toneClass}`}
      >
        {value}
      </strong>
    </div>
  );
}

function IssueTable({
  issues,
  onFocus,
}: {
  issues: WorkflowDesignerValidationIssue[];
  onFocus: (issue: WorkflowDesignerValidationIssue) => void;
}) {
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-5 text-sm text-[var(--foreground-soft)]">
        <CircleCheck className="h-5 w-5 text-[var(--success)]" />
        No hay observaciones para este escenario.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[var(--border)]">
      <table className="nibol-table min-w-[48rem]">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Nodo / regla</th>
            <th>Mensaje</th>
            <th>Severidad</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, index) => (
            <tr key={`${issue.code}-${issue.nodeKey ?? "graph"}-${index}`}>
              <td className="font-mono text-xs">{issue.code}</td>
              <td>{issueLabel(issue)}</td>
              <td className="max-w-md whitespace-normal">{issue.message}</td>
              <td>
                <span
                  className={
                    issue.severity === "ERROR"
                      ? "nibol-badge nibol-badge-accent"
                      : "nibol-badge nibol-badge-warning"
                  }
                >
                  {issue.severity === "ERROR" ? "Error" : "Advertencia"}
                </span>
              </td>
              <td>
                {issue.nodeKey ? (
                  <button
                    className="text-xs font-semibold text-[var(--primary)] hover:underline"
                    onClick={() => onFocus(issue)}
                    type="button"
                  >
                    Revisar nodo
                  </button>
                ) : (
                  <span className="text-xs text-[var(--muted)]">
                    Revisar grafo
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RouteTrace({ result }: { result: WorkflowSimulationResult }) {
  return (
    <div className="grid gap-3">
      {result.route.map((step, index) => (
        <div
          className="relative grid gap-3 sm:grid-cols-[2.5rem_minmax(0,1fr)]"
          key={`${step.nodeId}-${step.sequence}`}
        >
          <div className="relative flex justify-center">
            {index < result.route.length - 1 ? (
              <span className="absolute top-10 bottom-[-0.75rem] w-px bg-[var(--border-strong)]" />
            ) : null}
            <span className="relative z-10 flex h-9 w-9 items-center justify-center bg-[var(--primary)] text-sm font-bold text-white">
              {step.sequence}
            </span>
          </div>
          <div className="border border-[var(--border)] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[0.65rem] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
                  {step.nodeType}
                </p>
                <h3 className="mt-1 text-base font-bold text-[var(--foreground)]">
                  {step.nodeName}
                </h3>
              </div>
              {step.selectedDecision ? (
                <span className="nibol-badge nibol-badge-primary">
                  {step.selectedDecision}
                </span>
              ) : null}
            </div>
            {step.evaluationDetails?.length ? (
              <div className="mt-4 grid gap-2">
                {step.evaluationDetails.flatMap((evaluation) =>
                  evaluation.results.map((rule) => (
                    <div
                      className="flex items-start gap-2 text-xs leading-5"
                      key={rule.conditionId}
                    >
                      {rule.matched ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                      ) : (
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                      )}
                      <span className="text-[var(--foreground-soft)]">
                        {rule.message}
                      </span>
                    </div>
                  )),
                )}
              </div>
            ) : null}
            {step.projectedAssignment ? (
              <p className="mt-4 flex items-center gap-2 text-xs text-[var(--foreground-soft)]">
                <UserRound className="h-4 w-4 text-[var(--primary)]" />
                Asignación proyectada: {step.projectedAssignment.kind} ·{" "}
                {step.projectedAssignment.strategy}
              </p>
            ) : null}
            {step.projectedSla ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-[var(--foreground-soft)]">
                <Clock3 className="h-4 w-4 text-[var(--primary)]" />
                SLA proyectado: {step.projectedSla.duration}{" "}
                {step.projectedSla.unit.toLowerCase()}
              </p>
            ) : null}
            {step.projectedNotification ? (
              <p className="mt-2 text-xs text-[var(--foreground-soft)]">
                Notificación proyectada: {step.projectedNotification.template} ·{" "}
                {step.projectedNotification.channel}
              </p>
            ) : null}
            {step.selectedTransition ? (
              <p className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3 text-xs font-semibold text-[var(--primary)]">
                <ArrowRight className="h-4 w-4" />
                {step.selectedTransition.transitionType} →{" "}
                {step.selectedTransition.targetNodeKey}
              </p>
            ) : null}
            {step.errors.length || step.warnings.length ? (
              <div className="mt-4 grid gap-2">
                {[...step.errors, ...step.warnings].map((item, itemIndex) => (
                  <p
                    className="text-xs leading-5 text-[var(--accent)]"
                    key={`${item.code}-${itemIndex}`}
                  >
                    {item.message}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkflowSimulationWorkspace({
  canPublish,
  versionId,
  workflowId,
}: {
  canPublish: boolean;
  versionId: string;
  workflowId: string;
}) {
  const versionQuery = useQuery({
    queryFn: () => workflowService.getWorkflowVersion(versionId),
    queryKey: QUERY_KEYS.workflowVersionDetails(versionId),
  });
  const optionsQuery = useQuery({
    queryFn: workflowService.getWorkflowDesignerOptions,
    queryKey: QUERY_KEYS.workflowDesignerOptions,
    staleTime: 5 * 60_000,
  });
  const version = versionQuery.data;
  const [scenarioName, setScenarioName] = useState("Escenario de simulación");
  const [context, setContext] = useState<SimulationContextState>({
    areaId: null,
    currentNodeKey: null,
    daysOverdue: null,
    dueDate: null,
    evidenceCount: 0,
    hasEvidence: false,
    observationStatus: null,
    previousDecision: null,
    processType: version?.definition.processType ?? "SPECIAL_REQUEST",
    remediationPlanStatus: null,
    requestType: null,
    requestedExtensionDays: null,
    requesterUserId: null,
    responsibleUserId: null,
    riskLevel: null,
  });
  const [nodeDecisions, setNodeDecisions] = useState<Record<string, string>>(
    {},
  );
  const [result, setResult] = useState<WorkflowSimulationResult | null>(null);

  const updateContext = <K extends keyof SimulationContextState>(
    key: K,
    value: SimulationContextState[K],
  ) => setContext((current) => ({ ...current, [key]: value }));

  const decisionNodes = useMemo(
    () =>
      (version?.nodes ?? []).filter((node) => {
        const configuration = toConfiguration(node);
        return (
          configuration.nodeType === "APPROVAL" ||
          configuration.nodeType === "STAGE"
        );
      }),
    [version?.nodes],
  );

  const simulationMutation = useMutation({
    mutationFn: (input: WorkflowSimulationInput) =>
      workflowService.simulateWorkflowVersion(versionId, input),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: (nextResult) => {
      setResult(nextResult);
      toast[nextResult.success ? "success" : "error"](
        nextResult.success
          ? "La simulación terminó correctamente."
          : "La simulación terminó con observaciones.",
      );
    },
  });

  const runSimulation = () => {
    simulationMutation.mutate({
      context: {
        ...context,
        processType: version?.definition.processType ?? context.processType,
      },
      nodeDecisions,
      scenarioName,
    });
  };

  const focusIssue = (issue: WorkflowDesignerValidationIssue) => {
    if (!issue.nodeKey) return;
    window.location.href = `/configuracion/flujos/${workflowId}/versiones/${versionId}/disenador?node=${encodeURIComponent(issue.nodeKey)}`;
  };

  if (versionQuery.isLoading || optionsQuery.isLoading) {
    return (
      <div className="grid min-h-[48rem] animate-pulse gap-4 bg-[var(--surface-muted)]" />
    );
  }
  if (
    versionQuery.isError ||
    !version ||
    optionsQuery.isError ||
    !optionsQuery.data
  ) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary"
            onClick={() => {
              void versionQuery.refetch();
              void optionsQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description="No fue posible cargar la versión o los catálogos de simulación."
        title="No fue posible cargar la simulación"
      />
    );
  }

  const issues = result ? [...result.errors, ...result.warnings] : [];
  const configurationComplete = Boolean(context.processType && context.dueDate);
  const finalAssignment = result?.route
    .slice()
    .reverse()
    .find((step) => step.projectedAssignment)?.projectedAssignment;

  return (
    <div className="grid gap-5">
      <header className="nibol-panel grid gap-5 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <Link
            className="hover:text-[var(--foreground)]"
            href={`/configuracion/flujos/${workflowId}`}
          >
            Flujos
          </Link>
          <span>/</span>
          <Link
            className="hover:text-[var(--foreground)]"
            href={`/configuracion/flujos/${workflowId}/versiones`}
          >
            Versiones
          </Link>
          <span>/</span>
          <span className="font-semibold text-[var(--foreground)]">
            Simulación
          </span>
        </div>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="nibol-eyebrow">Configuración · Flujo controlado</p>
            <h1 className="font-display mt-2 text-4xl leading-none font-bold tracking-[-0.04em] text-[var(--foreground)] uppercase">
              Simulación de flujo
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--foreground-soft)]">
              {version.definition.name} ·{" "}
              {formatProcessType(version.definition.processType)} · versión{" "}
              {version.versionNumber}.0
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="nibol-btn-secondary"
              href={`/configuracion/flujos/${workflowId}/versiones`}
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
            <Link
              className="nibol-btn-secondary"
              href={`/configuracion/flujos/${workflowId}/versiones/${versionId}/disenador`}
            >
              <GitBranch className="h-4 w-4" /> Diseñador
            </Link>
            {canPublish ? (
              <Link
                className="nibol-btn-primary"
                href={`/configuracion/flujos/${workflowId}/versiones/${versionId}/disenador`}
              >
                <Send className="h-4 w-4" /> Publicar flujo
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">
          <span className={getStatusBadgeClass(version.status)}>
            {formatVersionStatus(version.status)}
          </span>
          <span>
            {version.nodes.length} nodos · {version.transitions.length}{" "}
            conexiones
          </span>
          <span>
            Las simulaciones no crean tareas, timers ni notificaciones.
          </span>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="nibol-panel grid gap-5 p-5 sm:p-7">
          <div>
            <p className="nibol-eyebrow">Entrada controlada</p>
            <h2 className="font-display mt-2 text-2xl font-bold tracking-[-0.03em] uppercase">
              Escenario
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground-soft)]">
              Proporcione valores seguros del contexto. La evaluación usa
              exclusivamente el registro de campos y operadores permitidos.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del escenario">
              <input
                className={inputClass}
                onChange={(event) => setScenarioName(event.target.value)}
                value={scenarioName}
              />
            </Field>
            <Field label="Nivel de riesgo">
              <select
                className={inputClass}
                onChange={(event) =>
                  updateContext("riskLevel", event.target.value || null)
                }
                value={context.riskLevel ?? ""}
              >
                <option value="">Seleccione un nivel</option>
                {optionsQuery.data.catalogs.riskLevels.map((level) => (
                  <option key={level.key} value={level.key}>
                    {level.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Área">
              <select
                className={inputClass}
                onChange={(event) =>
                  updateContext("areaId", event.target.value || null)
                }
                value={context.areaId ?? ""}
              >
                <option value="">Seleccione un área</option>
                {optionsQuery.data.areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado de observación">
              <select
                className={inputClass}
                onChange={(event) =>
                  updateContext("observationStatus", event.target.value || null)
                }
                value={context.observationStatus ?? ""}
              >
                <option value="">Seleccione un estado</option>
                {optionsQuery.data.catalogs.observationStatuses.map(
                  (status) => (
                    <option key={status.key} value={status.key}>
                      {status.name}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Fecha límite">
              <input
                className={inputClass}
                onChange={(event) =>
                  updateContext("dueDate", event.target.value || null)
                }
                type="date"
                value={context.dueDate ?? ""}
              />
            </Field>
            <Field label="Días vencidos">
              <input
                className={inputClass}
                min={0}
                onChange={(event) =>
                  updateContext(
                    "daysOverdue",
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                type="number"
                value={context.daysOverdue ?? ""}
              />
            </Field>
            <Field label="Cantidad de evidencias">
              <input
                className={inputClass}
                min={0}
                onChange={(event) =>
                  updateContext(
                    "evidenceCount",
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                type="number"
                value={context.evidenceCount ?? ""}
              />
            </Field>
            <Field label="Estado del plan de remediación">
              <input
                className={inputClass}
                onChange={(event) =>
                  updateContext(
                    "remediationPlanStatus",
                    event.target.value || null,
                  )
                }
                placeholder="Ej. APPROVED"
                value={context.remediationPlanStatus ?? ""}
              />
            </Field>
            <Field label="Tipo de solicitud">
              <input
                className={inputClass}
                onChange={(event) =>
                  updateContext("requestType", event.target.value || null)
                }
                placeholder="Ej. EXTENSION"
                value={context.requestType ?? ""}
              />
            </Field>
            <Field label="Días solicitados">
              <input
                className={inputClass}
                min={0}
                onChange={(event) =>
                  updateContext(
                    "requestedExtensionDays",
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                type="number"
                value={context.requestedExtensionDays ?? ""}
              />
            </Field>
            <Field label="Decisión anterior">
              <input
                className={inputClass}
                onChange={(event) =>
                  updateContext("previousDecision", event.target.value || null)
                }
                placeholder="Ej. APPROVED"
                value={context.previousDecision ?? ""}
              />
            </Field>
            <Field label="Solicitante">
              <select
                className={inputClass}
                onChange={(event) =>
                  updateContext("requesterUserId", event.target.value || null)
                }
                value={context.requesterUserId ?? ""}
              >
                <option value="">Seleccione un usuario</option>
                {optionsQuery.data.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Responsable">
              <select
                className={inputClass}
                onChange={(event) =>
                  updateContext("responsibleUserId", event.target.value || null)
                }
                value={context.responsibleUserId ?? ""}
              >
                <option value="">Seleccione un usuario</option>
                {optionsQuery.data.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-3 text-sm text-[var(--foreground-soft)]">
            <input
              checked={context.hasEvidence ?? false}
              className="h-4 w-4 accent-[var(--primary)]"
              onChange={(event) =>
                updateContext("hasEvidence", event.target.checked)
              }
              type="checkbox"
            />
            Evidencia presente
          </label>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-5">
            <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <ShieldCheck className="h-4 w-4 text-[var(--primary)]" /> Contexto
              serializable y sin secretos
            </p>
            <button
              className="nibol-btn-primary"
              disabled={simulationMutation.isPending}
              onClick={runSimulation}
              type="button"
            >
              <Play className="h-4 w-4" />{" "}
              {simulationMutation.isPending
                ? "Ejecutando…"
                : "Ejecutar simulación"}
            </button>
          </div>
        </div>

        <div className="nibol-panel grid content-start gap-5 p-5 sm:p-7">
          <div>
            <p className="nibol-eyebrow">Decisiones humanas</p>
            <h2 className="font-display mt-2 text-2xl font-bold tracking-[-0.03em] uppercase">
              Acciones proyectadas
            </h2>
          </div>
          {decisionNodes.length === 0 ? (
            <p className="border border-dashed border-[var(--border-strong)] px-4 py-5 text-sm leading-6 text-[var(--muted)]">
              Este flujo no contiene etapas o aprobaciones que requieran una
              decisión simulada.
            </p>
          ) : (
            <div className="grid gap-4">
              {decisionNodes.map((node) => {
                const configuration = toConfiguration(node);
                const actions = configuration.allowedActions ?? [];
                const defaultAction =
                  node.type === "APPROVAL" ? "APPROVE" : "COMPLETE";
                return (
                  <Field key={node.id} label={node.name}>
                    <select
                      className={inputClass}
                      onChange={(event) =>
                        setNodeDecisions((current) => ({
                          ...current,
                          [node.nodeKey]: event.target.value,
                        }))
                      }
                      value={nodeDecisions[node.nodeKey] ?? ""}
                    >
                      <option value="">Predeterminada ({defaultAction})</option>
                      {actions.map((action) => (
                        <option key={action} value={action}>
                          {action}
                        </option>
                      ))}
                    </select>
                  </Field>
                );
              })}
            </div>
          )}
          <div className="border-t border-[var(--border)] pt-5 text-xs leading-5 text-[var(--muted)]">
            Las decisiones omitidas usan APPROVE o COMPLETE únicamente para
            facilitar la simulación y quedan marcadas como advertencia.
          </div>
        </div>
      </section>

      {result ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Configuración completa"
              tone={configurationComplete ? "success" : "warning"}
              value={configurationComplete ? "Sí" : "Revisar"}
            />
            <MetricCard
              label="Advertencias"
              tone="warning"
              value={result.warnings.length}
            />
            <MetricCard
              label="Errores"
              tone={result.errors.length ? "danger" : "success"}
              value={result.errors.length}
            />
            <MetricCard
              label="Nodos visitados"
              value={result.summary.visitedNodes}
            />
            <MetricCard
              label="Reglas sin salida"
              tone={result.success ? "success" : "danger"}
              value={
                result.success
                  ? 0
                  : result.errors.filter(
                      (error) =>
                        error.code.includes("ROUTE") ||
                        error.code.includes("CONDITION"),
                    ).length
              }
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <div className="nibol-panel grid gap-5 p-5 sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="nibol-eyebrow">Recorrido resuelto</p>
                  <h2 className="font-display mt-2 text-2xl font-bold tracking-[-0.03em] uppercase">
                    Ruta de simulación
                  </h2>
                </div>
                <span
                  className={
                    result.success
                      ? "nibol-badge nibol-badge-success"
                      : "nibol-badge nibol-badge-accent"
                  }
                >
                  {result.success ? "Completada" : "Requiere correcciones"}
                </span>
              </div>
              <RouteTrace result={result} />
            </div>
            <div className="nibol-panel grid content-start gap-5 p-5 sm:p-7">
              <div>
                <p className="nibol-eyebrow">Cierre proyectado</p>
                <h2 className="font-display mt-2 text-2xl font-bold tracking-[-0.03em] uppercase">
                  Resultado final
                </h2>
              </div>
              <div className="grid gap-4 border-y border-[var(--border)] py-4">
                <div>
                  <span className="text-xs text-[var(--muted)]">
                    Estado final
                  </span>
                  <p className="mt-1 text-lg font-bold text-[var(--foreground)]">
                    {result.finalResult ?? "Sin cierre"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted)]">
                    Responsable proyectado
                  </span>
                  <p className="mt-1 text-sm font-semibold text-[var(--foreground-soft)]">
                    {finalAssignment?.userId ??
                      finalAssignment?.roleId ??
                      finalAssignment?.areaId ??
                      "No resuelto"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted)]">
                    SLA total estimado
                  </span>
                  <p className="mt-1 text-sm font-semibold text-[var(--foreground-soft)]">
                    {formatSla(totalSlaMinutes(result))}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted)]">
                    Publicación
                  </span>
                  <p className="mt-1 text-sm font-semibold text-[var(--foreground-soft)]">
                    {result.errors.length === 0
                      ? "Lista para validación de publicación"
                      : "Requiere correcciones"}
                  </p>
                </div>
              </div>
              <p className="flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />{" "}
                La simulación proyecta asignaciones, timers y notificaciones; no
                ejecuta efectos reales.
              </p>
            </div>
          </section>

          <section className="nibol-panel grid gap-5 p-5 sm:p-7">
            <div>
              <p className="nibol-eyebrow">Control de calidad</p>
              <h2 className="font-display mt-2 text-2xl font-bold tracking-[-0.03em] uppercase">
                Errores y advertencias
              </h2>
            </div>
            <IssueTable issues={issues} onFocus={focusIssue} />
          </section>
        </>
      ) : (
        <section className="nibol-panel flex items-center gap-4 p-5 text-sm leading-6 text-[var(--foreground-soft)] sm:p-7">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          Configure un escenario y ejecute la simulación para ver la ruta, las
          reglas evaluadas y la preparación de publicación.
        </section>
      )}
    </div>
  );
}

export function WorkflowSimulation({
  canPublish,
  versionId,
  workflowId,
}: {
  canPublish: boolean;
  versionId: string;
  workflowId: string;
}) {
  return (
    <WorkflowSimulationWorkspace
      canPublish={canPublish}
      versionId={versionId}
      workflowId={workflowId}
    />
  );
}
