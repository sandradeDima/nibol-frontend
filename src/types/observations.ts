import type { ConfigurationBootstrap } from "./configuration";

export interface ObservationUserSummary {
  email: string;
  id: string;
  name: string;
}

export interface ObservationAreaSummary {
  id: string;
  name: string;
}

export interface ObservationAreaOption extends ObservationAreaSummary {
  managerUser: ObservationUserSummary | null;
}

export interface ObservationRiskLevel {
  colorToken: string | null;
  defaultDeadlineDays: number | null;
  id: string;
  key: string;
  name: string;
  severityOrder: number;
}

export interface ObservationStatus {
  countsAsOverdue: boolean;
  id: string;
  isFinal: boolean;
  isInitial: boolean;
  key: string;
  name: string;
  sortOrder: number;
}

export interface ObservationEffectiveStatus {
  key: string;
  name: string;
}

export interface ObservationAreaAssignment {
  area: ObservationAreaSummary;
  id: string;
  responsibleUser: ObservationUserSummary | null;
  roleInFinding: string | null;
}

export interface ObservationTableRow {
  area: ObservationAreaSummary;
  code: string;
  createdAt: string;
  currentStage: string | null;
  detectedAt: string;
  dueDate: string;
  effectiveStatus: ObservationEffectiveStatus;
  id: string;
  isOverdue: boolean;
  progressPercent: number;
  responsibleUser: ObservationUserSummary | null;
  riskLevel: ObservationRiskLevel;
  status: ObservationStatus;
  title: string;
  updatedAt: string;
}

export interface ObservationDetail extends ObservationTableRow {
  additionalAreas: ObservationAreaAssignment[];
  auditRecommendation: string;
  auditorUser: ObservationUserSummary;
  category: string | null;
  description: string;
  observationType: string | null;
  process: string | null;
  source: string | null;
}

export type ObservationFormOptions = ConfigurationBootstrap;

export interface CreateObservationInput {
  additionalAreaIds?: string[];
  areaId: string;
  auditRecommendation: string;
  category?: string | null;
  code: string;
  currentStage?: string | null;
  description: string;
  detectedAt: string;
  dueDate: string;
  observationType?: string | null;
  process?: string | null;
  progressPercent?: number;
  responsibleUserId?: string | null;
  riskLevelId: string;
  source?: string | null;
  statusId: string;
  title: string;
}

export type UpdateObservationInput = Partial<CreateObservationInput>;
