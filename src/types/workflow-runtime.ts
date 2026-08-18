export type WorkflowRuntimeUser = {
  email: string;
  id: string;
  name: string;
};

export type WorkflowRuntimeAssignment = {
  id: string;
  name: string;
};

export type WorkflowRuntimeVersion = {
  id: string;
  status: string;
  versionNumber: number;
};

export type WorkflowSpecialRequestSummary = {
  description: string;
  reference: string;
  title: string;
};

export type WorkflowEvidenceReviewSummary = {
  context: string;
  originalName: string;
};

export type WorkflowStartOptions = {
  areas: WorkflowRuntimeAssignment[];
  riskLevels: Array<{ key: string | null; name: string }>;
  users: WorkflowRuntimeUser[];
  workflows: Array<{
    activeVersion: { id: string; versionNumber: number } | null;
    description: string | null;
    id: string;
    name: string;
  }>;
};

export type WorkflowInstanceStartInput = {
  context?: {
    areaId?: string;
    custom?: Record<string, unknown>;
    dueDate?: string;
    requestType?: string;
    responsibleUserId?: string;
    riskLevel?: string;
  };
  entityId: string;
  entityType: string;
  processType: string;
  workflowDefinitionId?: string;
};

export type WorkflowRuntimeNode = {
  configuration?: unknown;
  id: string;
  name: string;
  nodeKey: string;
  type: string;
};

export type WorkflowRuntimeTaskAction =
  "APPROVE" | "COMPLETE" | "OBSERVE" | "REJECT" | "REQUEST_CORRECTION";

export type WorkflowTaskListItem = {
  assignedArea: WorkflowRuntimeAssignment | null;
  assignedRole: WorkflowRuntimeAssignment | null;
  assignedUser: WorkflowRuntimeUser | null;
  assignmentStrategy: string;
  allowedActions: string[];
  createdAt: string;
  dueAt: string | null;
  dueState: "DUE_SOON" | "NO_SLA" | "ON_TIME" | "OVERDUE";
  entrySequence: number;
  id: string;
  instance: {
    entityId: string;
    entityType: string;
    evidenceReview: WorkflowEvidenceReviewSummary | null;
    id: string;
    processType: string;
    relatedRecordUrl: string | null;
    specialRequest: WorkflowSpecialRequestSummary | null;
    startedBy: WorkflowRuntimeUser;
    version: WorkflowRuntimeVersion;
    workflow: {
      id: string;
      name: string;
      processType: string;
    };
  };
  node: WorkflowRuntimeNode;
  priority: string | null;
  status: string;
};

export type WorkflowTaskDetail = {
  assignedArea: WorkflowRuntimeAssignment | null;
  assignedRole: WorkflowRuntimeAssignment | null;
  assignedUser: WorkflowRuntimeUser | null;
  assignmentSnapshot: unknown;
  canAct: boolean;
  comments: string | null;
  completedAt: string | null;
  createdAt: string;
  decision: string | null;
  dueAt: string | null;
  dueState: "DUE_SOON" | "NO_SLA" | "ON_TIME" | "OVERDUE";
  entrySequence: number;
  evidenceReferences: unknown;
  id: string;
  instance: {
    entityId: string;
    entityType: string;
    evidenceReview: WorkflowEvidenceReviewSummary | null;
    id: string;
    processType: string;
    relatedRecordUrl: string | null;
    specialRequest: WorkflowSpecialRequestSummary | null;
    startedAt: string;
    startedBy: WorkflowRuntimeUser;
    status: string;
    version: WorkflowRuntimeVersion;
    workflow: {
      id: string;
      name: string;
      processType: string;
      status: string;
    };
  };
  node: WorkflowRuntimeNode;
  status: string;
  allowedActions: string[];
};

export type WorkflowTimelineEvent = {
  actor: WorkflowRuntimeUser | null;
  comment?: string | null;
  date: string;
  decision?: string | null;
  details?: unknown;
  eventType: string;
  fromNode?: WorkflowRuntimeNode | null;
  node?: WorkflowRuntimeNode | null;
  taskId?: string;
  toNode?: WorkflowRuntimeNode | null;
};

export type WorkflowInstanceDetail = {
  completedAt: string | null;
  context: Record<string, unknown>;
  currentNode: WorkflowRuntimeNode | null;
  currentTask: {
    id: string;
    status: string;
  } | null;
  definition: {
    id: string;
    name: string;
    processType: string;
    status: string;
  };
  entityId: string;
  entityType: string;
  evidenceReview: WorkflowEvidenceReviewSummary | null;
  relatedRecordUrl: string | null;
  specialRequest: WorkflowSpecialRequestSummary | null;
  finalResult: string | null;
  id: string;
  runtimeError: { code: string; message: string | null } | null;
  startedAt: string;
  startedBy: WorkflowRuntimeUser;
  status: string;
  tasks: Array<{
    assignedArea: WorkflowRuntimeAssignment | null;
    assignedRole: WorkflowRuntimeAssignment | null;
    assignedUser: WorkflowRuntimeUser | null;
    assignmentSnapshot: unknown;
    comments: string | null;
    completedAt: string | null;
    createdAt: string;
    decision: string | null;
    dueAt: string | null;
    entrySequence: number;
    id: string;
    node: WorkflowRuntimeNode;
    status: string;
    timers: Array<{
      executeAt: string;
      executedAt: string | null;
      id: string;
      lastError: string | null;
      status: string;
      timerType: string;
    }>;
  }>;
  timeline: WorkflowTimelineEvent[];
  version: WorkflowRuntimeVersion;
  workflow: {
    id: string;
    name: string;
    processType: string;
    status: string;
  };
};

export type WorkflowTaskListParams = {
  dueState?: "ALL" | "DUE_SOON" | "NO_SLA" | "ON_TIME" | "OVERDUE";
  page?: number;
  perPage?: number;
  processType?: string;
  search?: string;
};
