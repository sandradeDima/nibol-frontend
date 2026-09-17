import { apiClient } from "@/services/api-client";
import type { ApiSuccessResponse, RoleDashboardData } from "@/types";

export type RoleDashboardQuery = {
  areaId?: string;
  areaResponsibleUserId?: string[];
  executorId?: string[];
  observationState?: "PENDING" | "CONCLUDED";
  search?: string;
};

export const dashboardService = {
  async getRoleDashboard(query: RoleDashboardQuery = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) params.set(key, value.join(","));
      } else if (value) {
        params.set(key, value);
      }
    });
    const response = await apiClient.get<ApiSuccessResponse<RoleDashboardData>>(
      `/dashboard/role${params.toString() ? `?${params.toString()}` : ""}`,
    );
    return response.data.data;
  },
};
