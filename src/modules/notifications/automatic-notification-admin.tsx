"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  Eye,
  Mail,
  Play,
  RefreshCw,
  Save,
  ShieldAlert,
} from "lucide-react";

import { QUERY_KEYS } from "@/lib/constants";
import { notificationService } from "@/services/notification-service";
import type {
  AutomaticNotificationRule,
  DeadlineReminderPolicy,
  DeadlineReminderRole,
} from "@/types";
import { getApiErrorMessage } from "@/utils";

const ROLE_ORDER: DeadlineReminderRole[] = [
  "AREA_RESPONSIBLE",
  "EXECUTOR",
  "PROCESS_OWNER",
];

const ROLE_HELP: Record<DeadlineReminderRole, string> = {
  AREA_RESPONSIBLE: "Planes de las áreas que administra el responsable.",
  EXECUTOR: "Planes actualmente asignados al ejecutor.",
  PROCESS_OWNER: "Planes de las áreas y procesos bajo su responsabilidad.",
};

const REMINDER_BUCKET_LABELS = {
  DUE_TODAY: "Vence hoy",
  OVERDUE: "Vencido",
  UPCOMING: "Próximo",
} as const;

type PolicyDraft = Omit<DeadlineReminderPolicy, "createdAt" | "role">;

const getDateKey = () => {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "America/La_Paz",
      year: "numeric",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
};

