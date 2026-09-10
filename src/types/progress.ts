import type { ActionPlanStatus } from "./remediation";
import type { ObservationUserSummary } from "./observations";

export type ProgressEvaluationType = "ADVANCE" | "FINALIZATION";
export type ProgressEvaluationReviewStatus =
  | "DRAFT"
  | "SENT_TO_AUDIT"
  | "APPROVED"
  | "RETURNED";
export type ProgressReviewAction = "SENT" | "APPROVED" | "RETURNED";
export type CommentVisibility = "INTERNAL_AUDIT" | "AREA_VISIBLE" | "SYSTEM";

export interface EvidenceFileItem {
  actionPlanId?: string | null;
  actionPlanTitle?: string | null;
  context: "FINDING" | "ACTION_PLAN" | "PROGRESS_EVALUATION" | "CLOSURE";
  createdAt: string;
  description: string | null;
  downloadPath: string;
  id: string;
  mimeType: string;
  observationArea: { id: string; name: string } | null;
  originalName: string;
  progressEvaluationId?: string | null;
  reviewComment: string | null;
  reviewedAt: string | null;
  reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "RETURNED" | "REJECTED";
  sizeBytes: number;
  submittedAt: string | null;
  uploadedByUser?: ObservationUserSummary;
  workflowInstanceId: string | null;
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
  };
  evaluatedStatus: ActionPlanStatus | null;
  comment: string;
  evidence: EvidenceFileItem[];
  history: ProgressReviewHistoryEntry[];
  id: string;
  observation: { displayCode: string; id: string; title: string };
  officialProgressPercent: number;
  officialStatus: ActionPlanStatus;
  reportedProgressPercent: number | null;
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
  comment: string;
  reportedProgressPercent: number;
  type: ProgressEvaluationType;
}

export type UpdateProgressEvaluationInput =
  Partial<CreateProgressEvaluationInput>;
export interface ReviewProgressEvaluationInput {
  comment?: string | null;
  officialStatus: ActionPlanStatus;
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
