import type { ComponentType } from "react";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/utils";

type StatCardProps = {
  description: string;
  href?: string;
  icon: ComponentType<{
    className?: string;
  }>;
  label: string;
  tone?: "accent" | "default";
  value: string;
};

export function StatCard({
  description,
  href,
  icon: Icon,
  label,
  tone = "default",
  value,
}: StatCardProps) {
  const content = (
    <article
      className={cn(
        "group relative overflow-hidden border px-5 py-5 transition duration-200",
        tone === "accent"
          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[var(--shadow-panel-strong)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-panel)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4">
          <p
            className={cn(
              "font-display text-xs font-bold uppercase tracking-[0.24em]",
              tone === "accent" ? "text-slate-200" : "text-[var(--primary)]",
            )}
          >
            {label}
          </p>
          <div className="space-y-2">
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            <p
              className={cn(
                "max-w-[28ch] text-sm leading-6",
                tone === "accent" ? "text-slate-300" : "text-[var(--foreground-soft)]",
              )}
            >
              {description}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "p-3",
            tone === "accent"
              ? "bg-white/10 text-white"
              : "bg-[var(--primary-soft)] text-[var(--primary)]",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {href ? (
        <div
          className={cn(
            "mt-6 inline-flex items-center gap-2 text-sm font-semibold",
            tone === "accent"
              ? "text-white"
              : "text-[var(--foreground)]",
          )}
        >
          Ver modulo
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </div>
      ) : null}
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <Link className="block" href={href}>
      {content}
    </Link>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)]">
      <div className="animate-pulse space-y-4">
        <div className="h-3 w-20 bg-[var(--border)]" />
        <div className="h-8 w-24 bg-[var(--border)]" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-[var(--border)]" />
          <div className="h-3 w-3/4 bg-[var(--border)]" />
        </div>
      </div>
    </div>
  );
}
