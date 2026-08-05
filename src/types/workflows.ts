export type WorkflowDefinitionStatus =
  "DRAFT" | "PUBLISHED" | "INACTIVE" | "ARCHIVED";

export type WorkflowVersionStatus = WorkflowDefinitionStatus;

export interface WorkflowUserSummary {
  email: string;
  id: string;
  name: string;
}

export interface WorkflowVersionSummary {
  _count?: {
    instances: number;
  };
  changeDescription?: string | null;
  createdAt?: string;
  createdBy?: WorkflowUserSummary;
  definition?: {
    activeVersion?: {
      id: string;
      status: WorkflowVersionStatus;
      versionNumber: number;
    } | null;
    id: string;
    name: string;
    processType: string;
    status: WorkflowDefinitionStatus;
  };
  id: string;
  publishedAt?: string | null;
  publishedBy?: WorkflowUserSummary | null;
  status: WorkflowVersionStatus;
  versionNumber: number;
}

export interface WorkflowDefinitionListItem {
  _count: {
    instances: number;
    versions: number;
  };
  activeVersion: WorkflowVersionSummary | null;
  archivedAt: string | null;
  createdAt: string;
  createdBy: WorkflowUserSummary;
  description: string | null;
  id: string;
  latestVersion: WorkflowVersionSummary | null;
  name: string;
  processType: string;
  status: WorkflowDefinitionStatus;
  updatedAt: string;
}

export type WorkflowDefinitionDetail = WorkflowDefinitionListItem;

export interface WorkflowSummary {
  archived: number;
  drafts: number;
  inactive: number;
  published: number;
  total: number;
}

export interface WorkflowProcessOption {
  description: string | null;
  key: string;
  name: string;
}

export interface WorkflowOptions {
  creators: WorkflowUserSummary[];
  processes: WorkflowProcessOption[];
}

export interface WorkflowNode {
  assignmentStrategy: string | null;
  configurationJson: unknown;
  createdAt: string;
  description: string | null;
  id: string;
  name: string;
  nodeKey: string;
  positionX: number;
  positionY: number;
  type: string;
  updatedAt: string;
}

export interface WorkflowTransition {
  conditionGroup: unknown | null;
  id: string;
  label: string | null;
  priority: number;
  sourceNode: {
    id: string;
    nodeKey: string;
  };
  targetNode: {
    id: string;
    nodeKey: string;
  };
  transitionType: string | null;
}

export interface WorkflowVersionCounts {
  conditionGroups: number;
  instances: number;
  nodes: number;
  transitions: number;
}

export interface WorkflowVersionDetail extends WorkflowVersionSummary {
  _count: WorkflowVersionCounts;
  conditionGroups: Array<{
    conditions: Array<{
      description: string | null;
      field: string;
      id: string;
      operator: string;
      sequence: number;
      valueJson: unknown;
    }>;
    description: string | null;
    id: string;
    logicOperator: string;
  }>;
  counts: WorkflowVersionCounts;
  definition: {
    activeVersion?: {
      id: string;
      status: WorkflowVersionStatus;
      versionNumber: number;
    } | null;
    id: string;
    name: string;
    processType: string;
    status: WorkflowDefinitionStatus;
  };
  nodes: WorkflowNode[];
  transitions: WorkflowTransition[];
}

export interface WorkflowActivityItem {
  action: string;
  createdAt: string;
  entityId: string | null;
  entityType: string;
  id: string;
  metadata: unknown;
  user: WorkflowUserSummary | null;
}

export interface CreateWorkflowInput {
  description: string | null;
  name: string;
  processType: string;
  versionNotes: string | null;
}

export interface UpdateWorkflowMetadataInput {
  description?: string | null;
  name?: string;
  processType?: string;
}

export interface CreateDraftVersionInput {
  changeDescription: string | null;
  sourceVersionId?: string;
}

export interface DuplicateWorkflowInput {
  description?: string | null;
  name?: string;
  sourceVersionId?: string;
  versionNotes: string | null;
}

export type WorkflowDesignerNodeType =
  | "START"
  | "STAGE"
  | "APPROVAL"
  | "REJECTION"
  | "CONDITION"
  | "SLA"
  | "ESCALATION"
  | "NOTIFICATION"
  | "END";

