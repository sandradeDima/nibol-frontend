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
    inProgressObservations: string;
    overdueObservations: string;
    pendingApprovals: string;
    pendingExtensions: string;
    upcomingObservations: string;
  };
  reminderDaysBeforeDue: number;
  summary: {
    inProgressObservations: number;
    overdueObservations: number;
    pendingApprovals: number;
    pendingExtensions: number;
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
