"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

import { buildBreadcrumbs } from "@/lib/navigation";
import { cn } from "@/utils";

export function Breadcrumbs() {
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2 text-sm text-[var(--muted)]">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isHome = item.href === "/" || item.href === "/dashboard";

          return (
            <li key={item.href} className="flex items-center gap-1">
              {index > 0 ? <ChevronRight className="h-4 w-4 text-[var(--border-strong)]" /> : null}
              {isLast ? (
                <span className="inline-flex items-center gap-2 border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-semibold text-[var(--foreground)] shadow-[var(--shadow-panel)]">
                  {isHome ? <Home className="h-3.5 w-3.5" /> : null}
                  {item.label}
                </span>
              ) : (
                <Link
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
                    isHome ? "font-medium text-[var(--foreground-soft)]" : "text-[var(--muted)]",
                  )}
                  href={item.href}
                >
                  {isHome ? <Home className="h-3.5 w-3.5" /> : null}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
