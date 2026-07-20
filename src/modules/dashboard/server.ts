import { cookies } from "next/headers";

import { APP_CONFIG } from "@/lib/constants";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AreaDashboardData,
  AuditDashboardData,
  DashboardMySummary,
} from "@/types";

export class DashboardRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DashboardRequestError";
    this.status = status;
  }
}

const buildCookieHeader = async (): Promise<string> => {
  const cookieStore = await cookies();

  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
};

const fetchDashboardResource = async <T>(
  path: string,
): Promise<T> => {
  const headers = new Headers({
    Accept: "application/json",
  });
  const cookieHeader = await buildCookieHeader();

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const response = await fetch(`${APP_CONFIG.serverApiBaseUrl}${path}`, {
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    let message = "No fue posible cargar el dashboard.";

    try {
      const body = (await response.json()) as ApiErrorResponse;
      message = body.message ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new DashboardRequestError(message, response.status);
  }

  const body = (await response.json()) as ApiSuccessResponse<T>;
  return body.data;
};

export const dashboardServer = {
  getAreaDashboard() {
    return fetchDashboardResource<AreaDashboardData>("/dashboard/area");
  },

  getAuditDashboard() {
    return fetchDashboardResource<AuditDashboardData>("/dashboard/auditoria");
  },

  getMySummary() {
    return fetchDashboardResource<DashboardMySummary>("/dashboard/my-summary");
  },
};
