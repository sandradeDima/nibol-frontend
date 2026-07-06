import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CreateRoleInput,
  RoleDetails,
  UpdateRoleInput,
} from "@/types";

export const roleService = {
  async createRole(input: CreateRoleInput): Promise<RoleDetails> {
    const response = await apiClient.post<ApiSuccessResponse<RoleDetails>>(
      "/roles",
      input,
    );

    return response.data.data;
  },

  async deleteRole(roleId: string) {
    await apiClient.delete(`/roles/${roleId}`);
  },

  async getRoleById(roleId: string): Promise<RoleDetails> {
    const response = await apiClient.get<ApiSuccessResponse<RoleDetails>>(
      `/roles/${roleId}`,
    );

    return response.data.data;
  },

  async updateRole(roleId: string, input: UpdateRoleInput): Promise<RoleDetails> {
    const response = await apiClient.put<ApiSuccessResponse<RoleDetails>>(
      `/roles/${roleId}`,
      input,
    );

    return response.data.data;
  },
};
