"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import Link from "next/link";
import { ChevronDown, Shield } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationBell } from "@/components/admin/notification-bell";
import type { AuthorizationSummary, AuthSession } from "@/types";
import { cn } from "@/utils";

type UserMenuProps = {
  authorization: AuthorizationSummary;
  session: AuthSession;
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

export function UserMenu({ authorization, session }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canViewNotifications = authorization.permissions.includes("notifications.view");

  const handleDocumentPointerDown = useEffectEvent((event: PointerEvent) => {
    if (!containerRef.current?.contains(event.target as Node)) {
      setOpen(false);
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [open]);

  return (
    <div className="flex items-center gap-3">
      <NotificationBell canView={canViewNotifications} />

      <div className="relative" ref={containerRef}>
        <button
          aria-expanded={open}
          className={cn(
            "inline-flex items-center gap-3 border px-3 py-2.5 text-left transition",
            open
              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
              : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--primary)]",
          )}
          onClick={() => {
            setOpen((current) => !current);
          }}
          type="button"
        >
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={session.user.name}
                className="h-full w-full object-cover"
                src={session.user.image}
              />
            ) : (
              getInitials(session.user.name)
            )}
          </div>

          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold">{session.user.name}</p>
            <p
              className={cn(
                "truncate text-xs",
                open ? "text-slate-200" : "text-[var(--muted)]",
              )}
            >
              {authorization.roles.join(", ") || "Sin rol asignado"}
            </p>
          </div>

          <ChevronDown
            className={cn("h-4 w-4 transition", open ? "rotate-180" : "rotate-0")}
          />
        </button>

        {open ? (
          <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[19rem] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-panel-strong)]">
            <div className="border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">{session.user.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{session.user.email}</p>
              <div className="mt-4 flex items-start gap-3">
                <div className="bg-[var(--primary)] p-2 text-white">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Acceso
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {authorization.roles.map((role) => (
                      <span
                        key={role}
                        className="nibol-badge nibol-badge-primary"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {authorization.permissions.length} permisos activos
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              <Link
                className="nibol-btn-secondary justify-start"
                href="/profile"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Mi perfil
              </Link>
              <div className="border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted)]">
                Sesion administrada por Better Auth
              </div>
              <LogoutButton
                className="inline-flex items-center gap-3 border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
                onLoggedOut={() => {
                  setOpen(false);
                }}
                variant="menu"
              >
                Cerrar sesion
              </LogoutButton>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
