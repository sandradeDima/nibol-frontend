"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Filter, Inbox, LoaderCircle } from "lucide-react";
import Link from "next/link";

import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SearchField } from "@/components/ui/search-field";
import { StatCard } from "@/components/ui/stat-card";
import { QUERY_KEYS } from "@/lib/constants";
import { NotificationComposer } from "@/modules/notifications/notification-composer";
import { notificationTypeOptions } from "@/modules/notifications/forms";
import {
  NotificationDeleteButton,
  NotificationItem,
} from "@/modules/notifications/notification-item";
import { notificationService } from "@/services/notification-service";
import { getApiErrorMessage } from "@/utils";

const panelClassName = "nibol-panel p-6";

export function NotificationCenter({
  canCreate,
}: {
  canCreate: boolean;
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "error" | "info" | "success" | "warning">(
    "all",
  );
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "deadlines" | "approvals" | "system">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const deferredSearch = useDeferredValue(search);

  const notificationListQuery = useQuery({
    queryFn: () =>
      notificationService.listNotifications({
        page,
        perPage: pageSize,
        search: deferredSearch,
        dateFrom: dateFrom ? `${dateFrom}T00:00:00.000Z` : undefined,
        dateTo: dateTo ? `${dateTo}T23:59:59.999Z` : undefined,
        priority: priorityFilter === "all" ? undefined : (priorityFilter as "LOW" | "NORMAL" | "HIGH" | "CRITICAL"),
        type: typeFilter === "all" ? undefined : typeFilter,
        unreadOnly: activeTab === "unread",
      }),
    queryKey: [
      ...QUERY_KEYS.notifications,
      "list",
      {
        page,
        pageSize,
        search: deferredSearch,
        typeFilter,
        priorityFilter,
        activeTab,
        dateFrom,
        dateTo,
      },
    ],
  });

  const totalQuery = useQuery({
    queryFn: () =>
      notificationService.listNotifications({
        page: 1,
        perPage: 1,
      }),
    queryKey: [...QUERY_KEYS.notifications, "total"],
    staleTime: 30_000,
  });

  const unreadQuery = useQuery({
    queryFn: () =>
      notificationService.listNotifications({
        page: 1,
        perPage: 1,
        unreadOnly: true,
      }),
    queryKey: [...QUERY_KEYS.notifications, "unread"],
    staleTime: 15_000,
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

  if (notificationListQuery.isError) {
    return (
      <ErrorState
        description={getApiErrorMessage(notificationListQuery.error)}
        title="No fue posible cargar las notificaciones"
      />
    );
  }

  const notifications = notificationListQuery.data?.data ?? [];
  const visibleNotifications = useMemo(() => {
    if (activeTab === "all" || activeTab === "unread") return notifications;
    return notifications.filter((notification) => {
      const eventType = notification.eventType ?? "";
      if (activeTab === "deadlines") return eventType.includes("DUE") || eventType.includes("OVERDUE");
      if (activeTab === "approvals") return eventType.includes("REVIEW") || eventType.includes("APPROVED") || eventType.includes("RETURNED");
      return eventType.length === 0;
    });
  }, [activeTab, notifications]);
  const pagination = notificationListQuery.data?.pagination;
  const totalNotifications = totalQuery.data?.pagination.total ?? 0;
  const unreadNotifications = unreadQuery.data?.pagination.total ?? 0;
  const actionError =
    (markAllReadMutation.error && getApiErrorMessage(markAllReadMutation.error)) ||
    (markReadMutation.error && getApiErrorMessage(markReadMutation.error)) ||
    (deleteNotificationMutation.error &&
      getApiErrorMessage(deleteNotificationMutation.error)) ||
    null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          description="Las alertas pendientes permanecen visibles en la campana, el desplegable y la bandeja principal."
          icon={Bell}
          label="Pendientes"
          tone="accent"
          value={String(unreadNotifications)}
        />
        <StatCard
          description="Esta bandeja concentra el historial interno para futuras extensiones por correo, SMS o WhatsApp."
          icon={Inbox}
          label="Total"
          value={String(totalNotifications)}
        />
        <StatCard
          description="Use la accion masiva para mantener la bandeja limpia despues de revisar la actividad reciente."
          icon={Filter}
          label="Accion masiva"
          value="Marcar todo"
        />
      </section>

      <div className={`grid gap-6 ${canCreate ? "xl:grid-cols-[1.25fr_0.9fr]" : ""}`}>
        <section className={panelClassName}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-stone-950">
                Bandeja de notificaciones
              </h2>
              <p className="text-sm leading-7 text-stone-700">
                Revise eventos recientes del sistema, atienda pendientes y mantenga la bandeja ordenada.
              </p>
            </div>

            <button
              className="nibol-btn-secondary justify-center disabled:cursor-not-allowed disabled:opacity-50"
              disabled={markAllReadMutation.isPending || unreadNotifications === 0}
              onClick={() => {
                void markAllReadMutation.mutateAsync();
              }}
              type="button"
            >
              {markAllReadMutation.isPending ? "Actualizando..." : "Marcar todo como leido"}
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
              {([
                ["all", "Todas"],
                ["unread", "No leídas"],
                ["deadlines", "Vencimientos"],
                ["approvals", "Aprobaciones"],
                ["system", "Sistema"],
              ] as const).map(([value, label]) => (
                <button
                  className={activeTab === value ? "nibol-btn-primary px-3 py-2 text-xs" : "nibol-btn-secondary px-3 py-2 text-xs"}
                  key={value}
                  onClick={() => {
                    setActiveTab(value);
                    setPage(1);
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_13rem_13rem_10rem_10rem]">
            <SearchField
              onChange={(value) => {
                setPage(1);
                setSearch(value);
              }}
              placeholder="Buscar notificaciones"
              value={search}
            />

            <select
              className="nibol-field"
              onChange={(event) => {
                setPage(1);
                setTypeFilter(
                  event.target.value as "all" | "error" | "info" | "success" | "warning",
                );
              }}
              value={typeFilter}
            >
              <option value="all">Todos los tipos</option>
              {notificationTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="nibol-field"
              onChange={(event) => {
                setPage(1);
                setPriorityFilter(event.target.value);
              }}
              value={priorityFilter}
            >
              <option value="all">Todas las prioridades</option>
              <option value="CRITICAL">Crítica</option>
              <option value="HIGH">Alta</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Baja</option>
            </select>

            <input className="nibol-field" onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom} />
            <input className="nibol-field" onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} />

            <button
              className={`inline-flex h-12 items-center justify-center border px-4 text-sm font-semibold transition ${
                activeTab === "unread"
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border-strong)] bg-white text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]"
              }`}
              onClick={() => {
                setPage(1);
                setActiveTab((current) => (current === "unread" ? "all" : "unread"));
              }}
              type="button"
            >
              {activeTab === "unread" ? "Solo no leídas" : "Todas las notificaciones"}
            </button>
            </div>
          </div>

          {actionError ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {actionError}
            </p>
          ) : null}

          {notificationListQuery.isLoading ? (
            <div className="mt-8 flex min-h-48 items-center justify-center rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70">
              <div className="flex items-center gap-3 text-sm font-medium text-stone-600">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Cargando notificaciones...
              </div>
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                description="Los nuevos eventos apareceran aqui automaticamente. Tambien puede limpiar filtros o enviar una notificacion manual."
                icon={Inbox}
                title="No hay notificaciones para esta vista"
              />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {visibleNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  actions={
                    <>
                      {!notification.isRead ? (
                        <button
                          className="nibol-btn-secondary px-3.5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={markReadMutation.isPending}
                          onClick={() => {
                            void markReadMutation.mutateAsync(notification.id);
                          }}
                          type="button"
                        >
                          Marcar como leida
                        </button>
                      ) : null}
                      {notification.targetUrl ? (
                        <Link
                          className="nibol-btn-secondary px-3.5 py-2 text-sm"
                          href={notification.targetUrl}
                          onClick={() => {
                            if (!notification.isRead) void markReadMutation.mutateAsync(notification.id);
                          }}
                        >
                          Abrir registro
                        </Link>
                      ) : null}
                      <NotificationDeleteButton
                        disabled={deleteNotificationMutation.isPending}
                        onClick={() => {
                          void deleteNotificationMutation.mutateAsync(notification.id);
                        }}
                      />
                    </>
                  }
                  notification={notification}
                />
              ))}
            </div>
          )}

          {pagination ? (
            <div className="mt-6">
              <DataTablePagination
                isLoading={notificationListQuery.isFetching}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                }}
                onPageSizeChange={(nextPageSize) => {
                  setPage(1);
                  setPageSize(nextPageSize);
                }}
                page={pagination.page}
                pageSize={pagination.perPage}
                pageSizeOptions={[10, 20, 50]}
                total={pagination.total}
              />
            </div>
          ) : null}
        </section>

        {canCreate ? <NotificationComposer /> : null}
      </div>
    </div>
  );
}
