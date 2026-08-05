import type {
  ApprovalNodeConfiguration,
  ConditionNodeConfiguration,
  EndNodeConfiguration,
  EscalationNodeConfiguration,
  NotificationNodeConfiguration,
  RejectionNodeConfiguration,
  SlaNodeConfiguration,
  StageNodeConfiguration,
  StartNodeConfiguration,
  WorkflowAssignmentStrategy,
  WorkflowConditionField,
  WorkflowConditionOperator,
  WorkflowDesignerNodeConfiguration,
  WorkflowDesignerNodeType,
  WorkflowDesignerTransition,
} from "@/types";

export const NODE_TYPE_LABELS: Record<WorkflowDesignerNodeType, string> = {
  APPROVAL: "Aprobación",
  CONDITION: "Condición",
  END: "Fin",
  ESCALATION: "Escalar",
  NOTIFICATION: "Notificar",
  REJECTION: "Rechazo",
  SLA: "SLA",
  STAGE: "Etapa",
  START: "Inicio",
};

export const NODE_TYPE_DEFAULT_NAMES: Record<WorkflowDesignerNodeType, string> =
  {
    APPROVAL: "Nueva aprobación",
    CONDITION: "Nueva condición",
    END: "Fin",
    ESCALATION: "Escalamiento",
    NOTIFICATION: "Notificación",
    REJECTION: "Rechazo",
    SLA: "Control de SLA",
    STAGE: "Nueva etapa",
    START: "Inicio",
  };

export const ASSIGNMENT_STRATEGY_LABELS: Record<
  WorkflowAssignmentStrategy,
  string
> = {
  AREA: "Área",
  FIELD_REFERENCE: "Referencia por campo",
  FIXED_USER: "Usuario fijo",
  OBSERVATION_RESPONSIBLE: "Responsable de la observación",
  RECORD_OWNER: "Responsable del registro",
  REQUESTER: "Solicitante",
  ROLE: "Rol",
  SUPERVISOR: "Supervisor / gerente de área",
};

export const CONDITION_FIELD_LABELS: Record<WorkflowConditionField, string> = {
  areaId: "Área",
  daysOverdue: "Días vencidos",
  dueDate: "Fecha límite",
  evidenceCount: "Cantidad de evidencias",
  hasEvidence: "Evidencia presente",
  observationStatus: "Estado de observación",
  previousDecision: "Decisión anterior",
  processType: "Tipo de proceso",
  remediationPlanStatus: "Estado del plan de remediación",
  requestType: "Tipo de solicitud",
  requestedExtensionDays: "Días de ampliación solicitados",
  responsibleUserId: "Usuario responsable",
  riskLevel: "Nivel de riesgo",
};

export const CONDITION_OPERATOR_LABELS: Record<
  WorkflowConditionOperator,
  string
> = {
  CONTAINS: "Contiene",
  DUE_WITHIN: "Vence dentro de",
  EQUALS: "Igual a",
  GREATER_THAN: "Mayor que",
  GREATER_THAN_OR_EQUAL: "Mayor o igual",
  IS_EMPTY: "Está vacío",
  IS_NOT_EMPTY: "No está vacío",
  IS_OVERDUE: "Está vencido",
  IN: "Está dentro de",
  LESS_THAN: "Menor que",
  LESS_THAN_OR_EQUAL: "Menor o igual",
  NOT_CONTAINS: "No contiene",
  NOT_EQUALS: "Diferente de",
  NOT_IN: "No está dentro de",
};

export const PALETTE_ITEMS: Array<{
  description: string;
  nodeType: WorkflowDesignerNodeType;
}> = [
  { description: "Punto de entrada del proceso.", nodeType: "START" },
  { description: "Trabajo operativo con responsable.", nodeType: "STAGE" },
  { description: "Decisión de una persona o rol.", nodeType: "APPROVAL" },
  { description: "Salida de rechazo o corrección.", nodeType: "REJECTION" },
  { description: "Evalúa reglas controladas.", nodeType: "CONDITION" },
  { description: "Control de tiempos del flujo.", nodeType: "SLA" },
  { description: "Deriva la responsabilidad.", nodeType: "ESCALATION" },
  { description: "Envía una comunicación.", nodeType: "NOTIFICATION" },
  { description: "Cierra el recorrido.", nodeType: "END" },
];

