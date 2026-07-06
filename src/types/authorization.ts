export interface AuthorizationSummary {
  isAdmin: boolean;
  permissions: string[];
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
