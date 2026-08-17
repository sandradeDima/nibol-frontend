export interface ObservationUserSummary {
  email: string;
  id: string;
  jobTitle: string | null;
  name: string;
}

export interface ObservationAreaSummary {
  id: string;
  name: string;
}

export interface ObservationRiskLevel {
  colorToken: string | null;
  defaultDeadlineDays: number | null;
  id: string;
  key: string;
  name: string;
}

export interface ObservationStatus {
  id: string;
  isFinal: boolean;
  key: string;
  name: string;
}

export type ObservationActionSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface ObservationActionItem {
  actionLabel?: string;
  actionType?: string;
  actionUrl?: string;
  code: string;
  description?: string;
  label: string;
  permission?: string;
  severity: ObservationActionSeverity;
}

export interface ObservationActionSummary {
  count: number;
  items: Array<
    Pick<
      ObservationActionItem,
      "actionLabel" | "actionType" | "actionUrl" | "code" | "label"
    >
  >;
  primaryAction: Pick<
    ObservationActionItem,
    "actionLabel" | "actionType" | "actionUrl" | "code" | "label"
  > | null;
  severity: ObservationActionSeverity | "NONE";
  status: "ATTENTION" | "COMPLETE" | "OVERDUE";
}

export interface ObservationArea {
  area: ObservationAreaSummary;
  areaResponsible: ObservationUserSummary;
  id: string;
  processOwner: ObservationUserSummary;
  progressPercent: number;
}

export interface ObservationTableRow {
  actionPlanCount: number;
  actionSummary?: ObservationActionSummary;
  areas: ObservationArea[];
  auditReport: {
    id: string;
    reportDate: string;
    reportNumber: string;
    title: string;
  };
  currentDueDate: string;
  displayCode: string;
  id: string;
  isOverdue: boolean;
  mainObservation: { id: string; name: string };
  observationNumber: number;
  originalDueDate: string;
  progressPercent: number;
  risks: Array<{ id: string; name: string }>;
  riskLevel: ObservationRiskLevel;
  status: ObservationStatus;
  title: string;
  updatedAt: string;
}

export interface ObservationDetail extends ObservationTableRow {
  auditRecommendation: string;
  auditorUser: ObservationUserSummary;
  category: string | null;
  currentStage: string | null;
  description: string;
  process: string | null;
  source: string | null;
}

export interface ObservationFormOptions {
  areas: Array<{
    code: string | null;
    id: string;
    managerUser: ObservationUserSummary | null;
    name: string;
  }>;
  auditReports: Array<{
    id: string;
    reportDate: string;
    reportNumber: string;
    title: string;
  }>;
  mainObservations: Array<{
    description: string | null;
    id: string;
    name: string;
  }>;
  risks: Array<{ description: string | null; id: string; name: string }>;
  riskLevels: ObservationRiskLevel[];
  users: ObservationUserSummary[];
}

export interface ObservationAreaInput {
  areaId: string;
  areaResponsibleUserId: string;
  processOwnerUserId: string;
}

export interface CreateObservationInput {
  actionPlans?: ObservationActionPlanInput[];
  areaAssignments: ObservationAreaInput[];
  auditRecommendation: string;
  auditReportId: string;
  auditorUserId: string;
  category?: string | null;
  currentStage?: string | null;
  description: string;
  mainObservationId: string;
  observationNumber: number;
  process?: string | null;
  riskIds: string[];
  riskLevelId: string;
  source?: string | null;
  title: string;
}

export interface ObservationActionPlanInput {
  areaId: string;
  description: string;
  dueDate: string;
  responsibleUserId: string;
  title: string;
}

export type UpdateObservationInput = Partial<CreateObservationInput>;
