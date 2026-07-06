import type { ObservationAreaSummary, ObservationRiskLevel, ObservationUserSummary } from "./observations";

export type ProgressUpdateType = "ADVANCE" | "FINALIZATION" | "CORRECTION";

export type ProgressUpdateStatus =
  | "DRAFT"
  | "SENT_TO_AUDIT"
  | "APPROVED"
  | "RETURNED"
  | "REJECTED";

export type CommentVisibility = "INTERNAL_AUDIT" | "AREA_VISIBLE" | "SYSTEM";

export type ProgressReviewAction = "SENT" | "APPROVED" | "RETURNED" | "REJECTED";

export interface ProgressUserSummary extends ObservationUserSummary {
  roleLabel: string | null;
}

export interface ProgressPlanTarget {
  area: ObservationAreaSummary;
  id: string;
  ownerUser: ProgressUserSummary | null;
  responsibleUser: ProgressUserSummary | null;
  status: string;
}

export interface ProgressCommitmentTarget {
  id: string;
  progressPercent: number;
  remediationPlanId: string;
  responsibleUser: ProgressUserSummary | null;
  status: string;
  title: string;
}

export interface ProgressReviewHistoryEntry {
  action: ProgressReviewAction;
  comment: string | null;
  createdAt: string;
  fromStatus: ProgressUpdateStatus | null;
  id: string;
  toStatus: ProgressUpdateStatus;
  user: ProgressUserSummary;
}

export interface EvidenceFileItem {
  canDelete: boolean;
  commitmentId: string | null;
  createdAt: string;
  description: string | null;
  downloadPath: string;
  id: string;
  mimeType: string;
  originalName: string;
  progressUpdateId: string | null;
  remediationPlanId: string | null;
  sizeBytes: string;
  uploadedByUser: ProgressUserSummary;
}

export interface ObservationCommentItem {
  authorUser: ProgressUserSummary;
  body: string;
  canDelete: boolean;
  canEdit: boolean;
  commitmentId: string | null;
  createdAt: string;
  id: string;
  progressUpdateId: string | null;
  remediationPlanId: string | null;
  updatedAt: string;
  visibility: CommentVisibility;
}

export interface ProgressUpdateItem {
  canApprove: boolean;
  canEdit: boolean;
  canReject: boolean;
  canReturn: boolean;
  canSendToAudit: boolean;
  comment: string;
  commitmentId: string | null;
  createdAt: string;
  evidences: EvidenceFileItem[];
  history: ProgressReviewHistoryEntry[];
  id: string;
  progressPercent: number | null;
  remediationPlanId: string | null;
  reviewComment: string | null;
  reviewedAt: string | null;
  reviewedByUser: ProgressUserSummary | null;
  status: ProgressUpdateStatus;
  submittedByUser: ProgressUserSummary;
  type: ProgressUpdateType;
  updatedAt: string;
}

export interface ObservationProgressWorkspace {
  canComment: boolean;
  canCreateProgress: boolean;
  canReview: boolean;
  canUploadEvidence: boolean;
  commitments: ProgressCommitmentTarget[];
  plans: ProgressPlanTarget[];
  progressUpdates: ProgressUpdateItem[];
}

export interface ProgressUpdateTableRow {
  area: ObservationAreaSummary;
  canEdit: boolean;
  canReview: boolean;
  canSendToAudit: boolean;
  createdAt: string;
  evidenceCount: number;
  evidencePending: boolean;
  id: string;
  observation: {
    code: string;
    id: string;
    title: string;
  };
  progressPercent: number | null;
  responsibleUser: ProgressUserSummary | null;
  riskLevel: ObservationRiskLevel;
  sentToAuditAt: string | null;
  status: ProgressUpdateStatus;
  type: ProgressUpdateType;
}

export interface CreateProgressUpdateInput {
  comment: string;
  commitmentId?: string | null;
  progressPercent?: number | null;
  remediationPlanId?: string | null;
  type: ProgressUpdateType;
}

export type UpdateProgressUpdateInput = Partial<CreateProgressUpdateInput>;

export interface ReviewProgressUpdateInput {
  comment?: string | null;
}

export interface CreateObservationCommentInput {
  body: string;
  progressUpdateId?: string | null;
  visibility?: CommentVisibility;
}

export interface UpdateObservationCommentInput {
  body?: string;
  visibility?: CommentVisibility;
}
