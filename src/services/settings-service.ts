import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  AppSettings,
  UpdateSettingsInput,
} from "@/types";

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    const response = await apiClient.get<ApiSuccessResponse<AppSettings>>("/settings");

    return response.data.data;
  },

  async updateSettings(input: UpdateSettingsInput): Promise<AppSettings> {
    const response = await apiClient.put<ApiSuccessResponse<AppSettings>>(
      "/settings",
      input,
    );

    return response.data.data;
  },

  async uploadLogo(file: File): Promise<AppSettings> {
    const formData = new FormData();

    formData.append("logo", file);

    const response = await apiClient.put<ApiSuccessResponse<AppSettings>>(
      "/settings/logo",
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
