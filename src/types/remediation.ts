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
  title: string;
  updatedAt: string;
}

export interface ActionPlanPayload {
  description: string;
  dueDate: string;
  observationAreaId: string;
  responsibleUserId: string;
  sortOrder?: number;
  title: string;
}

export type UpdateActionPlanPayload = Partial<ActionPlanPayload>;
export type ActionPlanScheduleRow = ActionPlanDetail;