export const createDefaultNodeConfiguration = (
  nodeType: WorkflowDesignerNodeType,
  processType: string,
  name = NODE_TYPE_DEFAULT_NAMES[nodeType],
): WorkflowDesignerNodeConfiguration => {
  const base = {
    description: null,
    name,
    schemaVersion: 1 as const,
  };

  switch (nodeType) {
    case "START":
      return {
        ...base,
        activationNote: null,
        initialWorkflowState: "DRAFT",
        nodeType,
        processType,
        triggerProcess: processType,
      } satisfies StartNodeConfiguration;
    case "STAGE":
      return {
        ...base,
        allowedActions: [
          "COMPLETE",
          "OBSERVE",
          "REQUEST_CORRECTION",
          "REASSIGN",
        ],
        areaId: null,
        assignmentStrategy: null,
        fallbackRoleId: null,
        fallbackStrategy: "STOP",
        fallbackUserId: null,
        fieldReference: null,
        nodeType,
        requiredComment: false,
        requiredEvidence: false,
        resultingState: null,
        roleId: null,
        sla: null,
        userId: null,
      } satisfies StageNodeConfiguration;
    case "APPROVAL":
      return {
        ...base,
        allowedActions: [
          "APPROVE",
          "REJECT",
          "OBSERVE",
          "REQUEST_CORRECTION",
          "REASSIGN",
        ],
        areaId: null,
        assignmentStrategy: null,
        commentRequired: false,
        electronicSignature: false,
        evidenceRequired: false,
        fallbackRoleId: null,
        fallbackStrategy: "STOP",
        fallbackUserId: null,
        fieldReference: null,
        nodeType,
        roleId: null,
        routeLabelOnApproval: null,
        routeLabelOnRejection: null,
        sla: null,
        stateAfterApproval: null,
        stateAfterRejection: null,
        userId: null,
      } satisfies ApprovalNodeConfiguration;
    case "REJECTION":
      return {
        ...base,
        behavior: "FINAL",
        finalResult: "REJECTED",
        nodeType,
        notifyRequester: true,
        preserveOriginalDeadline: true,
        requireComment: true,
        resultingState: null,
        returnTargetNodeKey: null,
      } satisfies RejectionNodeConfiguration;
    case "CONDITION":
      return {
        ...base,
        defaultRouteLabel: "Ruta alternativa",
        logicalOperator: "AND",
        nodeType,
        rules: [],
      } satisfies ConditionNodeConfiguration;
    case "SLA":
      return {
        ...base,
        actionOnBreach: "NOTIFY",
        duration: 24,
        escalationThreshold: null,
        nodeType,
        reminderThreshold: null,
        unit: "HOURS",
      } satisfies SlaNodeConfiguration;
    case "ESCALATION":
      return {
        ...base,
        areaId: null,
        escalationStrategy: "SUPERVISOR",
        fallbackUserId: null,
        nodeType,
        notifyNewAssignee: true,
        notifyPreviousAssignee: true,
        reassignCurrentTask: true,
        targetRoleId: null,
        targetUserId: null,
      } satisfies EscalationNodeConfiguration;
    case "NOTIFICATION":
      return {
        ...base,
        channel: "INTERNAL",
        includeRelatedRecordLink: true,
        includeWorkflowContext: true,
        nodeType,
        recipientAreaId: null,
        recipientRoleId: null,
        recipientStrategy: "CURRENT_ASSIGNEE",
        recipientUserId: null,
        subjectOverride: null,
        template: "genericNotification",
      } satisfies NotificationNodeConfiguration;
    case "END":
      return {
        ...base,
        completionMessage: null,
        finalResult: "APPROVED",
        finalWorkflowStatus: "COMPLETED",
        nodeType,
        notifyParticipants: true,
        relatedRecordTargetState: null,
      } satisfies EndNodeConfiguration;
  }
};

export const cloneConfiguration = (
  configuration: WorkflowDesignerNodeConfiguration,
): WorkflowDesignerNodeConfiguration =>
  JSON.parse(
    JSON.stringify(configuration),
  ) as WorkflowDesignerNodeConfiguration;

