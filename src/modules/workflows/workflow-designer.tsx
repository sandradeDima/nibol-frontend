"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Bell,
  CircleAlert,
  CircleCheck,
  Clock3,
  GitBranch,
  GitFork,
  ListChecks,
  Maximize2,
  MousePointer2,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Split,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import {
  formatDate,
  formatProcessType,
  formatVersionStatus,
  getStatusBadgeClass,
} from "@/modules/workflows/presentation";
import type {
  WorkflowConditionRule,
  WorkflowDesignerData,
  WorkflowDesignerNode,
  WorkflowDesignerNodeConfiguration,
  WorkflowDesignerNodeType,
  WorkflowDesignerSaveInput,
  WorkflowDesignerTransition,
  WorkflowDesignerValidationIssue,
  WorkflowDesignerValidationResult,
} from "@/types";
import { workflowService } from "@/services/workflow-service";
import { getApiErrorMessage } from "@/utils";

import {
  NODE_TYPE_LABELS,
  PALETTE_ITEMS,
  cloneConfiguration,
  createDefaultNodeConfiguration,
  getNodeMetadata,
  validateConfiguration,
} from "./workflow-designer-config";
import { WorkflowNodeConfigPanel } from "./workflow-node-config-panel";

type DesignerGraphTransition = {
  conditionGroup: WorkflowDesignerTransition["conditionGroup"];
  id: string;
  label: string | null;
  priority: number;
  source: string;
  target: string;
  transitionType: string | null;
};

type DesignerGraph = {
  nodes: WorkflowDesignerNode[];
  transitions: DesignerGraphTransition[];
};

const TRANSITION_TYPE_OPTIONS = [
  ["DEFAULT", "Ruta por defecto"],
  ["CONDITION", "Ruta condicionada"],
  ["APPROVE", "Aprobación"],
  ["REJECT", "Rechazo"],
  ["OBSERVE", "Observación"],
  ["REQUEST_CORRECTION", "Solicitar corrección"],
  ["COMPLETE", "Completar"],
  ["REASSIGN", "Reasignar"],
  ["RETURN", "Retorno"],
  ["CORRECTION", "Corrección"],
  ["ESCALATION", "Escalamiento"],
  ["ALTERNATE_ROUTE", "Ruta alternativa"],
  ["NOTIFICATION", "Notificación"],
] as const;

type FlowNodeData = {
  invalid: boolean;
  node: WorkflowDesignerNode;
};

type FlowNode = Node<FlowNodeData, "designer">;
type FlowEdge = Edge<{ label?: string | null }>;

const NODE_ICONS: Record<WorkflowDesignerNodeType, typeof GitBranch> = {
  APPROVAL: UserCheck,
  CONDITION: Split,
  END: ArrowDownToLine,
  ESCALATION: GitFork,
  NOTIFICATION: Bell,
  REJECTION: X,
  SLA: Clock3,
  STAGE: ListChecks,
  START: ArrowRight,
};

const PALETTE_ICON_TONE: Record<WorkflowDesignerNodeType, string> = {
  APPROVAL: "bg-[var(--primary-soft)] text-[var(--primary)]",
  CONDITION: "bg-[var(--surface-muted)] text-[var(--foreground-soft)]",
  END: "bg-[var(--primary)] text-white",
  ESCALATION: "bg-[var(--surface-muted)] text-[var(--primary)]",
  NOTIFICATION: "bg-[var(--surface-muted)] text-[var(--foreground-soft)]",
  REJECTION: "bg-[var(--accent-soft)] text-[var(--accent)]",
  SLA: "bg-[var(--surface-muted)] text-[var(--primary)]",
  STAGE: "bg-[var(--surface-muted)] text-[var(--foreground-soft)]",
  START: "bg-[var(--primary)] text-white",
};

const getClientId = (prefix: string): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const buildGraph = (data: WorkflowDesignerData): DesignerGraph => ({
  nodes: data.nodes.map((node) => ({
    ...node,
    configurationJson: cloneConfiguration(node.configurationJson),
  })),
  transitions: data.transitions.map((transition) => ({
    conditionGroup: transition.conditionGroup,
    id: transition.id,
    label: transition.label,
    priority: transition.priority,
    source: transition.sourceNode.id,
    target: transition.targetNode.id,
    transitionType: transition.transitionType,
  })),
});

const readConditionValue = (value: unknown): WorkflowConditionRule["value"] => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    (Array.isArray(value) &&
      value.every((item) =>
        ["string", "number", "boolean"].includes(typeof item),
      ))
  ) {
    return value as WorkflowConditionRule["value"];
  }

  return null;
};

const toSaveInput = (graph: DesignerGraph): WorkflowDesignerSaveInput => ({
  nodes: graph.nodes.map((node) => ({
    assignmentStrategy:
      "assignmentStrategy" in node.configurationJson
        ? node.configurationJson.assignmentStrategy
        : (node.assignmentStrategy as WorkflowDesignerSaveInput["nodes"][number]["assignmentStrategy"]),
    configurationJson: node.configurationJson,
    description: node.configurationJson.description,
    id: node.id,
    name: node.configurationJson.name,
    nodeKey: node.nodeKey,
    positionX: node.positionX,
    positionY: node.positionY,
    type: node.type,
  })),
  transitions: graph.transitions.map((transition) => ({
    conditionGroup: transition.conditionGroup
      ? {
          conditions: transition.conditionGroup.conditions.map((condition) => ({
            description: condition.description,
            field: condition.field,
            operator: condition.operator,
            resultLabel: null,
            sequence: condition.sequence,
            value: readConditionValue(condition.valueJson),
          })),
          description: transition.conditionGroup.description,
          id: transition.conditionGroup.id,
          logicOperator: transition.conditionGroup.logicOperator,
        }
      : null,
    conditionGroupId: transition.conditionGroup?.id ?? null,
    id: transition.id,
    label: transition.label,
    priority: transition.priority,
    sourceNodeId: transition.source,
    targetNodeId: transition.target,
    transitionType: transition.transitionType,
  })),
});

