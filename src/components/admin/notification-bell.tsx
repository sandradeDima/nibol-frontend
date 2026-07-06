"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import Link from "next/link";
import {
  Bell,
  CheckCheck,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { QUERY_KEYS } from "@/lib/constants";
import { NotificationTypeBadge } from "@/modules/notifications/notification-item";
import { notificationService } from "@/services/notification-service";
import { getApiErrorMessage } from "@/utils";
import { cn } from "@/utils";

export function NotificationBell({ canView }: { canView: boolean }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const recentNotificationsQuery = useQuery({
    enabled: canView,
    queryFn: () =>
      notificationService.listNotifications({
        page: 1,
        perPage: 5,
      }),
    queryKey: [...QUERY_KEYS.notifications, "recent"],
    staleTime: 15_000,
  });

  const unreadNotificationsQuery = useQuery({
    enabled: canView,
    queryFn: () =>
      notificationService.listNotifications({
        page: 1,
        perPage: 1,
        unreadOnly: true,
      }),
    queryKey: [...QUERY_KEYS.notifications, "unread"],
    staleTime: 10_000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications,
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications,
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications,
      });
    },
  });

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

  if (!canView) {
    return null;
  }

  const unreadCount = unreadNotificationsQuery.data?.pagination.total ?? 0;
  const notifications = recentNotificationsQuery.data?.data ?? [];
  const actionError =
    (markAllReadMutation.error && getApiErrorMessage(markAllReadMutation.error)) ||
    (markReadMutation.error && getApiErrorMessage(markReadMutation.error)) ||
    (deleteNotificationMutation.error &&
      getApiErrorMessage(deleteNotificationMutation.error)) ||
    null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        className={cn(
          "relative inline-flex items-center gap-2 border px-4 py-3 text-sm font-semibold transition",
          open
            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
            : "border-[var(--border)] bg-white text-[var(--foreground-soft)] hover:border-[var(--primary)] hover:text-[var(--foreground)]",
        )}
        onClick={() => {
          setOpen((current) => !current);
        }}
        type="button"
      >
        <Bell className="h-4 w-4" />
        <span className="hidden sm:inline">Notifications</span>
        {unreadNotificationsQuery.isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : unreadCount > 0 ? (
          <span className="inline-flex min-w-6 items-center justify-center bg-[var(--accent)] px-2 py-0.5 text-[11px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : (
          <span className="nibol-badge nibol-badge-success px-2 py-0.5 text-[11px]">
            0
          </span>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(30rem,92vw)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-panel-strong)]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="nibol-eyebrow">
                Centro de alertas
              </p>
              <h2 className="font-display text-2xl font-bold uppercase leading-none text-[var(--foreground)]">
                Notificaciones recientes
              </h2>
              <p className="text-sm text-[var(--muted)]">
                {unreadCount} elemento{unreadCount === 1 ? "" : "s"} sin leer
              </p>
            </div>

            <button
              className="nibol-btn-secondary px-3.5 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={markAllReadMutation.isPending || unreadCount === 0}
              onClick={() => {
                void markAllReadMutation.mutateAsync();
              }}
              type="button"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todo
            </button>
          </div>

          {actionError ? (
            <p className="mt-4 border border-[color:color-mix(in_srgb,var(--accent)_18%,white)] bg-[var(--accent-soft)] px-4 py-3 text-sm font-medium text-[var(--accent)]">
              {actionError}
            </p>
          ) : null}

          {recentNotificationsQuery.isLoading ? (
            <div className="mt-5 flex min-h-44 items-center justify-center border border-dashed border-[var(--border)] bg-[var(--surface-soft)]">
              <div className="flex items-center gap-3 text-sm font-medium text-[var(--muted)]">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Cargando notificaciones...
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                description="Los eventos automaticos y las notificaciones manuales apareceran en este panel."
                icon={Bell}
                title="No hay notificaciones"
              />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={cn(
                    "border px-4 py-4",
                    notification.isRead
                      ? "border-[var(--border)] bg-[var(--surface)]"
                      : "border-[color:color-mix(in_srgb,var(--accent)_18%,white)] bg-[var(--accent-soft)]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-1 h-2.5 w-2.5 shrink-0",
                        notification.isRead ? "bg-[var(--border-strong)]" : "bg-[var(--accent)]",
                      )}
                    />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <NotificationTypeBadge type={notification.type} />
                        {!notification.isRead ? (
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                            Sin leer
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {notification.title}
                        </p>
                        <p className="text-sm leading-6 text-[var(--foreground-soft)]">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {!notification.isRead ? (
                          <button
                            className="nibol-btn-secondary px-3 py-2 text-xs"
                            disabled={markReadMutation.isPending}
                            onClick={() => {
                              void markReadMutation.mutateAsync(notification.id);
                            }}
                            type="button"
                          >
                            Marcar como leida
                          </button>
                        ) : null}
                        <button
                          className="nibol-btn-secondary px-3 py-2 text-xs"
                          disabled={deleteNotificationMutation.isPending}
                          onClick={() => {
                            void deleteNotificationMutation.mutateAsync(notification.id);
                          }}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-5">
            <Link
              className="nibol-btn-primary justify-center"
              href="/notifications"
              onClick={() => {
                setOpen(false);
              }}
            >
              Ver centro de notificaciones
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
