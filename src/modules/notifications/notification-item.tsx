"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  CircleAlert,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

import type { AppNotification, NotificationType } from "@/types";
import { cn } from "@/utils";

const notificationTypeConfig: Record<
  NotificationType,
  {
    badgeClassName: string;
    icon: typeof Bell;
    iconClassName: string;
    label: string;
  }
> = {
  error: {
    badgeClassName:
      "border-[color:color-mix(in_srgb,var(--accent)_18%,white)] bg-[var(--accent-soft)] text-[var(--accent)]",
    icon: AlertCircle,
    iconClassName: "bg-[var(--accent-soft)] text-[var(--accent)]",
    label: "Error",
  },
  info: {
    badgeClassName:
      "border-[color:color-mix(in_srgb,var(--info)_18%,white)] bg-[var(--info-soft)] text-[var(--info)]",
    icon: Bell,
    iconClassName: "bg-[var(--info-soft)] text-[var(--info)]",
    label: "Informacion",
  },
  success: {
    badgeClassName:
      "border-[color:color-mix(in_srgb,var(--success)_18%,white)] bg-[var(--success-soft)] text-[var(--success)]",
    icon: CheckCircle2,
    iconClassName: "bg-[var(--success-soft)] text-[var(--success)]",
    label: "Exito",
  },
  warning: {
    badgeClassName:
      "border-[color:color-mix(in_srgb,var(--warning)_18%,white)] bg-[var(--warning-soft)] text-[var(--warning)]",
    icon: CircleAlert,
    iconClassName: "bg-[var(--warning-soft)] text-[var(--warning)]",
    label: "Alerta",
  },
};

export const getNotificationTypeLabel = (type: NotificationType): string => {
  return notificationTypeConfig[type].label;
};

export const getNotificationTypeOptions = () => {
  return Object.entries(notificationTypeConfig).map(([value, config]) => ({
    label: config.label,
    value: value as NotificationType,
  }));
};

export function NotificationTypeBadge({ type }: { type: NotificationType }) {
  const config = notificationTypeConfig[type];

  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        config.badgeClassName,
      )}
    >
      {config.label}
    </span>
  );
}

export function NotificationItem({
  actions,
  notification,
}: {
  actions?: ReactNode;
  notification: AppNotification;
}) {
  const config = notificationTypeConfig[notification.type];
  const Icon = config.icon;

  return (
    <article
      className={cn(
        "border px-5 py-5 shadow-[var(--shadow-panel)] transition",
        notification.isRead
          ? "border-[var(--border)] bg-[var(--surface)]"
          : "border-[color:color-mix(in_srgb,var(--accent)_18%,white)] bg-[var(--accent-soft)]",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.2rem]",
            config.iconClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <NotificationTypeBadge type={notification.type} />
            {!notification.isRead ? (
              <span className="nibol-badge nibol-badge-accent">
                Sin leer
              </span>
            ) : null}
            <time
              className="text-xs font-medium text-[var(--muted)]"
              dateTime={notification.createdAt}
              title={format(new Date(notification.createdAt), "PPpp")}
            >
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </time>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold text-[var(--foreground)]">{notification.title}</h3>
            <p className="text-sm leading-7 text-[var(--foreground-soft)]">{notification.message}</p>
          </div>

          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function NotificationDeleteButton({
  disabled = false,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="nibol-btn-secondary px-3.5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Trash2 className="h-4 w-4" />
      Eliminar
    </button>
  );
}