const validateLocalGraph = (
  graph: DesignerGraph,
  processType: string,
): WorkflowDesignerValidationResult => {
  const errors: WorkflowDesignerValidationIssue[] = [];
  const warnings: WorkflowDesignerValidationIssue[] = [];
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const byKey = new Map(graph.nodes.map((node) => [node.nodeKey, node]));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  const addError = (issue: WorkflowDesignerValidationIssue) =>
    errors.push({ ...issue, severity: "ERROR" });
  const addWarning = (issue: WorkflowDesignerValidationIssue) =>
    warnings.push({ ...issue, severity: "WARNING" });

  graph.nodes.forEach((node) => {
    validateConfiguration(node.configurationJson, processType).forEach(
      (message) => {
        addError({
          code: "NODE_CONFIGURATION",
          message,
          nodeId: node.id,
          nodeKey: node.nodeKey,
          severity: "ERROR",
        });
      },
    );
  });

  const starts = graph.nodes.filter((node) => node.type === "START");
  const ends = graph.nodes.filter((node) => node.type === "END");
  if (starts.length !== 1)
    addError({
      code: "START_COUNT",
      message:
        starts.length === 0
          ? "Agregue un nodo Inicio."
          : "El flujo debe tener exactamente un nodo Inicio.",
      severity: "ERROR",
    });
  if (ends.length === 0)
    addError({
      code: "END_REQUIRED",
      message: "Agregue al menos un nodo Fin.",
      severity: "ERROR",
    });

  const duplicateTransitions = new Set<string>();
  graph.transitions.forEach((transition) => {
    const source = byId.get(transition.source) ?? byKey.get(transition.source);
    const target = byId.get(transition.target) ?? byKey.get(transition.target);
    if (!source || !target) {
      addError({
        code: "TRANSITION_REFERENCE_MISSING",
        message: "La conexión referencia un nodo inexistente.",
        severity: "ERROR",
      });
      return;
    }
    const key = `${source.id}->${target.id}`;
    if (duplicateTransitions.has(key))
      addError({
        code: "DUPLICATE_TRANSITION",
        message: "No puede haber dos conexiones idénticas.",
        nodeKey: source.nodeKey,
        severity: "ERROR",
      });
    duplicateTransitions.add(key);
    if (source.id === target.id)
      addError({
        code: "SELF_LOOP",
        message: "No se permiten conexiones de un nodo hacia sí mismo.",
        nodeKey: source.nodeKey,
        severity: "ERROR",
      });
    incoming.set(target.id, (incoming.get(target.id) ?? 0) + 1);
    outgoing.set(source.id, (outgoing.get(source.id) ?? 0) + 1);
  });

  starts.forEach((node) => {
    if ((incoming.get(node.id) ?? 0) > 0)
      addError({
        code: "START_INCOMING",
        message: "El nodo Inicio no puede tener conexiones entrantes.",
        nodeKey: node.nodeKey,
        severity: "ERROR",
      });
    if ((outgoing.get(node.id) ?? 0) === 0)
      addWarning({
        code: "START_OUTGOING",
        message: "El nodo Inicio todavía no tiene una salida conectada.",
        nodeKey: node.nodeKey,
        severity: "WARNING",
      });
  });
  ends.forEach((node) => {
    if ((outgoing.get(node.id) ?? 0) > 0)
      addError({
        code: "END_OUTGOING",
        message: "El nodo Fin no puede tener conexiones salientes.",
        nodeKey: node.nodeKey,
        severity: "ERROR",
      });
  });

  return {
    errors,
    isValid: errors.length === 0,
    publicationReady: false,
    summary: {
      cycleCount: 0,
      endNodeCount: ends.length,
      nodeCount: graph.nodes.length,
      reachableNodeCount: 0,
      routeCountEstimate: 0,
      startNodeCount: starts.length,
      transitionCount: graph.transitions.length,
      unreachableNodeCount: graph.nodes.length,
    },
    warnings,
  };
};

function DesignerFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const node = data.node;
  const Icon = NODE_ICONS[node.type];

  return (
    <div
      className={`relative min-w-[218px] border bg-white text-left shadow-[0_8px_18px_rgba(7,20,45,0.08)] transition ${selected ? "border-[var(--primary)] ring-2 ring-[color:color-mix(in_srgb,var(--primary)_16%,transparent)]" : data.invalid ? "border-[var(--accent)]" : "border-[var(--border-strong)]"}`}
      data-invalid={data.invalid ? "true" : undefined}
    >
      {node.type !== "START" ? (
        <Handle
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[var(--primary)]"
          position={Position.Left}
          type="target"
        />
      ) : null}
      <div className="flex items-start gap-3 border-b border-[var(--border)] px-3 py-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center ${PALETTE_ICON_TONE[node.type]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.62rem] font-bold tracking-[0.16em] text-[var(--muted)] uppercase">
            {NODE_TYPE_LABELS[node.type]}
          </p>
          <p className="mt-1 truncate text-sm font-bold text-[var(--foreground)]">
            {node.name}
          </p>
        </div>
        {data.invalid ? (
          <CircleAlert className="h-4 w-4 shrink-0 text-[var(--accent)]" />
        ) : null}
      </div>
      <div className="grid gap-2 px-3 py-3">
        <p className="line-clamp-2 text-[0.7rem] leading-5 text-[var(--foreground-soft)]">
          {getNodeMetadata(node.configurationJson)}
        </p>
        <p className="text-[0.62rem] font-semibold tracking-[0.08em] text-[var(--muted)] uppercase">
          {node.nodeKey}
        </p>
      </div>
      {node.type !== "END" ? (
        <Handle
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[var(--primary)]"
          position={Position.Right}
          type="source"
        />
      ) : null}
    </div>
  );
}

