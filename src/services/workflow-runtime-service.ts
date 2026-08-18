import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  PaginatedApiSuccessResponse,
  WorkflowInstanceDetail,
  WorkflowInstanceStartInput,
  WorkflowStartOptions,
  WorkflowTaskDetail,
  WorkflowTaskListItem,
  WorkflowTaskListParams,
  WorkflowTimelineEvent,
} from "@/types";

export const workflowRuntimeService = {
  async getStartOptions() {
    const response = await apiClient.get<
      ApiSuccessResponse<WorkflowStartOptions>
    >("/workflow-instances/start-options");
    return response.data.data;
  },

  async startInstance(input: WorkflowInstanceStartInput) {
    const response = await apiClient.post<
      ApiSuccessResponse<WorkflowInstanceDetail>
    >("/workflow-instances", input);
    return response.data.data;
  },

  async listMyPending(params: WorkflowTaskListParams = {}) {
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<WorkflowTaskListItem[]>
    >("/workflow-tasks/my-pending", { params });
    return { data: response.data.data, pagination: response.data.pagination };
  },

  async getTask(taskId: string) {
    const response = await apiClient.get<
      ApiSuccessResponse<WorkflowTaskDetail>
    >(`/workflow-tasks/${taskId}`);
    return response.data.data;
  },

  async actOnTask(
    taskId: string,
    action:
      "approve" | "complete" | "observe" | "reject" | "request-correction",
    input: { comment?: string; evidenceReferences?: string[] },
  ) {
    const response = await apiClient.post<
      ApiSuccessResponse<WorkflowTaskDetail>
    >(`/workflow-tasks/${taskId}/${action}`, input);
    return response.data.data;
  },

  async reassignTask(
    taskId: string,
    input: {
      assignedAreaId?: string;
      assignedRoleId?: string;
      assignedUserId?: string;
      comment?: string;
    },
  ) {
    const response = await apiClient.post<
      ApiSuccessResponse<WorkflowTaskDetail>
    >(`/workflow-tasks/${taskId}/reassign`, input);
    return response.data.data;
  },

  async getInstance(instanceId: string) {
    const response = await apiClient.get<
      ApiSuccessResponse<WorkflowInstanceDetail>
    >(`/workflow-instances/${instanceId}`);
    return response.data.data;
  },

  async getHistory(instanceId: string) {
    const response = await apiClient.get<
      ApiSuccessResponse<WorkflowTimelineEvent[]>
    >(`/workflow-instances/${instanceId}/history`);
    return response.data.data;
  },

  async cancelInstance(instanceId: string) {
    const response = await apiClient.post<
      ApiSuccessResponse<WorkflowInstanceDetail>
    >(`/workflow-instances/${instanceId}/cancel`, {});
    return response.data.data;
  },

  async retryInstance(instanceId: string) {
    const response = await apiClient.post<
      ApiSuccessResponse<WorkflowInstanceDetail>
    >(`/workflow-instances/${instanceId}/retry`, {});
    return response.data.data;
  },
};
