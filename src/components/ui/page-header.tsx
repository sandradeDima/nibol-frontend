import type { ReactNode } from "react";

import { cn } from "@/utils";

type PageHeaderProps = {
  actions?: ReactNode;
  className?: string;
  compact?: boolean;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function PageHeader({
  actions,
  className,
  compact = false,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "nibol-panel flex flex-col px-6 sm:px-8",
        compact ? "gap-3 py-4" : "gap-5 py-6",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col lg:flex-row lg:items-end lg:justify-between",
          compact ? "gap-3" : "gap-5",
        )}
      >
        <div className={compact ? "space-y-2" : "space-y-3"}>
          {eyebrow ? <p className="nibol-eyebrow">{eyebrow}</p> : null}
          <div className="space-y-2">
            <h1
              className={cn(
                "font-display leading-none font-bold tracking-[-0.03em] text-[var(--foreground)] uppercase",
                compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl",
              )}
            >
              {title}
            </h1>
            {description ? (
              <p
                className={cn(
                  "max-w-3xl text-[var(--foreground-soft)]",
                  compact
                    ? "text-sm leading-6"
                    : "text-sm leading-7 sm:text-base",
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