const nodeTypes = { designer: DesignerFlowNode };

function NodePalette({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (nodeType: WorkflowDesignerNodeType) => void;
}) {
  const handleDragStart = (
    event: DragEvent<HTMLButtonElement>,
    nodeType: WorkflowDesignerNodeType,
  ) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/nibol-workflow-node", nodeType);
  };

  return (
    <aside className="nibol-panel min-w-0 p-4">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <p className="nibol-eyebrow">Componentes</p>
          <h2 className="font-display mt-1 text-2xl font-bold tracking-[-0.03em] uppercase">
            Paleta
          </h2>
        </div>
        <MousePointer2 className="h-5 w-5 text-[var(--muted)]" />
      </div>
      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
        Arrastre un componente al lienzo. Las nuevas piezas se guardan al
        guardar el borrador.
      </p>
      <div className="mt-5 grid gap-2">
        {PALETTE_ITEMS.map((item) => {
          const Icon = NODE_ICONS[item.nodeType];
          return (
            <button
              className="group flex items-start gap-3 border border-transparent px-2 py-3 text-left transition hover:border-[var(--border)] hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={disabled}
              draggable={!disabled}
              key={item.nodeType}
              onClick={() => onAdd(item.nodeType)}
              onDragStart={(event) => handleDragStart(event, item.nodeType)}
              type="button"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center ${PALETTE_ICON_TONE[item.nodeType]}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2 text-sm font-semibold text-[var(--foreground)]">
                  <span>{NODE_TYPE_LABELS[item.nodeType]}</span>
                  <Plus className="h-3.5 w-3.5 text-[var(--muted)] opacity-0 transition group-hover:opacity-100" />
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                  {item.description}
                </span>
                <span className="mt-1 block font-mono text-[0.62rem] tracking-[0.08em] text-[var(--muted)]">
                  {item.nodeType}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function TransitionRoutingPanel({
  node,
  nodes,
  onChange,
  readOnly,
  transitions,
}: {
  node: WorkflowDesignerNode | null;
  nodes: WorkflowDesignerNode[];
  onChange: (
    transitionId: string,
    patch: Partial<
      Pick<
        DesignerGraphTransition,
        "conditionGroup" | "label" | "priority" | "transitionType"
      >
    >,
  ) => void;
  readOnly: boolean;
  transitions: DesignerGraphTransition[];
}) {
  if (!node) return null;

  const outgoing = transitions
    .filter((transition) => transition.source === node.id)
    .sort((left, right) => left.priority - right.priority);

  return (
    <section className="nibol-panel grid gap-4 p-4">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <p className="nibol-eyebrow">Rutas del nodo</p>
          <h3 className="font-display mt-1 text-xl font-bold tracking-[-0.03em] uppercase">
            Semántica de salidas
          </h3>
        </div>
        <GitFork className="h-5 w-5 text-[var(--muted)]" />
      </div>
      {outgoing.length === 0 ? (
        <p className="text-xs leading-5 text-[var(--muted)]">
          Conecte una salida para definir su ruta, prioridad y comportamiento.
        </p>
      ) : (
        <div className="grid gap-4">
          {outgoing.map((transition, index) => {
            const target = nodes.find(
              (candidate) => candidate.id === transition.target,
            );
            return (
              <div
                className="grid gap-3 border border-[var(--border)] bg-[var(--surface-soft)] p-3"
                key={transition.id}
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-[var(--foreground)]">
                    Salida {index + 1} · {target?.name ?? "Nodo no encontrado"}
                  </span>
                  <span className="font-mono text-[var(--muted)]">
                    {transition.id.slice(0, 12)}
                  </span>
                </div>
                <label className="grid gap-2 text-xs">
                  <span className="font-semibold text-[var(--foreground-soft)]">
                    Tipo controlado
                  </span>
                  <select
                    className="nibol-field h-10 py-2 text-sm"
                    disabled={readOnly}
                    onChange={(event) =>
                      onChange(transition.id, {
                        transitionType: event.target.value,
                      })
                    }
                    value={transition.transitionType ?? "DEFAULT"}
                  >
                    {TRANSITION_TYPE_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_5rem]">
                  <label className="grid gap-2 text-xs">
                    <span className="font-semibold text-[var(--foreground-soft)]">
                      Etiqueta
                    </span>
                    <input
                      className="nibol-field h-10 py-2 text-sm"
                      disabled={readOnly}
                      onChange={(event) =>
                        onChange(transition.id, {
                          label: event.target.value || null,
                        })
                      }
                      placeholder="Ej. Aprobar"
                      value={transition.label ?? ""}
                    />
                  </label>
                  <label className="grid gap-2 text-xs">
                    <span className="font-semibold text-[var(--foreground-soft)]">
                      Prioridad
                    </span>
                    <input
                      className="nibol-field h-10 py-2 text-sm"
                      disabled={readOnly}
                      min={0}
                      onChange={(event) =>
                        onChange(transition.id, {
                          priority: Number(event.target.value) || 0,
                        })
                      }
                      type="number"
                      value={transition.priority}
                    />
                  </label>
                </div>
                {node.type === "CONDITION" &&
                transition.transitionType === "CONDITION" ? (
                  <p className="text-xs leading-5 text-[var(--muted)]">
                    Esta salida evaluará las reglas del nodo en el orden y
                    lógica configurados.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CanvasToolbar({
  disabled,
  onFit,
}: {
  disabled: boolean;
  onFit: () => void;
}) {
  const { zoomIn, zoomOut } = useReactFlow();
  return (
    <div className="absolute top-4 right-4 z-10 flex gap-1 border border-[var(--border)] bg-white p-1 shadow-[var(--shadow-panel)]">
      <button
        aria-label="Alejar"
        className="p-2 text-[var(--foreground-soft)] hover:bg-[var(--surface-soft)]"
        disabled={disabled}
        onClick={() => {
          zoomOut();
        }}
        type="button"
      >
        −
      </button>
      <button
        aria-label="Acercar"
        className="p-2 text-[var(--foreground-soft)] hover:bg-[var(--surface-soft)]"
        disabled={disabled}
        onClick={() => {
          zoomIn();
        }}
        type="button"
      >
        +
      </button>
      <button
        aria-label="Centrar lienzo"
        className="p-2 text-[var(--foreground-soft)] hover:bg-[var(--surface-soft)]"
        onClick={onFit}
        type="button"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function DesignerCanvas({
  graph,
  invalidNodeIds,
  onAddNode,
  onConnect,
  onDeleteEdge,
  onDeleteNodes,
  onSelectNode,
  onUpdatePositions,
  readOnly,
  selectedNodeId,
}: {
  graph: DesignerGraph;
  invalidNodeIds: Set<string>;
  onAddNode: (
    nodeType: WorkflowDesignerNodeType,
    position?: { x: number; y: number },
  ) => void;
  onConnect: (connection: Connection) => void;
  onDeleteEdge: (edgeIds: string[]) => void;
  onDeleteNodes: (nodes: FlowNode[]) => void;
  onSelectNode: (nodeId: string | null) => void;
  onUpdatePositions: (changes: NodeChange<FlowNode>[]) => void;
  readOnly: boolean;
  selectedNodeId: string | null;
}) {
  const { fitView, screenToFlowPosition } = useReactFlow();
  const flowNodes = useMemo<FlowNode[]>(
    () =>
      graph.nodes.map((node) => ({
        data: {
          invalid:
            invalidNodeIds.has(node.id) || invalidNodeIds.has(node.nodeKey),
          node,
        },
        id: node.id,
        position: { x: node.positionX, y: node.positionY },
        selected: node.id === selectedNodeId,
        type: "designer",
      })),
    [graph.nodes, invalidNodeIds, selectedNodeId],
  );
  const flowEdges = useMemo<FlowEdge[]>(
    () =>
      graph.transitions.map((transition) => ({
        id: transition.id,
        label: transition.label ?? undefined,
        markerEnd: { color: "var(--primary)", type: MarkerType.ArrowClosed },
        source: transition.source,
        style: { stroke: "var(--primary)", strokeWidth: 1.5 },
        target: transition.target,
        type: "smoothstep",
      })),
    [graph.transitions],
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (readOnly) return;
    const type = event.dataTransfer.getData(
      "application/nibol-workflow-node",
    ) as WorkflowDesignerNodeType;
    if (!type || !NODE_TYPE_LABELS[type]) return;
    onAddNode(
      type,
      screenToFlowPosition({ x: event.clientX, y: event.clientY }),
    );
  };

  return (
    <div className="relative min-h-[34rem] overflow-hidden border border-[var(--border)] bg-[var(--surface-muted)] lg:min-h-0">
      <CanvasToolbar
        disabled={false}
        onFit={() => fitView({ duration: 260, padding: 0.2 })}
      />
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodeTypes={nodeTypes}
        nodesConnectable={!readOnly}
        nodesDraggable={!readOnly}
        onBeforeDelete={async ({ nodes }) => {
          if (readOnly) return false;
          if (nodes.length === 0) return true;
          const hasConnections = nodes.some((node) =>
            graph.transitions.some(
              (transition) =>
                transition.source === node.id || transition.target === node.id,
            ),
          );
          if (
            hasConnections ||
            nodes.some(
              (node) =>
                node.data.node.type === "START" &&
                graph.nodes.filter((candidate) => candidate.type === "START")
                  .length === 1,
            )
          )
            return window.confirm(
              "Este nodo tiene conexiones o es el único Inicio. ¿Desea eliminarlo y revisar el flujo después?",
            );
          return true;
        }}
        onConnect={onConnect}
        onEdgesChange={(changes: EdgeChange[]) => {
          const removed = changes
            .filter((change) => change.type === "remove")
            .map((change) => change.id);
          if (removed.length > 0) onDeleteEdge(removed);
        }}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onNodesChange={onUpdatePositions}
        onNodesDelete={onDeleteNodes}
        onPaneClick={() => onSelectNode(null)}
        panOnDrag
        proOptions={{ hideAttribution: true }}
        selectionOnDrag={!readOnly}
        zoomOnScroll
        zoomOnPinch
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = readOnly ? "none" : "copy";
        }}
      >
        <Background
          color="color-mix(in srgb, var(--border-strong) 72%, transparent)"
          gap={24}
          size={1}
          variant={BackgroundVariant.Dots}
        />
        <Controls showInteractive />
        <MiniMap
          nodeColor={(node) => {
            const flowNode = node as FlowNode;
            return flowNode.data?.invalid ? "var(--accent)" : "var(--primary)";
          }}
          maskColor="rgba(245,246,248,0.72)"
        />
      </ReactFlow>
      {graph.nodes.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
          <div className="grid max-w-sm gap-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[var(--primary)] text-white">
              <GitBranch className="h-5 w-5" />
            </div>
            <h3 className="font-display text-2xl font-bold tracking-[-0.03em] uppercase">
              Comience el recorrido
            </h3>
            <p className="text-sm leading-6 text-[var(--foreground-soft)]">
              Arrastre Inicio al lienzo y conecte el primer recorrido del
              borrador.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ValidationSummary({
  result,
  onFocus,
}: {
  result: WorkflowDesignerValidationResult | null;
  onFocus: (issue: WorkflowDesignerValidationIssue) => void;
}) {
  if (!result) return null;
  return (
    <section
      className={`nibol-panel grid gap-4 p-4 ${result.isValid ? "border-[color:color-mix(in_srgb,var(--success)_24%,white)]" : "border-[color:color-mix(in_srgb,var(--accent)_24%,white)]"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {result.isValid ? (
            <CircleCheck className="h-5 w-5 text-[var(--success)]" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-[var(--accent)]" />
          )}
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              {result.isValid
                ? "Validación estructural aprobada"
                : "Revisión necesaria"}
            </h2>
            <p className="text-xs text-[var(--muted)]">
              {result.errors.length} error
              {result.errors.length === 1 ? "" : "es"} ·{" "}
              {result.warnings.length} advertencia
              {result.warnings.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <span
          className={
            result.isValid
              ? "nibol-badge nibol-badge-success"
              : "nibol-badge nibol-badge-accent"
          }
        >
          {result.isValid ? "Listo para la siguiente fase" : "No publicar"}
        </span>
      </div>
      {result.errors.length || result.warnings.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {[...result.errors, ...result.warnings].map((issue, index) => (
            <button
              className="flex items-start gap-2 border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-left text-xs leading-5 text-[var(--foreground-soft)] hover:border-[var(--primary)]"
              key={`${issue.code}-${issue.nodeKey ?? "graph"}-${index}`}
              onClick={() => onFocus(issue)}
              type="button"
            >
              <span
                className={`mt-1 h-2 w-2 shrink-0 ${issue.severity === "ERROR" ? "bg-[var(--accent)]" : "bg-[var(--primary)]"}`}
              />
              <span>{issue.message}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function DesignerWorkspace({
  canEdit: canEditFromServer,
  canPublish,
  canSimulate,
  canValidate: canValidateFromServer,
  versionId,
  workflowId,
}: {
  canEdit: boolean;
  canPublish: boolean;
  canSimulate: boolean;
  canValidate: boolean;
  versionId: string;
  workflowId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const designerQuery = useQuery({
    queryFn: () => workflowService.getWorkflowDesigner(versionId),
    queryKey: QUERY_KEYS.workflowDesigner(versionId),
  });
  const [graph, setGraph] = useState<DesignerGraph>({
    nodes: [],
    transitions: [],
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const panelDirtyRef = useRef(false);
  const [panelDirty, setPanelDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [validation, setValidation] =
    useState<WorkflowDesignerValidationResult | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishConfirmed, setPublishConfirmed] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<WorkflowDesignerNode | null>(
    null,
  );

  const setDirtyState = useCallback((nextDirty: boolean) => {
    dirtyRef.current = nextDirty;
    setDirty(nextDirty);
    if (nextDirty) setValidation(null);
  }, []);
  const setPanelDirtyState = useCallback((nextDirty: boolean) => {
    panelDirtyRef.current = nextDirty;
    setPanelDirty(nextDirty);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- hydrate the normalized editor state from the server query. */
  useEffect(() => {
    if (!designerQuery.data) return;
    setGraph(buildGraph(designerQuery.data));
    setSelectedNodeId(null);
    setDirtyState(false);
    setPanelDirtyState(false);
    setValidation(null);
    setLastSavedAt(designerQuery.data.lastSavedAt);
  }, [designerQuery.data, setDirtyState, setPanelDirtyState]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current && !panelDirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  const optionsQuery = useQuery({
    enabled: Boolean(designerQuery.data),
    queryFn: workflowService.getWorkflowDesignerOptions,
    queryKey: QUERY_KEYS.workflowDesignerOptions,
    staleTime: 5 * 60_000,
  });
  const readOnly = !(
    designerQuery.data?.canEdit &&
    canEditFromServer &&
    designerQuery.data.version.status === "DRAFT"
  );
  const canValidate = Boolean(
    designerQuery.data?.canValidate && canValidateFromServer,
  );

  const invalidNodeIds = useMemo(
    () =>
      new Set(
        [
          ...(validation?.errors ?? []),
          ...(validation?.warnings ?? []),
        ].flatMap((issue) =>
          [issue.nodeId, issue.nodeKey].filter((value): value is string =>
            Boolean(value),
          ),
        ),
      ),
    [validation],
  );
  const selectedNode =
    graph.nodes.find((node) => node.id === selectedNodeId) ?? null;

  const guardSelection = useCallback(
    (nextNodeId: string | null) => {
      if (
        nextNodeId !== selectedNodeId &&
        panelDirtyRef.current &&
        !window.confirm(
          "Hay cambios sin aplicar en este nodo. ¿Desea descartarlos?",
        )
      )
        return;
      setPanelDirtyState(false);
      setSelectedNodeId(nextNodeId);
    },
    [selectedNodeId, setPanelDirtyState],
  );

  const addNode = useCallback(
    (
      nodeType: WorkflowDesignerNodeType,
      position = {
        x: 80 + graph.nodes.length * 24,
        y: 80 + (graph.nodes.length % 4) * 128,
      },
    ) => {
      if (readOnly) return;
      if (
        nodeType === "START" &&
        graph.nodes.some((node) => node.type === "START")
      ) {
        toast.error("Solo se permite un nodo Inicio en esta versión.");
        return;
      }
      const id = getClientId("node");
      const nodeKey = `${nodeType.toLowerCase()}_${graph.nodes.length + 1}`;
      const configuration = createDefaultNodeConfiguration(
        nodeType,
        designerQuery.data?.definition.processType ?? "SPECIAL_REQUEST",
      );
      const nextNode: WorkflowDesignerNode = {
        assignmentStrategy:
          "assignmentStrategy" in configuration
            ? configuration.assignmentStrategy
            : null,
        configurationJson: configuration,
        createdAt: new Date().toISOString(),
        description: configuration.description,
        id,
        name: configuration.name,
        nodeKey,
        positionX: position.x,
        positionY: position.y,
        type: nodeType,
        updatedAt: new Date().toISOString(),
      };
      setGraph((current) => ({
        ...current,
        nodes: [...current.nodes, nextNode],
      }));
      setDirtyState(true);
      setSelectedNodeId(id);
    },
    [
      designerQuery.data?.definition.processType,
      graph.nodes,
      readOnly,
      setDirtyState,
    ],
  );

  const applyNodeConfiguration = useCallback(
    (nodeId: string, configuration: WorkflowDesignerNodeConfiguration) => {
      setGraph((current) => ({
        ...current,
        nodes: current.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                assignmentStrategy:
                  "assignmentStrategy" in configuration
                    ? configuration.assignmentStrategy
                    : null,
                configurationJson: cloneConfiguration(configuration),
                description: configuration.description,
                name: configuration.name,
                updatedAt: new Date().toISOString(),
              }
            : node,
        ),
      }));
      setDirtyState(true);
    },
    [setDirtyState],
  );

  const handlePositionChanges = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      const positionChanges = changes.filter(
        (
          change,
        ): change is Extract<NodeChange<FlowNode>, { type: "position" }> =>
          change.type === "position" && Boolean(change.position),
      );
      if (positionChanges.length === 0) return;
      setGraph((current) => ({
        ...current,
        nodes: current.nodes.map((node) => {
          const change = positionChanges.find(
            (candidate) => candidate.id === node.id,
          );
          return change?.position
            ? {
                ...node,
                positionX: change.position.x,
                positionY: change.position.y,
                updatedAt: new Date().toISOString(),
              }
            : node;
        }),
      }));
      setDirtyState(true);
    },
    [setDirtyState],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (
        readOnly ||
        !connection.source ||
        !connection.target ||
        connection.source === connection.target
      )
        return;
      setGraph((current) => {
        if (
          current.transitions.some(
            (transition) =>
              transition.source === connection.source &&
              transition.target === connection.target,
          )
        ) {
          toast.error("La conexión ya existe en este flujo.");
          return current;
        }
        return {
          ...current,
          transitions: [
            ...current.transitions,
            {
              conditionGroup: null,
              id: getClientId("edge"),
              label: null,
              priority: current.transitions.length,
              source: connection.source as string,
              target: connection.target as string,
              transitionType: "DEFAULT",
            },
          ],
        };
      });
      setDirtyState(true);
    },
    [readOnly, setDirtyState],
  );

  const updateTransition = useCallback(
    (
      transitionId: string,
      patch: Partial<
        Pick<
          DesignerGraphTransition,
          "conditionGroup" | "label" | "priority" | "transitionType"
        >
      >,
    ) => {
      if (readOnly) return;
      const normalizedPatch =
        patch.transitionType === "DEFAULT" ||
        patch.transitionType === "FALLBACK"
          ? { ...patch, conditionGroup: null }
          : patch;
      setGraph((current) => ({
        ...current,
        transitions: current.transitions.map((transition) =>
          transition.id === transitionId
            ? { ...transition, ...normalizedPatch }
            : transition,
        ),
      }));
      setDirtyState(true);
    },
    [readOnly, setDirtyState],
  );

  const handleDeleteEdges = useCallback(
    (edgeIds: string[]) => {
      if (readOnly) return;
      setGraph((current) => ({
        ...current,
        transitions: current.transitions.filter(
          (transition) => !edgeIds.includes(transition.id),
        ),
      }));
      setDirtyState(true);
    },
    [readOnly, setDirtyState],
  );
  const handleDeleteNodes = useCallback(
    (nodes: FlowNode[]) => {
      if (readOnly || nodes.length === 0) return;
      const ids = new Set(nodes.map((node) => node.id));
      setGraph((current) => ({
        nodes: current.nodes.filter((node) => !ids.has(node.id)),
        transitions: current.transitions.filter(
          (transition) =>
            !ids.has(transition.source) && !ids.has(transition.target),
        ),
      }));
      if (selectedNodeId && ids.has(selectedNodeId)) setSelectedNodeId(null);
      setDirtyState(true);
    },
    [readOnly, selectedNodeId, setDirtyState],
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      workflowService.saveWorkflowDesigner(versionId, toSaveInput(graph)),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: (saved) => {
      setGraph(buildGraph(saved));
      setDirtyState(false);
      setPanelDirtyState(false);
      setValidation(null);
      setLastSavedAt(saved.lastSavedAt);
      queryClient.setQueryData(QUERY_KEYS.workflowDesigner(versionId), saved);
      toast.success("Borrador guardado correctamente.");
    },
  });
  const validateMutation = useMutation({
    mutationFn: () =>
      workflowService.validateWorkflowDesigner(versionId, toSaveInput(graph)),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: (result) => {
      setValidation(result);
      toast[result.isValid ? "success" : "error"](
        result.isValid
          ? "La validación estructural no encontró errores."
          : "La validación encontró observaciones.",
      );
    },
  });
  const publishMutation = useMutation({
    mutationFn: () =>
      workflowService.publishWorkflowVersion(
        versionId,
        validation?.graphHash ?? "",
      ),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSuccess: async (published) => {
      setPublishOpen(false);
      setPublishConfirmed(false);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.workflowDesigner(versionId),
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.workflowVersionDetails(versionId),
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.workflowDetails(workflowId),
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.workflowVersions(workflowId),
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.workflowActivity(workflowId),
        }),
      ]);
      toast.success(
        `La versión v${published.version.versionNumber}.0 fue publicada correctamente.`,
      );
      router.push(`/configuracion/flujos/${workflowId}`);
    },
  });

  const runValidation = () => {
    const localResult = validateLocalGraph(
      graph,
      designerQuery.data?.definition.processType ?? "",
    );
    setValidation(localResult);
    if (canValidate) validateMutation.mutate();
  };
  const canPublishCurrentVersion = Boolean(
    canPublish &&
    !readOnly &&
    !dirty &&
    !panelDirty &&
    !publishMutation.isPending &&
    validation?.publicationReady &&
    validation.graphHash &&
    validation.errors.length === 0,
  );
  const leaveDesigner = () => {
    if (
      (dirtyRef.current || panelDirtyRef.current) &&
      !window.confirm("Tiene cambios sin guardar. ¿Desea salir sin guardar?")
    )
      return;
    router.push(`/configuracion/flujos/${workflowId}/versiones`);
  };
  const focusIssue = (issue: WorkflowDesignerValidationIssue) => {
    const node = graph.nodes.find(
      (candidate) =>
        candidate.id === issue.nodeId || candidate.nodeKey === issue.nodeKey,
    );
    if (node) {
      guardSelection(node.id);
      document
        .querySelector(`[data-id="${node.id}"]`)
        ?.scrollIntoView({ block: "nearest" });
    }
  };

  if (designerQuery.isLoading)
    return (
      <div className="grid min-h-[44rem] animate-pulse gap-4 bg-[var(--surface-muted)]" />
    );
  if (designerQuery.isError || !designerQuery.data)
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary"
            onClick={() => {
              void designerQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={
          designerQuery.error?.message ?? "No fue posible cargar el diseñador."
        }
        title="No fue posible cargar el diseñador"
      />
    );

  return (
    <div className="grid gap-5">
      <header className="nibol-panel grid gap-5 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <Link
            className="hover:text-[var(--foreground)]"
            href={`/configuracion/flujos/${workflowId}`}
            onClick={(event) => {
              if (
                (dirtyRef.current || panelDirtyRef.current) &&
                !window.confirm(
                  "Tiene cambios sin guardar. ¿Desea salir sin guardar?",
                )
              )
                event.preventDefault();
            }}
          >
            Flujos
          </Link>
          <span>/</span>
          <Link
            className="hover:text-[var(--foreground)]"
            href={`/configuracion/flujos/${workflowId}/versiones`}
            onClick={(event) => {
              if (
                (dirtyRef.current || panelDirtyRef.current) &&
                !window.confirm(
                  "Tiene cambios sin guardar. ¿Desea salir sin guardar?",
                )
              )
                event.preventDefault();
            }}
          >
            Versiones
          </Link>
          <span>/</span>
          <span className="font-semibold text-[var(--foreground)]">
            Diseñador
          </span>
        </div>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <p className="nibol-eyebrow">Configuración · Flujo visual</p>
              {dirty ? (
                <span className="nibol-badge nibol-badge-accent">
                  Cambios sin guardar
                </span>
              ) : (
                <span className="nibol-badge nibol-badge-success">
                  Guardado
                </span>
              )}
            </div>
            <div>
              <h1 className="font-display text-4xl leading-none font-bold tracking-[-0.04em] uppercase sm:text-5xl">
                Diseñador Visual de Flujo
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--foreground-soft)]">
                {designerQuery.data.definition.name} ·{" "}
                {formatProcessType(designerQuery.data.definition.processType)} ·
                versión {designerQuery.data.version.versionNumber}.0
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="nibol-btn-secondary"
              onClick={leaveDesigner}
              type="button"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
            {canSimulate ? (
              <Link
                className="nibol-btn-secondary"
                href={`/configuracion/flujos/${workflowId}/versiones/${versionId}/simulacion`}
              >
                <ShieldCheck className="h-4 w-4" /> Simular flujo
              </Link>
            ) : null}
            <button
              className="nibol-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={readOnly || !dirty || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              type="button"
            >
              <Save className="h-4 w-4" />{" "}
              {saveMutation.isPending ? "Guardando…" : "Guardar borrador"}
            </button>
            <button
              className="nibol-btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canValidate || validateMutation.isPending}
              onClick={runValidation}
              title={
                canValidate
                  ? "Ejecutar validación completa"
                  : "Requiere el permiso workflows.validate"
              }
              type="button"
            >
              <ShieldCheck className="h-4 w-4" />{" "}
              {validateMutation.isPending ? "Validando…" : "Validar flujo"}
            </button>
            <button
              className="nibol-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canPublishCurrentVersion}
              onClick={() => {
                setPublishConfirmed(false);
                setPublishOpen(true);
              }}
              title={
                canPublishCurrentVersion
                  ? "Publicar la última versión validada"
                  : "Guarde los cambios y ejecute una validación sin errores antes de publicar"
              }
              type="button"
            >
              <Send className="h-4 w-4" />
              {publishMutation.isPending ? "Publicando…" : "Publicar flujo"}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">
          <span className="inline-flex items-center gap-2">
            <GitBranch className="h-4 w-4" /> {designerQuery.data.nodes.length}{" "}
            nodos · {designerQuery.data.transitions.length} conexiones
          </span>
          <span className="inline-flex items-center gap-2">
            <Activity className="h-4 w-4" /> Último guardado:{" "}
            {formatDate(lastSavedAt, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
          <span
            className={getStatusBadgeClass(designerQuery.data.version.status)}
          >
            {formatVersionStatus(designerQuery.data.version.status)}
          </span>
        </div>
      </header>

      {!readOnly && designerQuery.data.version.status === "DRAFT" ? null : (
        <div className="flex items-start gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-sm leading-6 text-[var(--foreground-soft)]">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
          <p>
            <strong className="text-[var(--foreground)]">
              Modo de solo lectura.
            </strong>{" "}
            Esta versión no es un borrador editable o no cuenta con el permiso
            de edición. Puede explorar el grafo y consultar sus configuraciones.
          </p>
        </div>
      )}
      <div className="grid min-h-[44rem] gap-4 xl:grid-cols-[15rem_minmax(0,1fr)_22rem]">
        <NodePalette
          disabled={readOnly}
          onAdd={(nodeType) => addNode(nodeType)}
        />
        <DesignerCanvas
          graph={graph}
          invalidNodeIds={invalidNodeIds}
          onAddNode={addNode}
          onConnect={handleConnect}
          onDeleteEdge={handleDeleteEdges}
          onDeleteNodes={handleDeleteNodes}
          onSelectNode={guardSelection}
          onUpdatePositions={handlePositionChanges}
          readOnly={readOnly}
          selectedNodeId={selectedNodeId}
        />
        <div className="grid min-h-0 gap-4">
          <WorkflowNodeConfigPanel
            node={selectedNode}
            nodes={graph.nodes}
            onApply={applyNodeConfiguration}
            onClose={() => guardSelection(null)}
            onDirtyChange={setPanelDirtyState}
            options={optionsQuery.data}
            processType={designerQuery.data.definition.processType}
            readOnly={readOnly}
          />
          <TransitionRoutingPanel
            node={selectedNode}
            nodes={graph.nodes}
            onChange={updateTransition}
            readOnly={readOnly}
            transitions={graph.transitions}
          />
          {selectedNode && !readOnly ? (
            <div className="nibol-panel flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-xs text-[var(--muted)]">
                {panelDirty ? "Cambios en edición" : "Nodo seleccionado"}
              </span>
              <button
                className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent)] hover:underline"
                onClick={() => setNodeToDelete(selectedNode)}
                type="button"
              >
                <Trash2 className="h-4 w-4" /> Eliminar nodo
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <ValidationSummary onFocus={focusIssue} result={validation} />

      <ConfirmDialog
        confirmLabel="Publicar versión"
        description="La versión validada pasará a ser la versión activa del workflow. La versión activa anterior quedará inactiva y esta versión dejará de ser editable."
        isLoading={publishMutation.isPending}
        onConfirm={() => {
          if (!publishConfirmed) {
            toast.error("Confirme que revisó la validación antes de publicar.");
            return;
          }
          publishMutation.mutate();
        }}
        onOpenChange={(open) => {
          setPublishOpen(open);
          if (!open) setPublishConfirmed(false);
        }}
        open={publishOpen}
        title="Publicar workflow"
        tone="default"
      >
        <div className="grid gap-4 border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm leading-6 text-[var(--foreground-soft)]">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[var(--muted)] uppercase">
              Versión preparada
            </p>
            <p className="mt-1 font-semibold text-[var(--foreground)]">
              {designerQuery.data.definition.name} · v
              {designerQuery.data.version.versionNumber}.0
            </p>
          </div>
          <div className="grid gap-1 text-xs">
            <span>
              {validation?.warnings.length ?? 0} advertencias informativas
            </span>
            <span>
              Hash de validación:{" "}
              {validation?.graphHash?.slice(0, 16) ?? "No disponible"}…
            </span>
          </div>
          <label className="flex items-start gap-3 border-t border-[var(--border)] pt-3 text-sm">
            <input
              checked={publishConfirmed}
              className="mt-1 h-4 w-4 accent-[var(--primary)]"
              onChange={(event) => setPublishConfirmed(event.target.checked)}
              type="checkbox"
            />
            <span>
              Confirmo que revisé los errores y advertencias de validación y
              autorizo la publicación.
            </span>
          </label>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        confirmLabel="Eliminar nodo"
        description={
          nodeToDelete
            ? `Se eliminará “${nodeToDelete.name}” y sus ${graph.transitions.filter((transition) => transition.source === nodeToDelete.id || transition.target === nodeToDelete.id).length} conexión(es). La eliminación quedará pendiente hasta guardar el borrador.`
            : ""
        }
        onConfirm={() => {
          if (nodeToDelete)
            handleDeleteNodes([
              {
                id: nodeToDelete.id,
                data: { invalid: false, node: nodeToDelete },
                position: {
                  x: nodeToDelete.positionX,
                  y: nodeToDelete.positionY,
                },
                type: "designer",
              },
            ]);
          setNodeToDelete(null);
        }}
        onOpenChange={(open) => {
          if (!open) setNodeToDelete(null);
        }}
        open={Boolean(nodeToDelete)}
        title="Eliminar nodo"
      />
    </div>
  );
}

export function WorkflowDesigner({
  canEdit,
  canPublish,
  canSimulate,
  canValidate,
  versionId,
  workflowId,
}: {
  canEdit: boolean;
  canPublish: boolean;
  canSimulate: boolean;
  canValidate: boolean;
  versionId: string;
  workflowId: string;
}) {
  return (
    <ReactFlowProvider>
      <DesignerWorkspace
        canEdit={canEdit}
        canPublish={canPublish}
        canSimulate={canSimulate}
        canValidate={canValidate}
        versionId={versionId}
        workflowId={workflowId}
      />
    </ReactFlowProvider>
  );
}
