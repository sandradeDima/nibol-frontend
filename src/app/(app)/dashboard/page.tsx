import { redirect } from "next/navigation";

import { dashboardServer } from "@/modules/dashboard/server";

export default async function DashboardRoutePage() {
  const summary = await dashboardServer.getMySummary();
  redirect(summary.defaultRoute);
}
