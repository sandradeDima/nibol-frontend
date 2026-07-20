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

export interface DashboardCommitmentRow {
  area: DashboardAreaSummary;
  dueDate: string;
  href: string;
  id: string;
  isOverdue: boolean;
  observation: {
    code: string;
    id: string;
    title: string;
  };
  progressPercent: number;
  responsibleUser: DashboardUserSummary | null;
  status: DashboardStatusSummary;
  title: string;
  updatedAt: string;
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

export interface AuditDashboardData {
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
    upcomingCommitments: DashboardCommitmentRow[];
  };
  viewerProfile: DashboardViewerProfile;
}

export interface AreaDashboardData {
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
    overdueCommitments: number;
    pendingCommitments: number;
    returnedProgressUpdates: number;
    upcomingCommitments: number;
  };
  tables: {
    criticalObservations: DashboardObservationRow[];
    latestUpdates: DashboardActivityRow[];
    reviewQueue: DashboardReviewQueueRow[];
    upcomingCommitments: DashboardCommitmentRow[];
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
