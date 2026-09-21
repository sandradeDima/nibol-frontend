export type DashboardScope = "auditoria" | "area";

export type DashboardViewerProfile =
  | "ADMIN"
  | "SYSTEMS"
  | "AUDIT"
  | "MANAGEMENT"
  | "EXECUTOR"
  | "GENERAL";

export interface DashboardDistributionItem {
  colorToken?: string | null;
  href?: string;
  key: string;
  label: string;
  value: number;
}

export interface DashboardStatusDistributionItem extends DashboardDistributionItem {
  isFinal?: boolean;
}

export interface DashboardTrendPoint {
  closed: number;
  created: number;
  monthKey: string;
  monthLabel: string;
}

export interface DashboardRankingItem {
  href?: string;
  id: string | null;
  label: string;
  secondaryValue?: number;
  value: number;
}

export interface DashboardUserSummary {
  email?: string;
  id: string;
  name: string;
}

export interface DashboardAreaSummary {
  id: string;
  name: string;
}

export interface DashboardRiskSummary {
  colorToken: string | null;
  key: string;
  name: string;
}

export interface DashboardStatusSummary {
  isFinal?: boolean;
  key: string;
  name: string;
}

export interface DashboardObservationRow {
  area: DashboardAreaSummary;
  code: string;
  dueDate: string;
  href: string;
  id: string;
  isOverdue: boolean;
  progressPercent: number;
  responsibleUser: DashboardUserSummary | null;
  riskLevel: DashboardRiskSummary;
  status: DashboardStatusSummary;
  title: string;
  updatedAt: string;
}

export interface DashboardActionPlanRow {
  area: DashboardAreaSummary;
  deadlineStatus: "VIGENTE" | "VENCIDO";
  dueDate: string;
  effectiveDueDate: string;
  href: string;
  id: string;
  isOverdue: boolean;
  observation: {
    code: string;
    id: string;
    title: string;
  };
  officialProgressCode: "NI" | "I" | "CA" | "CO";
  officialProgressPercent: number;
  progressPercent: number;
  reprogrammed: boolean;
  responsibleUser: DashboardUserSummary | null;
  status: DashboardStatusSummary;
  title: string;
  updatedAt: string;
}

export interface DashboardActionPlanReporting {
  charts: {
    byArea: DashboardDistributionItem[];
    byDeadline: DashboardDistributionItem[];
    byExecutor: DashboardDistributionItem[];
    byProcessOwner: DashboardDistributionItem[];
    byProgress: DashboardDistributionItem[];
    byReprogrammed: DashboardDistributionItem[];
    byRisk: DashboardDistributionItem[];
  };
  summary: {
    conAvance: number;
    concluido: number;
    iniciado: number;
    noIniciado: number;
    reprogramados: number;
    total: number;
    vencidos: number;
    vigentes: number;
  };
}

export interface DashboardReviewQueueRow {
  areaName: string;
  href: string;
  id: string;
  kind: "EXTENSION" | "PROGRESS";
  responsibleName: string | null;
  status: DashboardStatusSummary;
  subtitle: string;
  title: string;
  updatedAt: string;
}

export interface DashboardActivityRow {
  description: string;
  href: string;
  id: string;
  kind: "EXTENSION" | "OBSERVATION" | "PROGRESS";
  timestamp: string;
  title: string;
}

export interface OperationalDashboardData {
  attention: DashboardObservationRow[];
  generatedAt: string;
  links: {
    allObservations: string;
    concludedObservations: string;
    inProgressObservations: string;
    overdueObservations: string;
    pendingObservations: string;
    pendingApprovals: string;
    pendingExtensions: string;
    pendingProgressReviews: string;
    upcomingObservations: string;
  };
  reminderDaysBeforeDue: number;
  summary: {
    concludedObservations: number;
    inProgressObservations: number;
    overdueObservations: number;
    pendingObservations: number;
    pendingApprovals: number;
    pendingExtensions: number;
    pendingProgressReviews: number;
    totalObservations: number;
    upcomingObservations: number;
  };
}

