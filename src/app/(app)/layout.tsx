import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AppLayout } from "@/layouts/app-layout";
import { getServerAuthorization, requireAuth } from "@/lib/server-auth";

export default async function ProtectedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAuth();
  const authorization = await getServerAuthorization();

  if (!authorization) {
    redirect("/login");
  }

  return (
    <AppLayout authorization={authorization} session={session}>
      {children}
    </AppLayout>
  );
}