const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString("es-BO", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Sin ejecución";

const formatExecutionDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Sin fecha";

const getDraft = (
  policy: DeadlineReminderPolicy,
  drafts: Partial<Record<DeadlineReminderRole, PolicyDraft>>,
): PolicyDraft =>
  drafts[policy.role] ?? {
    cadenceMonths: policy.cadenceMonths,
    cutoffDay: policy.cutoffDay,
    enabled: policy.enabled,
    upcomingWindowDays: policy.upcomingWindowDays,
  };

const statusLabel: Record<string, string> = {
  FAILED: "Fallida",
  PARTIAL: "Parcial",
  RUNNING: "En curso",
  SUCCESS: "Exitosa",
};

const ALERT_CATEGORY_RULES = [
  {
    description: "Incluir planes cuya fecha límite ya venció.",
    key: "include_reminder_overdue",
    name: "Planes vencidos",
  },
  {
    description: "Incluir planes que vencen en la fecha de corte.",
    key: "include_reminder_due_today",
    name: "Planes que vencen hoy",
  },
  {
    description:
      "Incluir planes con vencimiento dentro de la ventana configurada por rol.",
    key: "include_reminder_upcoming",
    name: "Próximos vencimientos",
  },
] as const;

const DELIVERY_RULES = [
  {
    description:
      "Crear avisos dentro de la campana y la bandeja de notificaciones.",
    key: "notify_in_app",
    name: "Notificaciones dentro de NIBOL",
  },
  {
    description: "Enviar los avisos automáticos por correo electrónico.",
    key: "notify_by_email",
    name: "Correo electrónico",
  },
] as const;

const findAutomaticRule = (rules: AutomaticNotificationRule[], key: string) =>
  rules.find((rule) => rule.key === key);

function AutomaticRuleToggle({
  checked,
  disabled,
  onChange,
  rule,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  rule: { description: string; key: string; name: string };
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border border-[var(--border)] px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-[var(--foreground)]">
          {rule.name}
        </span>
        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
          {rule.description}
        </span>
      </span>
      <input
        checked={checked}
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function PolicyCard({
  canEdit,
  drafts,
  onChange,
  onSave,
  pending,
  policy,
}: {
  canEdit: boolean;
  drafts: Partial<Record<DeadlineReminderRole, PolicyDraft>>;
  onChange: (
    role: DeadlineReminderRole,
    field: keyof PolicyDraft,
    value: boolean | number,
  ) => void;
  onSave: (role: DeadlineReminderRole) => void;
  pending: boolean;
  policy: DeadlineReminderPolicy;
}) {
  const draft = getDraft(policy, drafts);
  return (
    <article className="border border-[var(--border)] bg-[var(--surface-soft)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {policy.role === "AREA_RESPONSIBLE"
              ? "Responsable de área"
              : policy.role === "PROCESS_OWNER"
                ? "Dueño del proceso"
                : "Ejecutor"}
          </p>
          <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
            {ROLE_HELP[policy.role]}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <input
            checked={draft.enabled}
            className="h-4 w-4 accent-[var(--primary)]"
            disabled={!canEdit}
            onChange={(event) =>
              onChange(policy.role, "enabled", event.target.checked)
            }
            type="checkbox"
          />
          Enviar recordatorios
        </label>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium text-[var(--foreground)]">
          Frecuencia (meses)
          <input
            className="nibol-field mt-2"
            disabled={!canEdit}
            min={1}
            onChange={(event) =>
              onChange(policy.role, "cadenceMonths", Number(event.target.value))
            }
            type="number"
            value={draft.cadenceMonths}
          />
        </label>
        <label className="text-sm font-medium text-[var(--foreground)]">
          Día de corte
          <input
            className="nibol-field mt-2"
            disabled={!canEdit}
            max={28}
            min={1}
            onChange={(event) =>
              onChange(policy.role, "cutoffDay", Number(event.target.value))
            }
            type="number"
            value={draft.cutoffDay}
          />
        </label>
        <label className="text-sm font-medium text-[var(--foreground)]">
          Próximos a vencer (días)
          <input
            className="nibol-field mt-2"
            disabled={!canEdit}
            min={1}
            onChange={(event) =>
              onChange(
                policy.role,
                "upcomingWindowDays",
                Number(event.target.value),
              )
            }
            type="number"
            value={draft.upcomingWindowDays}
          />
        </label>
      </div>
      {canEdit ? (
        <button
          className="nibol-btn-secondary mt-5 px-3 py-2 text-xs"
          disabled={pending}
          onClick={() => onSave(policy.role)}
          type="button"
        >
          <Save className="h-4 w-4" />
          {pending ? "Guardando..." : "Guardar política"}
        </button>
      ) : null}
    </article>
  );
}

export function AutomaticNotificationAdmin({
  canExecute,
}: {
  canExecute: boolean;
}) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<
    Partial<Record<DeadlineReminderRole, PolicyDraft>>
  >({});
  const [previewRole, setPreviewRole] =
    useState<DeadlineReminderRole>("AREA_RESPONSIBLE");
  const [previewDate, setPreviewDate] = useState(getDateKey);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const automaticRulesQuery = useQuery({
    queryFn: notificationService.listAutomaticRules,
    queryKey: [...QUERY_KEYS.notifications, "automatic-rules"],
  });
  const notificationCatalogQuery = useQuery({
    queryFn: notificationService.listNotificationCatalog,
    queryKey: [...QUERY_KEYS.notifications, "notification-catalog"],
  });
  const configQuery = useQuery({
    queryFn: notificationService.getDeadlineReminderConfig,
    queryKey: [...QUERY_KEYS.notifications, "deadline-reminder-config"],
  });
  const executionsQuery = useQuery({
    queryFn: () =>
      notificationService.listDeadlineReminderExecutions({
        page: 1,
        perPage: 8,
      }),
    queryKey: [...QUERY_KEYS.notifications, "deadline-reminder-executions"],
  });
  const previewMutation = useMutation({
    mutationFn: notificationService.previewDeadlineReminders,
  });
  const updateMutation = useMutation({
    mutationFn: ({
      input,
      role,
    }: {
      input: PolicyDraft;
      role: DeadlineReminderRole;
    }) => notificationService.updateDeadlineReminderPolicy(role, input),
    onSuccess: async () => {
      setDrafts({});
      previewMutation.reset();
      await queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.notifications, "deadline-reminder-config"],
      });
    },
  });
  const automaticRuleMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      notificationService.updateAutomaticRule(key, value),
    onSuccess: async () => {
      previewMutation.reset();
      await queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.notifications, "automatic-rules"],
      });
      await queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.notifications, "notification-catalog"],
      });
    },
  });
  const emailPreviewQuery = useQuery({
    enabled: canExecute && showEmailPreview,
    queryFn: notificationService.previewDeadlineReminderEmail,
    queryKey: [...QUERY_KEYS.notifications, "automatic-email-preview"],
  });
  const runMutation = useMutation({
    mutationFn: notificationService.runDeadlineReminders,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEYS.notifications, "deadline-reminder-config"],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            ...QUERY_KEYS.notifications,
            "deadline-reminder-executions",
          ],
        }),
      ]);
    },
  });

  const config = configQuery.data;
  const automaticRules = automaticRulesQuery.data ?? [];
  const executions = executionsQuery.data?.data ?? [];
  const catalog = notificationCatalogQuery.data ?? [];
  const catalogCategories = [...new Set(catalog.map((item) => item.category))];
  const latest = executions[0];
  const error =
    automaticRulesQuery.error ||
    notificationCatalogQuery.error ||
    configQuery.error ||
    executionsQuery.error ||
    updateMutation.error ||
    automaticRuleMutation.error ||
    emailPreviewQuery.error ||
    previewMutation.error ||
    runMutation.error;
  const updateDraft = (
    role: DeadlineReminderRole,
    field: keyof PolicyDraft,
    value: boolean | number,
  ) => {
    const policy = config?.policies.find((item) => item.role === role);
    if (!policy) return;
    setDrafts((current) => ({
      ...current,
      [role]: { ...getDraft(policy, current), [field]: value },
    }));
  };
  const renderRuleToggle = (rule: {
    description: string;
    key: string;
    name: string;
  }) => {
    const configured = findAutomaticRule(automaticRules, rule.key);
    return (
      <AutomaticRuleToggle
        checked={
          configured?.active === false
            ? configured.defaultValue === "true"
            : (configured?.value ?? "true") === "true"
        }
        disabled={
          !canExecute ||
          automaticRulesQuery.isPending ||
          automaticRulesQuery.isError ||
          automaticRuleMutation.isPending
        }
        key={rule.key}
        onChange={(checked) =>
          automaticRuleMutation.mutate({
            key: rule.key,
            value: String(checked),
          })
        }
        rule={rule}
      />
    );
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="nibol-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="nibol-eyebrow">Próxima ejecución</span>
            <Clock3 className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <p className="mt-5 text-lg font-semibold text-[var(--foreground)]">
            {formatDate(
              config?.schedules.find((item) => item.nextExecution)
                ?.nextExecution,
            )}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Zona de negocio: {config?.timezone ?? "America/La_Paz"}
          </p>
        </div>
        <div className="nibol-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="nibol-eyebrow">Última ejecución</span>
            <ShieldAlert className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <p className="mt-5 text-lg font-semibold text-[var(--foreground)]">
            {formatDate(latest?.finishedAt)}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {latest
              ? (statusLabel[latest.status] ?? latest.status)
              : "Aún no ejecutado"}
          </p>
        </div>
        <div className="nibol-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="nibol-eyebrow">Planes incluidos</span>
            <Mail className="h-5 w-5 text-[var(--success)]" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-[var(--foreground)]">
            {latest?.processedCount ?? 0}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            En la última corrida registrada
          </p>
        </div>
      </section>

      {error ? (
        <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {getApiErrorMessage(error)}
        </p>
      ) : null}

      <section className="nibol-panel p-6">
        <div>
          <p className="nibol-eyebrow">Catálogo</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            Notificaciones del sistema
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Active o pause cada tipo de aviso. Los ejemplos muestran el título y
            mensaje que recibirá el usuario con datos ilustrativos.
          </p>
        </div>
        <div className="mt-6 space-y-6">
          {notificationCatalogQuery.isPending ? (
            <p className="text-sm text-[var(--muted)]">
              Cargando catálogo de notificaciones...
            </p>
          ) : null}
          {catalogCategories.map((category) => (
            <section className="min-w-0" key={category}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border)] pb-2">
                <h3 className="font-semibold text-[var(--foreground)]">
                  {category}
                </h3>
                <span className="text-xs text-[var(--muted)]">
                  {catalog.filter((item) => item.category === category).length} tipos
                </span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {catalog
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <article
                      className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_8rem]"
                      key={item.key}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h4 className="text-sm font-semibold text-[var(--foreground)]">
                            {item.name}
                          </h4>
                          <code className="text-[11px] text-[var(--muted)]">
                            {item.eventType === "*"
                              ? "Otros tipos de evento"
                              : (item.eventType ?? "Sin tipo de evento")}
                          </code>
                        </div>
                        <p className="mt-1 max-w-3xl text-sm leading-5 text-[var(--muted)]">
                          {item.description}
                        </p>
                        <div className="mt-3 border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                            Ejemplo
                          </p>
                          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                            {item.exampleTitle}
                          </p>
                          <p className="mt-1 whitespace-pre-line text-sm leading-5 text-[var(--muted)]">
                            {item.exampleMessage}
                          </p>
                        </div>
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          Canal: {item.channels}
                        </p>
                      </div>
                      <label className="flex items-center justify-between gap-2 text-sm font-medium text-[var(--foreground)] md:justify-end md:self-start">
                        <span>{item.enabled ? "Activa" : "Pausada"}</span>
                        <input
                          aria-label={"Activar o pausar " + item.name}
                          checked={item.enabled}
                          className="h-4 w-4 accent-[var(--primary)]"
                          disabled={
                            !canExecute ||
                            notificationCatalogQuery.isError ||
                            automaticRuleMutation.isPending
                          }
                          onChange={(event) =>
                            automaticRuleMutation.mutate({
                              key: item.key,
                              value: String(event.target.checked),
                            })
                          }
                          type="checkbox"
                        />
                      </label>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="nibol-panel p-6">
        <div>
          <p className="nibol-eyebrow">Recordatorios programados</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            Alertas y canales
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Elija qué tipos de planes incluir y cómo entregar los recordatorios.
            Las políticas por rol determinan quién los recibe y con qué
            frecuencia.
          </p>
        </div>
        <div className="mt-5 grid gap-6 xl:grid-cols-2">
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">
              Contenido de las alertas
            </h3>
            <div className="mt-3 grid gap-2">
              {ALERT_CATEGORY_RULES.map(renderRuleToggle)}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">
              Canales de entrega
            </h3>
            <div className="mt-3 grid gap-2">
              {DELIVERY_RULES.map(renderRuleToggle)}
            </div>
          </div>
        </div>
      </section>

      <section className="nibol-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="nibol-eyebrow">Configuración de recordatorios</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              Plazos por rol
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              El corte es calendario: se evalúan vencidos, vencimientos del día
              y la ventana próxima. No es un contador desde la creación o
              asignación del plan.
            </p>
          </div>
          <button
            className="nibol-btn-secondary p-2"
            onClick={() =>
              void Promise.all([
                configQuery.refetch(),
                executionsQuery.refetch(),
              ])
            }
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {ROLE_ORDER.map((role) => {
            const policy = config?.policies.find((item) => item.role === role);
            return policy ? (
              <PolicyCard
                canEdit={canExecute}
                drafts={drafts}
                key={role}
                onChange={updateDraft}
                onSave={(selectedRole) => {
                  const selectedPolicy = config?.policies.find(
                    (item) => item.role === selectedRole,
                  );
                  if (!selectedPolicy) return;
                  updateMutation.mutate({
                    input: getDraft(selectedPolicy, drafts),
                    role: selectedRole,
                  });
                }}
                pending={
                  updateMutation.isPending &&
                  updateMutation.variables?.role === role
                }
                policy={policy}
              />
            ) : null;
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="nibol-panel p-6">
          <div>
            <p className="nibol-eyebrow">QA y operación administrativa</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              Previsualizar o ejecutar
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Consulte los destinatarios y planes que incluiría el correo para
              el rol elegido. La previsualización no envía alertas; ejecutar
              ahora sí queda registrado como MANUAL.
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              La lista respeta los filtros de contenido activos; las políticas
              por rol y los canales determinan si se entrega el recordatorio.
            </p>
          </div>
          <div className="mt-6 grid gap-4">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Rol
              <select
                className="nibol-field mt-2"
                onChange={(event) => {
                  previewMutation.reset();
                  setPreviewRole(event.target.value as DeadlineReminderRole);
                }}
                value={previewRole}
              >
                {ROLE_ORDER.map((role) => (
                  <option key={role} value={role}>
                    {config?.roleLabels[role] ?? role}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-[var(--foreground)]">
              Fecha de corte para QA
              <input
                className="nibol-field mt-2"
                onChange={(event) => {
                  previewMutation.reset();
                  setPreviewDate(event.target.value);
                }}
                type="date"
                value={previewDate}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className="nibol-btn-secondary"
                disabled={previewMutation.isPending}
                onClick={() =>
                  void previewMutation.mutateAsync({
                    cutoffDateKey: previewDate,
                    role: previewRole,
                  })
                }
                type="button"
              >
                <Eye className="h-4 w-4" />
                {previewMutation.isPending
                  ? "Calculando..."
                  : "Ver qué se enviaría"}
              </button>
              <button
                className="nibol-btn-primary"
                disabled={!canExecute || runMutation.isPending}
                onClick={() =>
                  void runMutation.mutateAsync({
                    cutoffDateKey: previewDate,
                    role: previewRole,
                  })
                }
                type="button"
              >
                <Play className="h-4 w-4" />
                {runMutation.isPending ? "Ejecutando..." : "Ejecutar ahora"}
              </button>
            </div>
          </div>
          {previewMutation.data ? (
            <div className="mt-6 border-t border-[var(--border)] pt-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  ["Destinatarios", previewMutation.data.totals.recipients],
                  ["Vencidos", previewMutation.data.totals.overdue],
                  ["Vence hoy", previewMutation.data.totals.dueToday],
                  ["Próximos", previewMutation.data.totals.upcoming],
                  ["Planes", previewMutation.data.totals.plans],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <p className="text-xs text-[var(--muted)]">{label}</p>
                    <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-[var(--muted)]">
                {!previewMutation.data.policy.enabled
                  ? "Los recordatorios están desactivados para este rol."
                  : !previewMutation.data.channels.enabled
                    ? "Este tipo de notificación está pausado."
                    : !previewMutation.data.channels.notifyByEmail &&
                      !previewMutation.data.channels.notifyInApp
                    ? "No se entregará ningún aviso: todos los canales están desactivados."
                    : `Entrega activa: ${[
                        previewMutation.data.channels.notifyByEmail
                          ? "correo electrónico"
                          : null,
                        previewMutation.data.channels.notifyInApp
                          ? "dentro de NIBOL"
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" y ")}.`}
              </p>
              <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
                {previewMutation.data.recipients.length === 0 ? (
                  <p className="border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]">
                    No hay planes que coincidan con el rol, la fecha y los
                    filtros activos.
                  </p>
                ) : (
                  previewMutation.data.recipients.map((recipient) => (
                    <div
                      className="border border-[var(--border)] px-3 py-2 text-sm"
                      key={recipient.recipient.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-[var(--foreground)]">
                          {recipient.recipient.name}
                        </span>
                        <span className="text-[var(--muted)]">
                          {recipient.plans.length} planes ·{" "}
                          {recipient.recipient.email}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1 border-t border-[var(--border)] pt-2 text-xs text-[var(--muted)]">
                        {recipient.plans.map((plan) => (
                          <li key={plan.actionPlanId}>
                            {REMINDER_BUCKET_LABELS[plan.bucket]} ·{" "}
                            {plan.observation} · {plan.plan} ·{" "}
                            {plan.effectiveDueDate}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Ejemplo de correo
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              Muestra con datos ficticios; el correo no se envía.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="nibol-btn-secondary px-3 py-2 text-xs"
                onClick={() => setShowEmailPreview(true)}
                type="button"
              >
                Ver ejemplo del correo
              </button>
              {showEmailPreview ? (
                <button
                  className="nibol-btn-secondary px-3 py-2 text-xs"
                  onClick={() => setShowEmailPreview(false)}
                  type="button"
                >
                  Cerrar ejemplo
                </button>
              ) : null}
            </div>
            {showEmailPreview ? (
              <div className="mt-4 border border-[var(--border)] bg-white p-3">
                <p className="mb-3 text-sm font-medium text-[var(--foreground)]">
                  {emailPreviewQuery.data?.subject ??
                    "Recordatorio de vencimientos"}
                </p>
                {emailPreviewQuery.isPending ? (
                  <p className="py-8 text-center text-sm text-[var(--muted)]">
                    Preparando ejemplo...
                  </p>
                ) : emailPreviewQuery.data ? (
                  <iframe
                    className="h-[34rem] w-full border border-[var(--border)]"
                    referrerPolicy="no-referrer"
                    sandbox=""
                    srcDoc={emailPreviewQuery.data.html}
                    title="Vista previa del correo automático"
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="nibol-panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="nibol-eyebrow">Trazabilidad</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                Historial calendarizado
              </h2>
            </div>
            <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
          </div>
          <div className="mt-6 space-y-3">
            {executions.length === 0 ? (
              <p className="border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                El historial aparecerá después de la primera corrida.
              </p>
            ) : (
              executions.map((execution) => (
                <article
                  className="border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                  key={execution.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {execution.runType === "MANUAL"
                          ? "Manual"
                          : "Programada"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Corte: {formatExecutionDate(execution.scheduledFor)} ·
                        Inicio: {formatDate(execution.startedAt)}
                      </p>
                    </div>
                    <span className="nibol-badge nibol-badge-success">
                      {statusLabel[execution.status] ?? execution.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-[var(--muted)]">
                    <span>
                      Planes
                      <strong className="block text-sm text-[var(--foreground)]">
                        {execution.processedCount}
                      </strong>
                    </span>
                    <span>
                      Alertas
                      <strong className="block text-sm text-[var(--foreground)]">
                        {execution.notificationsCreated}
                      </strong>
                    </span>
                    <span>
                      Fallos
                      <strong className="block text-sm text-[var(--foreground)]">
                        {execution.failuresCount}
                      </strong>
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export function DeadlineReminderSettings({
  canManage,
}: {
  canManage: boolean;
}) {
  return <AutomaticNotificationAdmin canExecute={canManage} />;
}
