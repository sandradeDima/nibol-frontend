import type { ObservationUserSummary } from "./observations";

export type ExtensionRequestStatus =
  | "DRAFT"
  | "SENT_TO_MANAGER"
  | "MANAGER_APPROVED"
  | "MANAGER_REJECTED"
  | "CANCELLED";

export interface ExtensionRequestEvidenceItem {
  context: "FINDING" | "ACTION_PLAN" | "PROGRESS_EVALUATION" | "CLOSURE";
  createdAt: string;
  downloadPath: string;
  id: string;
  mimeType: string;
  originalName: string;
}

export interface ExtensionRequestDetail {
  actionPlan: {
    currentDueDate: string;
    id: string;
    originalDueDate: string;
    responsibleUser: ObservationUserSummary;
  } | null;
  attachments: ExtensionRequestEvidenceItem[];
  classification: {
    code: string;
    description: string;
    maxAdditionalDays: number;
    name: string;
  } | null;
  createdAt: string;
  finalApprovedAt: string | null;
  id: string;
  impactDays: number;
  managerComment: string | null;
  managerReviewedAt: string | null;
  managerReviewer: ObservationUserSummary | null;
  observation: { displayCode: string; id: string; title: string } | null;
  observationArea: {
    area: { id: string; managerUserId: string | null; name: string };
    areaResponsible: ObservationUserSummary;
    processOwner: ObservationUserSummary;
  } | null;
  previousDueDate: string;
  proposedDueDate: string;
  reason: string;
  requestedByUser: ObservationUserSummary;
  status: ExtensionRequestStatus;
  targetType: "OBSERVATION" | "ACTION_PLAN";
  updatedAt: string;
  workflowInstanceId: string | null;
}

export type ExtensionRequestTableRow = ExtensionRequestDetail;
export interface CreateExtensionRequestInput {
  classificationCode: string;
  evidenceFileIds?: string[];
  proposedDueDate: string;
  reason: string;
}
export interface ExtensionClassification {
  code: string;
  description: string;
  maxAdditionalDays: number;
  name: string;
}
export type UpdateExtensionRequestInput = Partial<CreateExtensionRequestInput>;
export interface ReviewExtensionRequestInput {
  comment?: string | null;
}
