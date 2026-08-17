import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CreateExtensionRequestInput,
  ExtensionRequestDetail,
  ExtensionRequestTableRow,
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
  auditApprove: (id: string, input: ReviewExtensionRequestInput = {}) =>
    post(`/extension-requests/${id}/audit-approve`, input),
  auditReject: (id: string, input: ReviewExtensionRequestInput) =>
    post(`/extension-requests/${id}/audit-reject`, input),
  cancel: (id: string) => post(`/extension-requests/${id}/cancel`),
  createForActionPlan: (id: string, input: CreateExtensionRequestInput) =>
    post(`/action-plans/${id}/extension-requests`, input),
  createForObservation: (id: string, input: CreateExtensionRequestInput) =>
    post(`/observations/${id}/extension-requests`, input),
  async getById(id: string) {
    return (
      await apiClient.get<ApiSuccessResponse<ExtensionRequestDetail>>(
        `/extension-requests/${id}`,
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