export type WorkflowAssignmentStrategy =
  | "FIXED_USER"
  | "ROLE"
  | "AREA"
  | "RECORD_OWNER"
  | "OBSERVATION_RESPONSIBLE"
  | "REQUESTER"
  | "SUPERVISOR"
  | "FIELD_REFERENCE";

export type WorkflowConditionField =
  | "riskLevel"
  | "observationStatus"
  | "areaId"
  | "processType"
  | "responsibleUserId"
  | "dueDate"
  | "daysOverdue"
  | "hasEvidence"
  | "evidenceCount"
  | "remediationPlanStatus"
  | "requestType"
  | "requestedExtensionDays"
  | "previousDecision";

export type WorkflowConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "LESS_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN_OR_EQUAL"
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "IS_EMPTY"
  | "IS_NOT_EMPTY"
  | "IN"
  | "NOT_IN"
  | "IS_OVERDUE"
  | "DUE_WITHIN";

export type WorkflowConditionValue =
  string | number | boolean | Array<string | number | boolean> | null;

export type WorkflowConditionRule = {
  field: WorkflowConditionField;
  operator: WorkflowConditionOperator;
  resultLabel: string | null;
  value?: WorkflowConditionValue;
};

export type WorkflowSlaInline = {
  duration: number;
  escalationEnabled: boolean;
  escalationThreshold: number | null;
  reminderEnabled: boolean;
  reminderThreshold: number | null;
  unit: "MINUTES" | "HOURS" | "BUSINESS_DAYS" | "CALENDAR_DAYS";
};

type WorkflowNodeConfigurationBase<TNodeType extends WorkflowDesignerNodeType> =
  {
    description: string | null;
    name: string;
    nodeType: TNodeType;
    schemaVersion: 1;
  };

export type StartNodeConfiguration = WorkflowNodeConfigurationBase<"START"> & {
  initialWorkflowState: string;
  processType: string;
  triggerProcess: string;
  activationNote: string | null;
};

export type StageNodeConfiguration = WorkflowNodeConfigurationBase<"STAGE"> & {
  allowedActions: Array<
    "COMPLETE" | "OBSERVE" | "REQUEST_CORRECTION" | "REASSIGN"
  >;
  areaId: string | null;
  assignmentStrategy: WorkflowAssignmentStrategy | null;
  fallbackRoleId: string | null;
  fallbackStrategy: "STOP" | "ROLE" | "USER" | "ADMINISTRATOR" | null;
  fallbackUserId: string | null;
  fieldReference: string | null;
  requiredComment: boolean;
  requiredEvidence: boolean;
  resultingState: string | null;
  roleId: string | null;
  sla: WorkflowSlaInline | null;
  userId: string | null;
};

export type ApprovalNodeConfiguration =
  WorkflowNodeConfigurationBase<"APPROVAL"> & {
    allowedActions: Array<
      "APPROVE" | "REJECT" | "OBSERVE" | "REQUEST_CORRECTION" | "REASSIGN"
    >;
    areaId: string | null;
    assignmentStrategy: WorkflowAssignmentStrategy | null;
    commentRequired: boolean;
    electronicSignature: boolean;
    evidenceRequired: boolean;
    fallbackRoleId: string | null;
    fallbackStrategy: "STOP" | "ROLE" | "USER" | "ADMINISTRATOR" | null;
    fallbackUserId: string | null;
    fieldReference: string | null;
    roleId: string | null;
    routeLabelOnApproval: string | null;
    routeLabelOnRejection: string | null;
    sla: WorkflowSlaInline | null;
    stateAfterApproval: string | null;
    stateAfterRejection: string | null;
    userId: string | null;
  };

export type RejectionNodeConfiguration =
  WorkflowNodeConfigurationBase<"REJECTION"> & {
    behavior: "FINAL" | "RETURN_TO_STAGE" | "REQUEST_CORRECTION" | "KEEP_STATE";
    finalResult: "REJECTED" | "CORRECTION_REQUESTED" | "CURRENT_STATE";
    notifyRequester: boolean;
    preserveOriginalDeadline: boolean;
    requireComment: boolean;
    resultingState: string | null;
    returnTargetNodeKey: string | null;
  };

export type ConditionNodeConfiguration =
  WorkflowNodeConfigurationBase<"CONDITION"> & {
    defaultRouteLabel: string | null;
    logicalOperator: "AND" | "OR";
    rules: WorkflowConditionRule[];
  };

