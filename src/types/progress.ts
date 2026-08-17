import type { ActionPlanStatus } from "./remediation";
import type { ObservationUserSummary } from "./observations";

export type ProgressEvaluationType = "ADVANCE" | "FINALIZATION" | "CORRECTION";
export type ProgressEvaluationReviewStatus =
  "DRAFT" | "SENT_TO_AUDIT" | "APPROVED" | "RETURNED" | "REJECTED";
export type ProgressReviewAction =
  "SENT" | "APPROVED" | "RETURNED" | "REJECTED";
export type CommentVisibility = "INTERNAL_AUDIT" | "AREA_VISIBLE" | "SYSTEM";

export interface EvidenceFileItem {
  context: "FINDING" | "ACTION_PLAN" | "PROGRESS_EVALUATION" | "CLOSURE";
  createdAt: string;
  description: string | null;
  downloadPath: string;
  id: string;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
}

export interface ProgressReviewHistoryEntry {
  action: ProgressReviewAction;
  comment: string | null;
  createdAt: string;
  fromStatus: ProgressEvaluationReviewStatus | null;
  id: string;
  toStatus: ProgressEvaluationReviewStatus;
  user: ObservationUserSummary;
}

export interface ProgressEvaluationItem {
  actionPlan: {
    area: { id: string; name: string };
    id: string;
    responsibleUser: ObservationUserSummary;
    title: string;
  };
  actionPlanStatus: ActionPlanStatus;
  comment: string;
  evidence: EvidenceFileItem[];
  history: ProgressReviewHistoryEntry[];
  id: string;
  observation: { displayCode: string; id: string; title: string };
  progressPercent: number;
  reviewedAt: string | null;
  reviewedByUser: ObservationUserSummary | null;
  reviewComment: string | null;
  reviewStatus: ProgressEvaluationReviewStatus;
  submittedAt: string;
  submittedByUser: ObservationUserSummary;
  type: ProgressEvaluationType;
  updatedAt: string;
  workflowInstanceId: string | null;
}

export interface CreateProgressEvaluationInput {
  actionPlanStatus: ActionPlanStatus;
  comment: string;
  progressPercent: number;
  type: ProgressEvaluationType;
}

export type UpdateProgressEvaluationInput =
  Partial<CreateProgressEvaluationInput>;
export interface ReviewProgressEvaluationInput {
  comment?: string | null;
}

export interface ObservationCommentItem {
  actionPlanId: string | null;
  authorUser: ObservationUserSummary;
  body: string;
  canDelete: boolean;
  canEdit: boolean;
  createdAt: string;
  id: string;
  progressEvaluationId: string | null;
  updatedAt: string;
  visibility: CommentVisibility;
}

export interface CreateObservationCommentInput {
  actionPlanId?: string | null;
  body: string;
  progressEvaluationId?: string | null;
  visibility?: CommentVisibility;
}
export type UpdateObservationCommentInput =
  Partial<CreateObservationCommentInput>;
export type ProgressEvaluationTableRow = ProgressEvaluationItem;
