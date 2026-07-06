import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  ChangePasswordInput,
  CreateUserInput,
  RoleOption,
  UpdateProfileInput,
  UpdateUserInput,
  UserDetails,
  UserOption,
  UserProfile,
} from "@/types";

export const userService = {
  async bulkDeleteUsers(ids: string[]) {
    await apiClient.post("/users/bulk-delete", {
      ids,
    });
  },

  async changePassword(input: ChangePasswordInput) {
    await apiClient.post("/users/profile/change-password", input);
  },

  async createUser(input: CreateUserInput): Promise<UserDetails> {
    const response = await apiClient.post<ApiSuccessResponse<UserDetails>>(
      "/users",
      input,
    );

    return response.data.data;
  },

  async deleteUser(userId: string) {
    await apiClient.delete(`/users/${userId}`);
  },

  async disableUser(userId: string): Promise<UserDetails> {
    const response = await apiClient.patch<ApiSuccessResponse<UserDetails>>(
      `/users/${userId}/disable`,
    );

    return response.data.data;
  },

  async enableUser(userId: string): Promise<UserDetails> {
    const response = await apiClient.patch<ApiSuccessResponse<UserDetails>>(
      `/users/${userId}/enable`,
    );

    return response.data.data;
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<ApiSuccessResponse<UserProfile>>(
      "/users/profile",
    );

    return response.data.data;
  },

  async getRoleOptions(): Promise<RoleOption[]> {
    const response = await apiClient.get<ApiSuccessResponse<RoleOption[]>>(
      "/roles/options",
    );

    return response.data.data;
  },

  async getUserOptions(): Promise<UserOption[]> {
    const response = await apiClient.get<ApiSuccessResponse<UserOption[]>>(
      "/users/options",
    );

    return response.data.data;
  },

  async getUserById(userId: string): Promise<UserDetails> {
    const response = await apiClient.get<ApiSuccessResponse<UserDetails>>(
      `/users/${userId}`,
    );

    return response.data.data;
  },

  async resendVerificationEmail(userId: string) {
    await apiClient.post(`/users/${userId}/resend-verification`);
  },

  async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    const response = await apiClient.put<ApiSuccessResponse<UserProfile>>(
      "/users/profile",
      input,
    );

    return response.data.data;
  },

  async updateUser(userId: string, input: UpdateUserInput): Promise<UserDetails> {
    const response = await apiClient.put<ApiSuccessResponse<UserDetails>>(
      `/users/${userId}`,
      input,
    );

    return response.data.data;
  },

  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData();

    formData.append("avatar", file);

    const response = await apiClient.post<ApiSuccessResponse<{ avatar: string }>>(
      "/users/profile/avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data;
  },
};
