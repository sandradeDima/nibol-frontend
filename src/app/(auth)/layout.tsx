import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AuthLayout } from "@/layouts/auth-layout";
import { getServerSession } from "@/lib/server-auth";

export default async function AuthRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (session?.session) {
    redirect("/");
  }

  return <AuthLayout>{children}</AuthLayout>;
}
