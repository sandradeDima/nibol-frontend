import type { ObservationUserSummary } from "./observations";

export type ActionPlanStatus =
  "NOT_STARTED" | "STARTED" | "WITH_PROGRESS" | "CONCLUDED";

export interface ActionPlanDetail {
  area: { id: string; name: string };
  areaResponsible: ObservationUserSummary;
  completedAt: string | null;
  createdAt: string;
  currentDueDate: string;
  description: string;
  evidenceCount: number;
  id: string;
  isOverdue: boolean;
  observation: {
    displayCode: string;
    id: string;
    observationNumber: number;
    reportNumber: string;
    title: string;
  };
  observationAreaId: string;
  originalDueDate: string;
  processOwner: ObservationUserSummary;
  progressEvaluationCount: number;
  progressPercent: number;
  responsibleUser: ObservationUserSummary;
  sortOrder: number;
  status: ActionPlanStatus;
  statusLabel: string;
  updatedAt: string;
}

export interface ActionPlanPayload {
  description: string;
  dueDate: string;
  observationAreaId: string;
  responsibleUserId: string;
  sortOrder?: number;
}

export type UpdateActionPlanPayload = Partial<ActionPlanPayload>;
export type ActionPlanScheduleRow = ActionPlanDetail;

export type RemediationPlanStatus =
  "DRAFT" | "SENT_TO_AUDIT" | "APPROVED" | "RETURNED" | "CLOSED";

export interface RemediationPlanDetail {
  additionalComments: string | null;
  area: { id: string; name: string };
  createdAt: string;
  id: string;
  mitigationText: string | null;
  observationId: string;
  ownerUser: ObservationUserSummary | null;
  returnReason: string | null;
  status: RemediationPlanStatus;
  strategyText: string;
  updatedAt: string;
  workflowInstanceId: string | null;
}

export interface RemediationPlanPayload {
  additionalComments?: string | null;
  areaId: string;
  mitigationText?: string | null;
  ownerUserId?: string | null;
  strategyText: string;
}

export type UpdateRemediationPlanPayload = Partial<
  Omit<RemediationPlanPayload, "areaId">
>;
