import type {
  ObservationAreaSummary,
  ObservationRiskLevel,
  ObservationUserSummary,
} from "./observations";

export type ExtensionRequestStatus =
  | "DRAFT"
  | "SENT_TO_MANAGER"
  | "MANAGER_APPROVED"
  | "MANAGER_REJECTED"
  | "SENT_TO_AUDIT"
  | "AUDIT_APPROVED"
  | "AUDIT_REJECTED"
  | "CANCELLED";

export interface ExtensionRequestAreaSummary extends ObservationAreaSummary {
  managerUser: ObservationUserSummary | null;
}

export interface ExtensionRequestEvidenceItem {
  createdAt: string;
  description: string | null;
  downloadPath: string;
  id: string;
  mimeType: string;
  originalName: string;
  sizeBytes: string;
  uploadedByUser: ObservationUserSummary;
}

export interface ExtensionRequestEffectiveStatus {
  key: string;
  name: string;
}

export interface ExtensionRequestObservationSummary {
  area: ExtensionRequestAreaSummary;
  auditorUser: ObservationUserSummary;
  code: string;
  dueDate: string;
  effectiveStatus: ExtensionRequestEffectiveStatus;
  id: string;
  responsibleUser: ObservationUserSummary | null;
  riskLevel: ObservationRiskLevel;
  title: string;
}

export interface ExtensionRequestCommitmentSummary {
  dueDate: string;
  effectiveStatus: ExtensionRequestEffectiveStatus;
  id: string;
  progressPercent: number;
  responsibleUser: ObservationUserSummary | null;
  status: string;
  title: string;
}

export interface ExtensionRequestTableRow {
  area: ExtensionRequestAreaSummary;
  canCancel: boolean;
  canEdit: boolean;
  canReview: boolean;
  commitment: Pick<ExtensionRequestCommitmentSummary, "id" | "title"> | null;
  currentDueDate: string;
  id: string;
  impactDays: number;
  isOverdue: boolean;
  observation: Pick<
    ExtensionRequestObservationSummary,
    "code" | "id" | "riskLevel" | "title"
  >;
  pendingForCurrentUser: boolean;
  requestedByUser: ObservationUserSummary;
  requestedDueDate: string;
  status: ExtensionRequestStatus;
  updatedAt: string;
}

export interface ExtensionRequestDetail extends ExtensionRequestTableRow {
  attachments: ExtensionRequestEvidenceItem[];
  auditComment: string | null;
  auditReviewedAt: string | null;
  auditReviewer: ObservationUserSummary | null;
  canAuditApprove: boolean;
  canAuditReject: boolean;
  canManagerApprove: boolean;
  canManagerReject: boolean;
  canSend: boolean;
  commitment: ExtensionRequestCommitmentSummary | null;
  createdAt: string;
  finalApprovedAt: string | null;
  managerComment: string | null;
  managerReviewedAt: string | null;
  managerReviewer: ObservationUserSummary | null;
  nextSubmissionTarget: "audit" | "auto" | "manager";
  observation: ExtensionRequestObservationSummary;
  reason: string;
}

export interface CreateExtensionRequestInput {
  evidenceFileIds?: string[];
  reason: string;
  requestedDueDate: string;
}

export type UpdateExtensionRequestInput = Partial<CreateExtensionRequestInput>;

export interface ReviewExtensionRequestInput {
  comment?: string | null;
}