export interface AuditDashboardData {
  actionPlanReporting: DashboardActionPlanReporting;
  charts: {
    currentVsOverdue: DashboardDistributionItem[];
    monthlyTrend: DashboardTrendPoint[];
    observationsByArea: DashboardDistributionItem[];
    observationsByRisk: DashboardDistributionItem[];
    observationsByStatus: DashboardStatusDistributionItem[];
    topOverdueAreas: DashboardRankingItem[];
    topResponsibles: DashboardRankingItem[];
  };
  generatedAt: string;
  reminderDaysBeforeDue: number;
  scope: "auditoria";
  subtitle: string;
  summary: {
    averageProgress: number;
    closedObservations: number;
    openObservations: number;
    overdueObservations: number;
    pendingExtensions: number;
    pendingProgressReviews: number;
    pendingReviews: number;
    totalObservations: number;
    upcomingObservations: number;
  };
  tables: {
    criticalObservations: DashboardObservationRow[];
    latestUpdates: DashboardActivityRow[];
    pendingReviews: DashboardReviewQueueRow[];
    upcomingActionPlans: DashboardActionPlanRow[];
  };
  viewerProfile: DashboardViewerProfile;
}

export interface AreaDashboardData {
  actionPlanReporting: DashboardActionPlanReporting;
  charts: {
    currentVsOverdue: DashboardDistributionItem[];
    observationsByArea: DashboardDistributionItem[];
    observationsByRisk: DashboardDistributionItem[];
    observationsByStatus: DashboardStatusDistributionItem[];
  };
  generatedAt: string;
  reminderDaysBeforeDue: number;
  scope: "area";
  subtitle: string;
  summary: {
    areaObservations: number;
    assignedObservations: number;
    averageProgress: number;
    extensionsInProcess: number;
    overdueActionPlans: number;
    pendingActionPlans: number;
    returnedProgressEvaluations: number;
    upcomingActionPlans: number;
  };
  tables: {
    criticalObservations: DashboardObservationRow[];
    latestUpdates: DashboardActivityRow[];
    reviewQueue: DashboardReviewQueueRow[];
    upcomingActionPlans: DashboardActionPlanRow[];
  };
  viewerProfile: DashboardViewerProfile;
}

export interface DashboardMySummary {
  canViewAreaDashboard: boolean;
  canViewAuditDashboard: boolean;
  defaultRoute: "/dashboard/area" | "/dashboard/auditoria";
  preferredDashboard: DashboardScope;
  subtitle: string;
  viewerProfile: DashboardViewerProfile;
}

export type RoleDashboardRole =
  | "PROCESS_OWNER"
  | "AREA_RESPONSIBLE"
  | "EXECUTOR";

export interface RoleDashboardOption {
  id: string;
  name: string;
}

export interface RoleDashboardNodeStatus {
  key: "PENDING" | "CONCLUDED" | "MIXED";
  name: string;
}

export interface RoleDashboardExecutorNode {
  concluded: number;
  id: string;
  name: string;
  pending: number;
  status: RoleDashboardNodeStatus;
  total: number;
}

export interface RoleDashboardObservationRow extends DashboardObservationRow {
  executorNames: string[];
}

export interface RoleDashboardResponsibleNode {
  concluded: number;
  executors: RoleDashboardExecutorNode[];
  id: string;
  name: string;
  pending: number;
  status: RoleDashboardNodeStatus;
  total: number;
}

export interface RoleDashboardAreaNode {
  concluded: number;
  executors?: RoleDashboardExecutorNode[];
  id: string;
  name: string;
  pending: number;
  responsibles?: RoleDashboardResponsibleNode[];
  status: RoleDashboardNodeStatus;
  total: number;
}

export interface RoleDashboardPriority {
  code: "OVERDUE" | "PENDING_EXTENSIONS" | "PENDING_REVIEWS";
  count: number;
  href: string;
  label: string;
}

export interface RoleDashboardQuickAction {
  code:
    | "SEND_PROGRESS"
    | "UPLOAD_EVIDENCE"
    | "UPDATE_PLAN"
    | "REQUEST_EXTENSION"
    | "VIEW_TIMELINE";
  description: string;
  href: string;
  label: string;
}

export interface RoleDashboardData {
  areas: RoleDashboardOption[];
  filters: {
    executors: RoleDashboardOption[];
    responsibles: RoleDashboardOption[];
  };
  generatedAt: string;
  globalSummary: {
    concludedObservations: number;
    pendingObservations: number;
    totalObservations: number;
  };
  hierarchy: RoleDashboardAreaNode[];
  observations: RoleDashboardObservationRow[];
  priorities: RoleDashboardPriority[];
  quickActions: RoleDashboardQuickAction[];
  roleCode: RoleDashboardRole;
  selectedAreaId: string | null;
  selectedExecutorId: string | null;
  selectedResponsibleId: string | null;
  selectedExecutorIds?: string[];
  selectedObservationState?: "PENDING" | "CONCLUDED" | null;
  selectedResponsibleIds?: string[];
  summary: {
    concludedObservations: number;
    overdueObservations: number;
    pendingObservations: number;
    totalObservations: number;
  };
}
