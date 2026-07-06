export type ConfigurationCatalogType =
  | "proceso_auditado"
  | "tipo_observacion"
  | "fuente_hallazgo"
  | "categoria_hallazgo";

export type SystemParameterValueType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "date";

export interface ConfigurationUserSummary {
  email: string;
  id: string;
  name: string;
}

export interface AreaRecord {
  active: boolean;
  code: string | null;
  createdAt: string;
  description: string | null;
  id: string;
  managerUser: ConfigurationUserSummary | null;
  name: string;
  updatedAt: string;
}

export interface RiskLevelRecord {
  active: boolean;
  colorToken: string | null;
  createdAt: string;
  defaultDeadlineDays: number | null;
  description: string | null;
  id: string;
  key: string;
  name: string;
  severityOrder: number;
  updatedAt: string;
}

export interface ObservationStatusRecord {
  active: boolean;
  countsAsOverdue: boolean;
  createdAt: string;
  description: string | null;
  id: string;
  isFinal: boolean;
  isInitial: boolean;
  key: string;
  name: string;
  sortOrder: number;
  updatedAt: string;
}

export interface SystemParameterRecord {
  active: boolean;
  createdAt: string;
  description: string | null;
  editable: boolean;
  group: string;
  id: string;
  key: string;
  name: string;
  updatedAt: string;
  value: string;
  valueType: SystemParameterValueType;
}

export interface CatalogRecord {
  active: boolean;
  createdAt: string;
  description: string | null;
  id: string;
  key: string | null;
  name: string;
  sortOrder: number;
  type: ConfigurationCatalogType;
  updatedAt: string;
}

export interface ConfigurationBootstrap {
  areas: Array<{
    code: string | null;
    id: string;
    managerUser: ConfigurationUserSummary | null;
    name: string;
  }>;
  catalogs: Record<ConfigurationCatalogType, CatalogRecord[]>;
  riskLevels: Array<{
    colorToken: string | null;
    defaultDeadlineDays: number | null;
    id: string;
    key: string;
    name: string;
    severityOrder: number;
  }>;
  statuses: Array<{
    countsAsOverdue: boolean;
    id: string;
    isFinal: boolean;
    isInitial: boolean;
    key: string;
    name: string;
    sortOrder: number;
  }>;
  users: ConfigurationUserSummary[];
}

export interface AreaMutationInput {
  active: boolean;
  code: string | null;
  description: string | null;
  managerUserId: string | null;
  name: string;
}

export interface RiskLevelMutationInput {
  active: boolean;
  colorToken: string | null;
  defaultDeadlineDays: number | null;
  description: string | null;
  key: string;
  name: string;
  severityOrder: number;
}

export interface ObservationStatusMutationInput {
  active: boolean;
  countsAsOverdue: boolean;
  description: string | null;
  isFinal: boolean;
  isInitial: boolean;
  key: string;
  name: string;
  sortOrder: number;
}

export interface SystemParameterMutationInput {
  active: boolean;
  description: string | null;
  editable: boolean;
  group: string;
  key: string;
  name: string;
  value: string;
  valueType: SystemParameterValueType;
}

export interface CatalogMutationInput {
  active: boolean;
  description: string | null;
  key: string | null;
  name: string;
  sortOrder: number;
  type: ConfigurationCatalogType;
}
