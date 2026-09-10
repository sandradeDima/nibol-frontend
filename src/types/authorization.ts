export interface AuthorizationSummary {
  dataScope: "ALL" | "AUDIT_SCOPE" | "AREA" | "ASSIGNED";
  isAdmin: boolean;
  permissions: string[];
  roleCode: string | null;
  roleName: string | null;
  roles: string[];
  userId: string;
}

export interface SidebarItem {
  group?: string;
  icon: string;
  label: string;
  permission?: string;
  route: string;
}
