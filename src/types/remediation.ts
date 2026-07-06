import type { ObservationRiskLevel, ObservationUserSummary } from "./observations";

export type RemediationPlanStatus =
  | "DRAFT"
  | "SENT_TO_AUDIT"
  | "APPROVED"
  | "RETURNED"
  | "CLOSED";

export type CommitmentStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SENT_TO_AUDIT"
  | "APPROVED"
  | "RETURNED"
  | "COMPLETED"
  | "OVERDUE";

export interface RemediationAreaSummary {
  id: string;
  name: string;
}

export interface RemediationEffectiveStatus {
  key: string;
  name: string;
}

export interface RemediationObservationSummary {
  area: RemediationAreaSummary;
  auditorUser: ObservationUserSummary;
  code: string;
  dueDate: string;
  effectiveStatus: RemediationEffectiveStatus;
  id: string;
  responsibleUser: ObservationUserSummary | null;
  riskLevel: ObservationRiskLevel;
  title: string;
}

export interface RemediationPlanSummary {
  commitmentCount: number;
  id: string;
  nextDueDate: string | null;
  overdueCommitmentCount: number;
  progressPercent: number;
  status: RemediationPlanStatus;
  updatedAt: string;
}

export interface RemediationPlanDetail extends RemediationPlanSummary {
  additionalComments: string | null;
  approvedAt: string | null;
  approvedByUser: ObservationUserSummary | null;
  area: RemediationAreaSummary;
  canApprove: boolean;
  canEdit: boolean;
  canReturn: boolean;
  canSendToAudit: boolean;
  createdAt: string;
  createdByUser: ObservationUserSummary;
  mitigationText: string | null;
  observationId: string;
  ownerUser: ObservationUserSummary | null;
  responsibleUser: ObservationUserSummary | null;
  returnReason: string | null;
  returnedAt: string | null;
  returnedByUser: ObservationUserSummary | null;
  sentToAuditAt: string | null;
  status: RemediationPlanStatus;
  strategyText: string;
}

export interface RemediationWorkspaceArea {
  area: RemediationAreaSummary;
  canManagePlan: boolean;
  isPrimary: boolean;
  managerUser: ObservationUserSummary | null;
  plan: RemediationPlanSummary | null;
  responsibleUser: ObservationUserSummary | null;
  roleInFinding: string | null;
}

export interface ObservationRemediationWorkspace {
  areas: RemediationWorkspaceArea[];
  canManageSelectedArea: boolean;
  canReview: boolean;
  observation: RemediationObservationSummary;
  plan: RemediationPlanDetail | null;
  selectedAreaId: string;
}

export interface CommitmentDetail {
  canDelete: boolean;
  canEditStructure: boolean;
  canMarkComplete: boolean;
  canReview: boolean;
  canSendToAudit: boolean;
  canUpdateProgress: boolean;
  completedAt: string | null;
  createdAt: string;
  description: string | null;
  dueDate: string;
  effectiveStatus: RemediationEffectiveStatus;
  id: string;
  isOverdue: boolean;
  observationId: string;
  progressPercent: number;
  remediationPlanId: string;
  responsibleUser: ObservationUserSummary | null;
  sortOrder: number;
  status: CommitmentStatus;
  title: string;
  updatedAt: string;
}

export interface RemediationPlanTableRow {
  area: RemediationAreaSummary;
  canEdit: boolean;
  canReview: boolean;
  canSendToAudit: boolean;
  commitmentCount: number;
  id: string;
  nextDueDate: string | null;
  observation: Pick<RemediationObservationSummary, "code" | "id" | "title">;
  overdueCommitmentCount: number;
  progressPercent: number;
  responsibleUser: ObservationUserSummary | null;
  riskLevel: ObservationRiskLevel;
  status: RemediationPlanStatus;
  updatedAt: string;
}

export interface CommitmentScheduleRow {
  area: RemediationAreaSummary;
  canMarkComplete: boolean;
  canSendToAudit: boolean;
  completedAt: string | null;
  dueDate: string;
  effectiveStatus: RemediationEffectiveStatus;
  id: string;
  isOverdue: boolean;
  observation: Pick<RemediationObservationSummary, "code" | "id" | "title">;
  planStatus: RemediationPlanStatus;
  progressPercent: number;
  responsibleUser: ObservationUserSummary | null;
  status: CommitmentStatus;
  title: string;
  updatedAt: string;
}

export interface RemediationPlanPayload {
  additionalComments?: string | null;
  areaId: string;
  mitigationText?: string | null;
  ownerUserId?: string | null;
  strategyText: string;
}

export interface UpdateRemediationPlanPayload {
  additionalComments?: string | null;
  mitigationText?: string | null;
  ownerUserId?: string | null;
  strategyText?: string;
}

export interface CommitmentPayload {
  description?: string | null;
  dueDate: string;
  progressPercent?: number;
  responsibleUserId?: string | null;
  sortOrder?: number;
  status?: CommitmentStatus;
  title: string;
}

export type UpdateCommitmentPayload = Partial<CommitmentPayload>;