export const isAssignmentConfiguration = (
  configuration: WorkflowDesignerNodeConfiguration,
): configuration is StageNodeConfiguration | ApprovalNodeConfiguration =>
  configuration.nodeType === "STAGE" || configuration.nodeType === "APPROVAL";

export const getNodeMetadata = (
  configuration: WorkflowDesignerNodeConfiguration,
): string => {
  switch (configuration.nodeType) {
    case "APPROVAL":
    case "STAGE": {
      const strategy = configuration.assignmentStrategy
        ? ASSIGNMENT_STRATEGY_LABELS[configuration.assignmentStrategy]
        : "Sin asignar";
      return configuration.sla
        ? `${strategy} · SLA ${configuration.sla.duration} ${configuration.sla.unit.toLowerCase()}`
        : strategy;
    }
    case "CONDITION":
      return `${configuration.rules.length} regla${configuration.rules.length === 1 ? "" : "s"} · ${configuration.logicalOperator}`;
    case "NOTIFICATION":
      return `${configuration.channel === "EMAIL" ? "Email" : "Interna"} · ${configuration.recipientStrategy.toLowerCase().replaceAll("_", " ")}`;
    case "END":
      return configuration.finalResult;
    case "SLA":
      return `${configuration.duration} ${configuration.unit.toLowerCase()}`;
    case "ESCALATION":
      return configuration.escalationStrategy
        .toLowerCase()
        .replaceAll("_", " ");
    case "REJECTION":
      return configuration.behavior.replaceAll("_", " ").toLowerCase();
    case "START":
      return configuration.triggerProcess;
  }
};

const conditionHasValue = (operator: WorkflowConditionOperator): boolean =>
  !["IS_EMPTY", "IS_NOT_EMPTY", "IS_OVERDUE"].includes(operator);

export const validateConfiguration = (
  configuration: WorkflowDesignerNodeConfiguration,
  processType: string,
): string[] => {
  const errors: string[] = [];
  if (!configuration.name.trim()) {
    errors.push("El nombre del nodo es obligatorio.");
  }

  if (
    configuration.nodeType === "START" &&
    configuration.processType !== processType
  ) {
    errors.push("El proceso debe coincidir con el workflow.");
  }

  if (isAssignmentConfiguration(configuration)) {
    if (!configuration.assignmentStrategy) {
      errors.push("Seleccione una estrategia de asignación.");
    }
    const reference = configuration.assignmentStrategy
      ? {
          AREA: configuration.areaId,
          FIELD_REFERENCE: configuration.fieldReference,
          FIXED_USER: configuration.userId,
          OBSERVATION_RESPONSIBLE: null,
          RECORD_OWNER: null,
          REQUESTER: null,
          ROLE: configuration.roleId,
          SUPERVISOR: null,
        }[configuration.assignmentStrategy]
      : null;
    if (
      ["AREA", "FIELD_REFERENCE", "FIXED_USER", "ROLE"].includes(
        configuration.assignmentStrategy ?? "",
      ) &&
      !reference
    ) {
      errors.push("Complete la referencia de la estrategia seleccionada.");
    }
  }

  if (
    configuration.nodeType === "REJECTION" &&
    configuration.behavior === "RETURN_TO_STAGE" &&
    !configuration.returnTargetNodeKey
  ) {
    errors.push("Seleccione la etapa de retorno.");
  }

  if (configuration.nodeType === "CONDITION") {
    configuration.rules.forEach((rule, index) => {
      const hasValue =
        rule.value !== undefined && rule.value !== null && rule.value !== "";
      if (conditionHasValue(rule.operator) && !hasValue) {
        errors.push(`La regla ${index + 1} necesita un valor.`);
      }
      if (!conditionHasValue(rule.operator) && hasValue) {
        errors.push(`La regla ${index + 1} no admite un valor.`);
      }
      if (
        ["IN", "NOT_IN"].includes(rule.operator) &&
        !Array.isArray(rule.value)
      ) {
        errors.push(`La regla ${index + 1} necesita una lista de valores.`);
      }
    });
  }

  if (configuration.nodeType === "SLA" && configuration.duration <= 0) {
    errors.push("La duración del SLA debe ser mayor a cero.");
  }

  return errors;
};

export const getTransitionConditionGroup = (
  transition: WorkflowDesignerTransition,
) => transition.conditionGroup;
