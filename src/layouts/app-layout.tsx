import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { getVisibleSidebarItems } from "@/lib/navigation";
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
  const navigationItems = getVisibleSidebarItems(authorization);

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
