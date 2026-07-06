import type { ComponentType, ReactNode } from "react";

import { Inbox } from "lucide-react";

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: ComponentType<{
    className?: string;
  }>;
  title: string;
};

export function EmptyState({
  action,
  description,
  icon: Icon = Inbox,
  title,
}: EmptyStateProps) {
  return (
    <section className="border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center shadow-[var(--shadow-panel)] sm:px-10">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
        <div className="bg-[var(--primary)] p-4 text-white shadow-[var(--shadow-panel)]">
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-3">
          <h2 className="font-display text-3xl font-bold uppercase leading-none tracking-[-0.03em] text-[var(--foreground)]">
            {title}
          </h2>
          <p className="text-sm leading-7 text-[var(--foreground-soft)] sm:text-base">
            {description}
          </p>
        </div>
        {action ? <div className="flex flex-wrap justify-center gap-3">{action}</div> : null}
      </div>
    </section>
  );
}
