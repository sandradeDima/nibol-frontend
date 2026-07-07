"use client";

import { useState } from "react";

import { BadgeCheck, CalendarPlus2 } from "lucide-react";

import { PendingProgressApprovals } from "@/modules/progress/pending-progress-approvals";
import { cn } from "@/utils";

import { PendingExtensionRequestApprovals } from "./pending-extension-request-approvals";

type PendingApprovalsWorkspaceProps = {
  canViewExtensions: boolean;
  canViewProgress: boolean;
};

type TabId = "extensions" | "progress";

export function PendingApprovalsWorkspace({
  canViewExtensions,
  canViewProgress,
}: PendingApprovalsWorkspaceProps) {
  const initialTab: TabId = canViewProgress ? "progress" : "extensions";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const availableTabs = [
    canViewProgress
      ? {
          icon: BadgeCheck,
          id: "progress" as const,
          label: "Avances y evidencias",
        }
      : null,
    canViewExtensions
      ? {
          icon: CalendarPlus2,
          id: "extensions" as const,
          label: "Ampliaciones de plazo",
        }
      : null,
  ].filter(Boolean);

  if (availableTabs.length === 1) {
    return activeTab === "progress" ? (
      <PendingProgressApprovals />
    ) : (
      <PendingExtensionRequestApprovals />
    );
  }

  return (
    <section className="space-y-5">
      <section className="nibol-panel p-4">
        <div className="flex flex-wrap gap-3">
          {availableTabs.map((tab) => {
            if (!tab) {
              return null;
            }

            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                className={cn(
                  "inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-semibold transition",
                  isActive
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:border-[var(--primary)]",
                )}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                type="button"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "progress" ? (
        <PendingProgressApprovals />
      ) : (
        <PendingExtensionRequestApprovals />
      )}
    </section>
  );
}
