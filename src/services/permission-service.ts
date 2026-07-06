import { apiClient } from "@/services/api-client";
import type { ApiSuccessResponse, AuthorizationSummary } from "@/types";

export const permissionService = {
  async getMyAuthorization(): Promise<AuthorizationSummary> {
    const response =
      await apiClient.get<ApiSuccessResponse<AuthorizationSummary>>("/permissions/me");

    return response.data.data;
  },
};