export type SlaNodeConfiguration = WorkflowNodeConfigurationBase<"SLA"> & {
  actionOnBreach:
    "NOTIFY" | "ESCALATE" | "REASSIGN" | "MARK_OVERDUE" | "ALTERNATE_ROUTE";
  duration: number;
  escalationThreshold: number | null;
  reminderThreshold: number | null;
  unit: WorkflowSlaInline["unit"];
};

export type EscalationNodeConfiguration =
  WorkflowNodeConfigurationBase<"ESCALATION"> & {
    areaId: string | null;
    escalationStrategy: "ROLE" | "FIXED_USER" | "AREA_MANAGER" | "SUPERVISOR";
    fallbackUserId: string | null;
    notifyNewAssignee: boolean;
    notifyPreviousAssignee: boolean;
    reassignCurrentTask: boolean;
    targetRoleId: string | null;
    targetUserId: string | null;
  };

export type NotificationNodeConfiguration =
  WorkflowNodeConfigurationBase<"NOTIFICATION"> & {
    channel: "INTERNAL" | "EMAIL";
    includeRelatedRecordLink: boolean;
    includeWorkflowContext: boolean;
    recipientAreaId: string | null;
    recipientRoleId: string | null;
    recipientStrategy:
      | "CURRENT_ASSIGNEE"
      | "REQUESTER"
      | "PREVIOUS_APPROVER"
      | "FIXED_USER"
      | "ROLE"
      | "AREA_MANAGER"
      | "OBSERVATION_RESPONSIBLE";
    recipientUserId: string | null;
    subjectOverride: string | null;
    template: string;
  };

export type EndNodeConfiguration = WorkflowNodeConfigurationBase<"END"> & {
  completionMessage: string | null;
  finalResult:
    "APPROVED" | "REJECTED" | "CLOSED" | "RETURNED" | "CANCELLED" | "EXPIRED";
  finalWorkflowStatus: string;
  notifyParticipants: boolean;
  relatedRecordTargetState: string | null;
};

export type WorkflowDesignerNodeConfiguration =
  | StartNodeConfiguration
  | StageNodeConfiguration
  | ApprovalNodeConfiguration
  | RejectionNodeConfiguration
  | ConditionNodeConfiguration
  | SlaNodeConfiguration
  | EscalationNodeConfiguration
  | NotificationNodeConfiguration
  | EndNodeConfiguration;

export interface WorkflowDesignerNode extends Omit<
  WorkflowNode,
  "configurationJson" | "type"
> {
  configurationJson: WorkflowDesignerNodeConfiguration;
  type: WorkflowDesignerNodeType;
}

export interface WorkflowDesignerTransition extends Omit<
  WorkflowTransition,
  "conditionGroup"
> {
  conditionGroup: {
    conditions: Array<{
      description: string | null;
      field: WorkflowConditionField;
      id: string;
      operator: WorkflowConditionOperator;
      sequence: number;
      valueJson: unknown;
    }>;
    description: string | null;
    id: string;
    logicOperator: "AND" | "OR";
  } | null;
}

export interface WorkflowDesignerData {
  canEdit: boolean;
  canValidate: boolean;
  definition: {
    id: string;
    name: string;
    processType: string;
    status: WorkflowDefinitionStatus;
  };
  lastSavedAt: string | null;
  nodes: WorkflowDesignerNode[];
  transitions: WorkflowDesignerTransition[];
  version: {
    changeDescription: string | null;
    id: string;
    publishedAt: string | null;
    status: WorkflowVersionStatus;
    versionNumber: number;
  };
}

export interface WorkflowDesignerOptions {
  areas: Array<{
    id: string;
    managerUser: WorkflowUserSummary | null;
    name: string;
  }>;
  assignmentStrategies: Array<{
    key: WorkflowAssignmentStrategy;
    label: string;
  }>;
  catalogs: {
    observationStatuses: Array<{ key: string; name: string }>;
    riskLevels: Array<{ key: string; name: string }>;
  };
  conditionFields: Array<{ key: WorkflowConditionField; label: string }>;
  conditionOperators: Array<{
    key: WorkflowConditionOperator;
    label: string;
    requiresValue: boolean;
  }>;
  notificationTemplates: Array<{ key: string; name: string }>;
  roles: Array<{ description: string | null; id: string; name: string }>;
  users: WorkflowUserSummary[];
}

