import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  AreaMutationInput,
  AreaRecord,
  CatalogMutationInput,
  CatalogRecord,
  ConfigurationBootstrap,
  ObservationStatusMutationInput,
  ObservationStatusRecord,
  RiskLevelMutationInput,
  RiskLevelRecord,
  SystemParameterMutationInput,
  SystemParameterRecord,
} from "@/types";

const postRecord = async <TRecord, TInput>(
  endpoint: string,
  input: TInput,
): Promise<TRecord> => {
  const response = await apiClient.post<ApiSuccessResponse<TRecord>>(endpoint, input);
  return response.data.data;
};

const putRecord = async <TRecord, TInput>(
  endpoint: string,
  input: TInput,
): Promise<TRecord> => {
  const response = await apiClient.put<ApiSuccessResponse<TRecord>>(endpoint, input);
  return response.data.data;
};

export const configurationService = {
  async createArea(input: AreaMutationInput): Promise<AreaRecord> {
    return postRecord("/areas", input);
  },

  async createCatalog(input: CatalogMutationInput): Promise<CatalogRecord> {
    return postRecord("/catalogs", input);
  },

  async createObservationStatus(
    input: ObservationStatusMutationInput,
  ): Promise<ObservationStatusRecord> {
    return postRecord("/observation-statuses", input);
  },

  async createRiskLevel(input: RiskLevelMutationInput): Promise<RiskLevelRecord> {
    return postRecord("/risk-levels", input);
  },

  async createSystemParameter(
    input: SystemParameterMutationInput,
  ): Promise<SystemParameterRecord> {
    return postRecord("/system-parameters", input);
  },

  async deleteArea(id: string) {
    await apiClient.delete(`/areas/${id}`);
  },

  async deleteCatalog(id: string) {
    await apiClient.delete(`/catalogs/${id}`);
  },

  async deleteObservationStatus(id: string) {
    await apiClient.delete(`/observation-statuses/${id}`);
  },

  async deleteRiskLevel(id: string) {
    await apiClient.delete(`/risk-levels/${id}`);
  },

  async deleteSystemParameter(id: string) {
    await apiClient.delete(`/system-parameters/${id}`);
  },

  async getBootstrap(): Promise<ConfigurationBootstrap> {
    const response = await apiClient.get<ApiSuccessResponse<ConfigurationBootstrap>>(
      "/config/bootstrap",
    );

    return response.data.data;
  },

  async updateArea(id: string, input: AreaMutationInput): Promise<AreaRecord> {
    return putRecord(`/areas/${id}`, input);
  },

  async updateCatalog(id: string, input: CatalogMutationInput): Promise<CatalogRecord> {
    return putRecord(`/catalogs/${id}`, input);
  },

  async updateObservationStatus(
    id: string,
    input: ObservationStatusMutationInput,
  ): Promise<ObservationStatusRecord> {
    return putRecord(`/observation-statuses/${id}`, input);
  },

  async updateRiskLevel(
    id: string,
    input: RiskLevelMutationInput,
  ): Promise<RiskLevelRecord> {
    return putRecord(`/risk-levels/${id}`, input);
  },

  async updateSystemParameter(
    id: string,
    input: SystemParameterMutationInput,
  ): Promise<SystemParameterRecord> {
    return putRecord(`/system-parameters/${id}`, input);
  },
};
