import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CreateDraftVersionInput,
  CreateWorkflowInput,
  DuplicateWorkflowInput,
  PaginatedApiSuccessResponse,
  UpdateWorkflowMetadataInput,
  WorkflowActivityItem,
  WorkflowDefinitionDetail,
  WorkflowDefinitionListItem,
  WorkflowDesignerData,
  WorkflowDesignerOptions,
  WorkflowDesignerSaveInput,
  WorkflowDesignerValidationResult,
  WorkflowPublishResult,
  WorkflowSimulationInput,
  WorkflowSimulationResult,
  WorkflowOptions,
  WorkflowSummary,
  WorkflowVersionDetail,
  WorkflowVersionSummary,
} from "@/types";

export type WorkflowListParams = {
  createdById?: string;
  page?: number;
  perPage?: number;
  processType?: string;
  search?: string;
  sortBy?: "createdAt" | "name" | "processType" | "status" | "updatedAt";
  sortDirection?: "asc" | "desc";
  status?: string;
};

export type WorkflowVersionListParams = {
  page?: number;
  perPage?: number;
  status?: string;
};

export type WorkflowActivityParams = {
  page?: number;
  perPage?: number;
};

const workflowFilterParams = (params: WorkflowListParams) => ({
  page: params.page,
  perPage: params.perPage,
  search: params.search,
  sortBy: params.sortBy,
  sortDirection: params.sortDirection,
  "filter.createdById": params.createdById,
  "filter.processType": params.processType,
  "filter.status": params.status,
});

export const workflowService = {
  async archiveWorkflow(workflowId: string): Promise<WorkflowDefinitionDetail> {
    const response = await apiClient.post<
      ApiSuccessResponse<WorkflowDefinitionDetail>
    >(`/workflows/${workflowId}/archive`, {});
    return response.data.data;
  },

  async createDraftVersion(
    workflowId: string,
    input: CreateDraftVersionInput,
  ): Promise<WorkflowVersionDetail> {
    const response = await apiClient.post<
      ApiSuccessResponse<WorkflowVersionDetail>
    >(`/workflows/${workflowId}/versions`, input);
    return response.data.data;
  },

  async createWorkflow(
    input: CreateWorkflowInput,
  ): Promise<WorkflowDefinitionDetail> {
    const response = await apiClient.post<
      ApiSuccessResponse<WorkflowDefinitionDetail>
    >("/workflows", input);
    return response.data.data;
  },

  async duplicateWorkflow(
    workflowId: string,
    input: DuplicateWorkflowInput,
  ): Promise<WorkflowDefinitionDetail> {
    const response = await apiClient.post<
      ApiSuccessResponse<WorkflowDefinitionDetail>
    >(`/workflows/${workflowId}/duplicate`, input);
    return response.data.data;
  },

  async getWorkflow(workflowId: string): Promise<WorkflowDefinitionDetail> {
    const response = await apiClient.get<
      ApiSuccessResponse<WorkflowDefinitionDetail>
    >(`/workflows/${workflowId}`);
    return response.data.data;
  },

  async getWorkflowOptions(): Promise<WorkflowOptions> {
    const response =
      await apiClient.get<ApiSuccessResponse<WorkflowOptions>>(
        "/workflows/options",
      );
    return response.data.data;
  },

  async getWorkflowDesignerOptions(): Promise<WorkflowDesignerOptions> {
    const response = await apiClient.get<
      ApiSuccessResponse<WorkflowDesignerOptions>
    >("/workflows/designer-options");
    return response.data.data;
  },

  async getWorkflowSummary(): Promise<WorkflowSummary> {
    const response =
      await apiClient.get<ApiSuccessResponse<WorkflowSummary>>(
        "/workflows/summary",
      );
    return response.data.data;
  },

  async getWorkflowVersion(versionId: string): Promise<WorkflowVersionDetail> {
    const response = await apiClient.get<
      ApiSuccessResponse<WorkflowVersionDetail>
    >(`/workflow-versions/${versionId}`);
    return response.data.data;
  },

  async getWorkflowDesigner(versionId: string): Promise<WorkflowDesignerData> {
    const response = await apiClient.get<
      ApiSuccessResponse<WorkflowDesignerData>
    >(`/workflow-versions/${versionId}/designer`);
    return response.data.data;
  },

  async saveWorkflowDesigner(
    versionId: string,
    input: WorkflowDesignerSaveInput,
  ): Promise<WorkflowDesignerData> {
    const response = await apiClient.put<
      ApiSuccessResponse<WorkflowDesignerData>
    >(`/workflow-versions/${versionId}/designer`, input);
    return response.data.data;
  },

  async validateWorkflowDesigner(
    versionId: string,
    graph?: WorkflowDesignerSaveInput,
  ): Promise<WorkflowDesignerValidationResult> {
    const response = await apiClient.post<
      ApiSuccessResponse<WorkflowDesignerValidationResult>
    >(
      `/workflow-versions/${versionId}/designer/validate`,
      graph ? { graph } : {},
    );
    return response.data.data;
  },

  async simulateWorkflowVersion(
    versionId: string,
    input: WorkflowSimulationInput,
  ): Promise<WorkflowSimulationResult> {
    const response = await apiClient.post<
      ApiSuccessResponse<WorkflowSimulationResult>
    >(`/workflow-versions/${versionId}/simulate`, input);
    return response.data.data;
  },

  async publishWorkflowVersion(
    versionId: string,
    graphHash: string,
  ): Promise<WorkflowPublishResult> {
    const response = await apiClient.post<
      ApiSuccessResponse<WorkflowPublishResult>
    >(`/workflow-versions/${versionId}/publish`, { graphHash });
    return response.data.data;
  },

  async listWorkflowActivity(
    workflowId: string,
    params: WorkflowActivityParams = {},
  ) {
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<WorkflowActivityItem[]>
    >(`/workflows/${workflowId}/activity`, { params });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async listWorkflows(params: WorkflowListParams = {}) {
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<WorkflowDefinitionListItem[]>
    >("/workflows", { params: workflowFilterParams(params) });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async listWorkflowVersions(
    workflowId: string,
    params: WorkflowVersionListParams = {},
  ) {
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<WorkflowVersionSummary[]>
    >(`/workflows/${workflowId}/versions`, {
      params: {
        page: params.page,
        perPage: params.perPage,
        "filter.status": params.status,
      },
    });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async updateWorkflow(
    workflowId: string,
    input: UpdateWorkflowMetadataInput,
  ): Promise<WorkflowDefinitionDetail> {
    const response = await apiClient.patch<
      ApiSuccessResponse<WorkflowDefinitionDetail>
    >(`/workflows/${workflowId}`, input);
    return response.data.data;
  },
};