export interface WorkflowDesignerSaveInput {
  nodes: Array<{
    assignmentStrategy: WorkflowAssignmentStrategy | null;
    configurationJson: WorkflowDesignerNodeConfiguration;
    description: string | null;
    id?: string;
    name: string;
    nodeKey: string;
    positionX: number;
    positionY: number;
    type: WorkflowDesignerNodeType;
  }>;
  transitions: Array<{
    conditionGroup?: {
      conditions: Array<
        WorkflowConditionRule & {
          description: string | null;
          sequence?: number;
        }
      >;
      description: string | null;
      id?: string;
      logicOperator: "AND" | "OR";
    } | null;
    conditionGroupId?: string | null;
    id?: string;
    label: string | null;
    priority: number;
    sourceNodeId: string;
    targetNodeId: string;
    transitionType: string | null;
  }>;
}

export interface WorkflowDesignerValidationIssue {
  code: string;
  message: string;
  nodeId?: string;
  nodeKey?: string;
  severity: "ERROR" | "WARNING";
  suggestedAction?: string;
  transitionId?: string;
}

export interface WorkflowDesignerValidationResult {
  errors: WorkflowDesignerValidationIssue[];
  graphHash?: string;
  isValid: boolean;
  publicationReady: boolean;
  summary: {
    cycleCount: number;
    endNodeCount: number;
    nodeCount: number;
    reachableNodeCount: number;
    routeCountEstimate: number;
    startNodeCount: number;
    transitionCount: number;
    unreachableNodeCount: number;
  };
  warnings: WorkflowDesignerValidationIssue[];
}

export interface WorkflowSimulationContext {
  areaId?: string | null;
  currentNodeKey?: string | null;
  daysOverdue?: number | null;
  dueDate?: string | null;
  evidenceCount?: number | null;
  hasEvidence?: boolean | null;
  observationStatus?: string | null;
  previousDecision?: string | null;
  processType: string;
  remediationPlanStatus?: string | null;
  requestType?: string | null;
  requestedExtensionDays?: number | null;
  requesterUserId?: string | null;
  responsibleUserId?: string | null;
  riskLevel?: string | null;
}

export interface WorkflowSimulationInput {
  context: Partial<WorkflowSimulationContext> & { processType?: string };
  nodeDecisions: Record<string, string>;
  scenarioName?: string;
}

export interface WorkflowSimulationStep {
  evaluationDetails?: Array<{
    logicOperator: "AND" | "OR";
    matched: boolean;
    results: Array<{
      actualValue: unknown;
      conditionId: string;
      expectedValue: unknown;
      field: string;
      matched: boolean;
      message: string;
      operator: string;
    }>;
  }>;
  errors: WorkflowDesignerValidationIssue[];
  inputContext: WorkflowSimulationContext;
  nodeId: string;
  nodeKey: string;
  nodeName: string;
  nodeType: string;
  projectedAssignment?: {
    areaId?: string;
    fallbackApplied: boolean;
    kind: string;
    roleId?: string;
    strategy: string;
    userId?: string;
    warnings: string[];
    errors: string[];
  };
  projectedNotification?: {
    channel: string;
    recipientStrategy: string;
    template: string;
  };
  projectedSla?: {
    duration: number;
    escalationThreshold: number | null;
    reminderThreshold: number | null;
    unit: string;
  };
  resultingContext: WorkflowSimulationContext;
  selectedDecision?: string;
  selectedTransition?: {
    id?: string;
    label: string | null;
    targetNodeId: string;
    targetNodeKey: string;
    transitionType: string;
  };
  sequence: number;
  warnings: WorkflowDesignerValidationIssue[];
}

export interface WorkflowSimulationResult {
  completedAt: string;
  errors: WorkflowDesignerValidationIssue[];
  finalNodeId?: string;
  finalResult?: string;
  route: WorkflowSimulationStep[];
  scenarioName?: string;
  startedAt: string;
  success: boolean;
  summary: {
    evaluatedConditions: number;
    projectedNotifications: number;
    projectedTimers: number;
    resolvedAssignments: number;
    visitedNodes: number;
  };
  versionId: string;
  warnings: WorkflowDesignerValidationIssue[];
}

export interface WorkflowPublishResult {
  definition: WorkflowDefinitionDetail;
  graphHash: string;
  previousActiveVersion: WorkflowVersionSummary | null;
  validation: WorkflowDesignerValidationResult;
  version: {
    id: string;
    publishedAt: string;
    publishedById: string;
    status: WorkflowVersionStatus;
    versionNumber: number;
  };
}
