import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CreateExtensionRequestInput,
  ExtensionRequestDetail,
  ExtensionRequestTableRow,
  ExtensionClassification,
  PaginatedApiSuccessResponse,
  ReviewExtensionRequestInput,
  UpdateExtensionRequestInput,
} from "@/types";

const post = async (path: string, input: object = {}) =>
  (
    await apiClient.post<ApiSuccessResponse<ExtensionRequestDetail>>(
      path,
      input,
    )
  ).data.data;

export const extensionRequestService = {
  cancel: (id: string) => post(`/extension-requests/${id}/cancel`),
  createForActionPlan: (id: string, input: CreateExtensionRequestInput) =>
    post(`/action-plans/${id}/extension-requests`, input),
  async getById(id: string) {
    return (
      await apiClient.get<ApiSuccessResponse<ExtensionRequestDetail>>(
        `/extension-requests/${id}`,
      )
    ).data.data;
  },
  async listClassifications() {
    return (
      await apiClient.get<ApiSuccessResponse<ExtensionClassification[]>>(
        "/deadline-extension-classifications",
      )
    ).data.data;
  },
  async list(params = "") {
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<ExtensionRequestTableRow[]>
    >(`/extension-requests${params}`);
    return { data: response.data.data, pagination: response.data.pagination };
  },
  managerApprove: (id: string, input: ReviewExtensionRequestInput = {}) =>
    post(`/extension-requests/${id}/manager-approve`, input),
  managerReject: (id: string, input: ReviewExtensionRequestInput) =>
    post(`/extension-requests/${id}/manager-reject`, input),
  sendToManager: (id: string) => post(`/extension-requests/${id}/submit`),
  async update(id: string, input: UpdateExtensionRequestInput) {
    return (
      await apiClient.patch<ApiSuccessResponse<ExtensionRequestDetail>>(
        `/extension-requests/${id}`,
        input,
      )
    ).data.data;
  },
};
