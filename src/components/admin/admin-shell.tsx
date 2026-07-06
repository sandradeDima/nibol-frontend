"use client";

import { useEffect, useState, type ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import * as IconSet from "lucide-react";

import { Breadcrumbs } from "@/components/admin/breadcrumbs";
import { UserMenu } from "@/components/admin/user-menu";
import { LogoutButton } from "@/components/auth/logout-button";
import { SearchField } from "@/components/ui/search-field";
import type { AuthSession, AuthorizationSummary, SidebarItem } from "@/types";
import { cn } from "@/utils";

type AdminShellProps = {
  authorization: AuthorizationSummary;
  children: ReactNode;
  navigationItems: SidebarItem[];
  session: AuthSession;
};

type SidebarNavProps = {
  collapsed?: boolean;
  items: SidebarItem[];
  onNavigate?: () => void;
};

const GROUP_ORDER = ["Principal", "Gestion", "Control", "Administracion"] as const;

const GROUP_LABELS: Record<string, string> = {
  Administracion: "Administracion",
  Control: "Control y seguimiento",
  Gestion: "Gestion operativa",
  Principal: "Principal",
};

const isActiveRoute = (pathname: string, route: string): boolean => {
  if (route === "/") {
    return pathname === "/";
  }

  return pathname === route || pathname.startsWith(`${route}/`);
};

const buildNavigationGroups = (items: SidebarItem[]) => {
  const groupedItems = new Map<string, SidebarItem[]>();

  items.forEach((item) => {
    const group = item.group ?? "General";
    groupedItems.set(group, [...(groupedItems.get(group) ?? []), item]);
  });

  const orderedGroups = GROUP_ORDER.filter((group) => groupedItems.has(group)).map((group) => ({
    items: groupedItems.get(group) ?? [],
    key: group,
    label: GROUP_LABELS[group] ?? group,
  }));

  const extraGroups = [...groupedItems.entries()]
    .filter(([group]) => !GROUP_ORDER.includes(group as (typeof GROUP_ORDER)[number]))
    .map(([group, groupItems]) => ({
      items: groupItems,
      key: group,
      label: group,
    }));

  return [...orderedGroups, ...extraGroups];
};

function SidebarNav({ collapsed = false, items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const groups = buildNavigationGroups(items);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-7">
      {groups.map((group) => (
        <div key={group.key} className="space-y-2">
          {!collapsed ? (
            <button
              aria-controls={`sidebar-group-${group.key}`}
              aria-expanded={expandedGroups[group.key] ?? true}
              className="flex w-full items-center justify-between gap-3 px-3 text-left text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-slate-500 transition hover:text-slate-300"
              onClick={() => {
                setExpandedGroups((current) => ({
                  ...current,
                  [group.key]: !(current[group.key] ?? true),
                }));
              }}
              type="button"
            >
              <span>{group.label}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  expandedGroups[group.key] ?? true ? "rotate-0" : "-rotate-90",
                )}
              />
            </button>
          ) : null}

          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
              collapsed || (expandedGroups[group.key] ?? true)
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-60",
            )}
          >
            <div className="overflow-hidden">
              <nav
                className={cn("grid gap-1.5", collapsed ? "" : "pt-1")}
                id={`sidebar-group-${group.key}`}
              >
                {group.items.map((item) => {
                  const Icon =
                    (IconSet as unknown as Record<string, typeof IconSet.LayoutDashboard>)[item.icon] ??
                    IconSet.LayoutDashboard;
                  const active = isActiveRoute(pathname, item.route);

                  return (
                    <Link
                      key={item.route}
                      aria-label={collapsed ? item.label : undefined}
                      className={cn(
                        "group flex items-center border px-3 py-3 transition",
                        collapsed ? "justify-center" : "gap-3",
                        active
                          ? "border-white/10 bg-white/8 text-white"
                          : "border-transparent text-slate-300 hover:border-white/8 hover:bg-white/4 hover:text-white",
                      )}
                      href={item.route}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center transition",
                          active
                            ? "bg-white/10 text-white"
                            : "bg-white/4 text-slate-400 group-hover:bg-white/8 group-hover:text-white",
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>

                      {!collapsed ? (
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                          {item.label}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SidebarBrand({
  collapsed,
  onToggleCollapsed,
  showCollapseToggle,
}: {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  showCollapseToggle?: boolean;
}) {
  return (
    <div className="border-b border-white/10 pb-6">
      <div className={cn("flex items-start gap-3", collapsed ? "justify-center" : "justify-between")}>
        <div className={cn("space-y-4", collapsed && "flex flex-col items-center")}>
          <Image
            alt="NIBOL Bolivia"
            className={cn(
              "h-auto brightness-0 invert",
              collapsed ? "w-12" : "w-[10.5rem]",
            )}
            height={57}
            priority
            src="/assets/logo-nibol-negro-ok1.png"
            width={282}
          />
          {!collapsed ? (
            <div className="space-y-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                NIBOL Bolivia
              </p>
              <p className="max-w-[16rem] text-sm leading-6 text-slate-300">
                Sistema de seguimiento de riesgos para control corporativo.
              </p>
            </div>
          ) : null}
        </div>

        {showCollapseToggle && onToggleCollapsed ? (
          <button
            className="hidden border border-white/10 bg-white/6 p-2.5 text-slate-200 transition hover:bg-white/10 hover:text-white lg:inline-flex"
            onClick={onToggleCollapsed}
            type="button"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5" />
            ) : (
              <PanelLeftClose className="h-4.5 w-4.5" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SidebarSummary({
  authorization,
  collapsed,
  session,
}: {
  authorization: AuthorizationSummary;
  collapsed: boolean;
  session: AuthSession;
}) {
  return (
    <div className="mt-auto border-t border-white/10 pt-5">
      {!collapsed ? (
        <div className="mb-4 space-y-1">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Sesion activa
          </p>
          <p className="text-sm font-semibold text-white">{session.user.name}</p>
          <p className="text-xs leading-5 text-slate-400">
            {authorization.roles.join(" • ") || "Usuario autenticado"}
          </p>
        </div>
      ) : null}

      <LogoutButton
        className={cn(
          "w-full justify-center border border-white/10 bg-white/6 text-slate-200 hover:border-white/16 hover:bg-white/10 hover:text-white",
          collapsed && "px-0",
        )}
      >
        {collapsed ? null : "Cerrar sesion"}
      </LogoutButton>
    </div>
  );
}

export function AdminShell({
  authorization,
  children,
  navigationItems,
  session,
}: AdminShellProps) {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolbarSearch, setToolbarSearch] = useState("");

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-screen w-full">
        <aside
          className={cn(
            "nibol-panel-dark sticky top-0 hidden h-screen max-h-screen shrink-0 overflow-hidden border-r border-r-white/10 px-4 py-5 shadow-[var(--shadow-sidebar)] lg:block",
            desktopCollapsed ? "w-[5.75rem]" : "w-[18.75rem]",
          )}
        >
          <div className="flex h-full min-h-0 flex-col">
            <SidebarBrand
              collapsed={desktopCollapsed}
              onToggleCollapsed={() => {
                setDesktopCollapsed((current) => !current);
              }}
              showCollapseToggle
            />

            <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
              <SidebarNav collapsed={desktopCollapsed} items={navigationItems} />
            </div>

            <SidebarSummary
              authorization={authorization}
              collapsed={desktopCollapsed}
              session={session}
            />
          </div>
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              aria-label="Close navigation"
              className="absolute inset-0 bg-[rgba(7,20,45,0.42)]"
              onClick={() => {
                setMobileOpen(false);
              }}
              type="button"
            />

            <aside className="nibol-panel-dark relative z-10 h-full w-[min(19rem,90vw)] overflow-hidden px-4 py-5">
              <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-5">
                <Image
                  alt="NIBOL Bolivia"
                  className="h-auto w-[9.5rem] brightness-0 invert"
                  height={57}
                  priority
                  src="/assets/logo-nibol-negro-ok1.png"
                  width={282}
                />
                <button
                  className="border border-white/10 bg-white/6 p-2.5 text-slate-200 transition hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    setMobileOpen(false);
                  }}
                  type="button"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="flex h-[calc(100%-4.5rem)] min-h-0 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <SidebarNav
                    items={navigationItems}
                    onNavigate={() => {
                      setMobileOpen(false);
                    }}
                  />
                </div>

                <SidebarSummary
                  authorization={authorization}
                  collapsed={false}
                  session={session}
                />
              </div>
            </aside>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(255,255,255,0.96)] backdrop-blur-md">
            <div className="px-4 py-4 sm:px-6 lg:px-8">
              <div className="grid gap-4 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
                <div className="flex items-center gap-3">
                  <button
                    className="nibol-btn-secondary px-3 lg:hidden"
                    onClick={() => {
                      setMobileOpen(true);
                    }}
                    type="button"
                  >
                    <Menu className="h-4.5 w-4.5" />
                  </button>

                  <div className="min-w-0">
                    <p className="nibol-eyebrow">NIBOL Bolivia</p>
                    <p className="truncate text-sm text-[var(--muted)]">
                      Panel corporativo
                    </p>
                  </div>
                </div>

                <SearchField
                  className="hidden xl:block"
                  onChange={(value) => {
                    setToolbarSearch(value);
                  }}
                  placeholder="Buscar modulo o seccion"
                  value={toolbarSearch}
                />

                <UserMenu authorization={authorization} session={session} />
              </div>

              <div className="mt-4">
                <Breadcrumbs />
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
