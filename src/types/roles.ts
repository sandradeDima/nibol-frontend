export interface RoleTableRow {
  createdAt: string;
  description: string | null;
  id: string;
  isAdmin: boolean;
  name: string;
  usersCount: number;
}

export interface RoleDetails extends RoleTableRow {
  permissions: string[];
  updatedAt: string;
}

export interface CreateRoleInput {
  description?: string | null;
  name: string;
  permissionNames: string[];
}

export type UpdateRoleInput = CreateRoleInput;
