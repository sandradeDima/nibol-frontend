import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { SIDEBAR_ITEMS } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import type { AuthorizationSummary, AuthSession } from "@/types";

type AppLayoutProps = {
  authorization: AuthorizationSummary;
  children: ReactNode;
  session: AuthSession;
};

export function AppLayout({
  authorization,
  children,
  session,
}: AppLayoutProps) {
  const navigationItems = SIDEBAR_ITEMS.filter((item) => {
    return !item.permission || hasPermission(authorization.permissions, item.permission);
  });

  return (
    <AdminShell
      authorization={authorization}
      navigationItems={navigationItems}
      session={session}
    >
      {children}
    </AdminShell>
  );
}
