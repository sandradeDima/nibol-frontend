import { apiClient } from "@/services/api-client";
import type {
  ActionPlanDetail,
  ActionPlanPayload,
  ApiSuccessResponse,
  PaginatedApiSuccessResponse,
  UpdateActionPlanPayload,
} from "@/types";

export const remediationService = {
  async createActionPlan(
    observationId: string,
    input: ActionPlanPayload,
  ): Promise<ActionPlanDetail> {
    const response = await apiClient.post<ApiSuccessResponse<ActionPlanDetail>>(
      `/observations/${observationId}/action-plans`,
      input,
    );
    return response.data.data;
  },
  async deleteActionPlan(actionPlanId: string) {
    await apiClient.delete(`/action-plans/${actionPlanId}`);
  },
  async getActionPlan(actionPlanId: string): Promise<ActionPlanDetail> {
    const response = await apiClient.get<ApiSuccessResponse<ActionPlanDetail>>(
      `/action-plans/${actionPlanId}`,
    );
    return response.data.data;
  },
  async listActionPlans(params = ""): Promise<{
    data: ActionPlanDetail[];
    pagination: PaginatedApiSuccessResponse<ActionPlanDetail[]>["pagination"];
  }> {
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<ActionPlanDetail[]>
    >(`/action-plans${params}`);
    return { data: response.data.data, pagination: response.data.pagination };
  },
  async markActionPlanComplete(
    actionPlanId: string,
  ): Promise<ActionPlanDetail> {
    const response = await apiClient.post<ApiSuccessResponse<ActionPlanDetail>>(
      `/action-plans/${actionPlanId}/complete`,
    );
    return response.data.data;
  },
  async updateActionPlan(
    actionPlanId: string,
    input: UpdateActionPlanPayload,
  ): Promise<ActionPlanDetail> {
    const response = await apiClient.patch<
      ApiSuccessResponse<ActionPlanDetail>
    >(`/action-plans/${actionPlanId}`, input);
    return response.data.data;
  },
};
