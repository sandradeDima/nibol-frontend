const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "");

const appBaseUrl = trimTrailingSlash(
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
);

const backendBaseUrl = trimTrailingSlash(
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000",
);

const resolveUrl = (value: string, fallbackBaseUrl = appBaseUrl): URL => {
  return new URL(value, `${fallbackBaseUrl}/`);
};

const normalizeApiBaseUrl = (value: string): string => {
  const url = resolveUrl(value);
  const pathname = trimTrailingSlash(url.pathname);

  url.pathname = pathname.endsWith("/api") ? pathname : `${pathname || ""}/api`;

  return trimTrailingSlash(url.toString());
};

const normalizeAuthBaseUrl = (value: string): string => {
  const url = resolveUrl(value);
  const pathname = trimTrailingSlash(url.pathname);

  if (pathname.endsWith("/api/auth")) {
    return trimTrailingSlash(url.toString());
  }

  url.pathname = pathname.endsWith("/api")
    ? `${pathname}/auth`
    : `${pathname || ""}/api/auth`;

  return trimTrailingSlash(url.toString());
};

const serverApiBaseUrl = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ?? backendBaseUrl,
);

const serverAuthBaseUrl = normalizeAuthBaseUrl(
  process.env.NEXT_PUBLIC_AUTH_URL ?? process.env.NEXT_PUBLIC_API_URL ?? backendBaseUrl,
);

export const APP_CONFIG = {
  appBaseUrl,
  backendBaseUrl,
  browserApiBaseUrl: "/api",
  browserAuthBaseUrl: "/api/auth",
  name: "NIBOL | Sistema de Seguimiento de Riesgos",
  description: "Plataforma corporativa para seguimiento, control y gobierno operativo.",
  serverApiBaseUrl,
  serverAuthBaseUrl,
  apiTimeoutMs: 10000,
} as const;

export const DEFAULT_PAGINATION = {
  page: 1,
  perPage: 10,
} as const;

export const QUERY_KEYS = {
  authSession: ["auth", "session"] as const,
  authorization: ["authorization", "me"] as const,
  health: ["health"] as const,
  profile: ["profile"] as const,
  settings: ["settings"] as const,
  notifications: ["notifications"] as const,
  invitationPreview: (token: string) => ["invitations", "preview", token] as const,
  invitations: ["invitations"] as const,
  activityLogUsers: ["activity-logs", "users"] as const,
  auditLogUsers: ["audit-logs", "users"] as const,
  configurationBootstrap: ["configuration", "bootstrap"] as const,
  observationOptions: ["observations", "options"] as const,
  observationDetails: (observationId: string) =>
    ["observations", "detail", observationId] as const,
  observations: ["observations"] as const,
  observationComments: (observationId: string) =>
    ["observations", "comments", observationId] as const,
  observationEvidences: (observationId: string) =>
    ["observations", "evidences", observationId] as const,
  observationProgressWorkspace: (observationId: string) =>
    ["observations", "progress-workspace", observationId] as const,
  extensionRequestDetails: (requestId: string) =>
    ["extension-requests", "detail", requestId] as const,
  extensionRequests: ["extension-requests"] as const,
  remediationWorkspace: (observationId: string, areaId?: string) =>
    ["remediation", "workspace", observationId, areaId ?? "default"] as const,
  remediationPlanCommitments: (planId: string) =>
    ["remediation", "plan-commitments", planId] as const,
  remediationPlans: ["remediation-plans"] as const,
  progressUpdates: ["progress-updates"] as const,
  commitmentSchedule: ["commitment-schedule"] as const,
  roleDetails: (roleId: string) => ["roles", "detail", roleId] as const,
  roleOptions: ["roles", "options"] as const,
  userOptions: ["users", "options"] as const,
  users: ["users"] as const,
  userDetails: (userId: string) => ["users", "detail", userId] as const,
  roles: ["roles"] as const,
  permissions: ["permissions"] as const,
} as const;
