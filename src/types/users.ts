export interface UserTableRow {
  createdAt: string;
  email: string;
  emailVerified: boolean;
  id: string;
  isActive: boolean;
  lastLoginAt: string | null;
  name: string;
  roles: string[];
}

export interface RoleOption {
  description?: string | null;
  id: string;
  name: string;
}

export interface UserOption {
  email: string;
  id: string;
  name: string;
}

export interface UserDetails {
  avatar?: string | null;
  createdAt: string;
  email: string;
  emailVerified: boolean;
  id: string;
  isActive: boolean;
  lastLoginAt: string | null;
  name: string;
  roleIds: string[];
  roles: RoleOption[];
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  isActive: boolean;
  name: string;
  password: string;
  roleIds: string[];
}

export interface UpdateUserInput {
  email: string;
  isActive: boolean;
  name: string;
  roleIds: string[];
}

export interface UserProfile {
  avatar?: string | null;
  createdAt: string;
  email: string;
  id: string;
  lastLoginAt: string | null;
  name: string;
  roles: string[];
}

export interface UpdateProfileInput {
  name: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
