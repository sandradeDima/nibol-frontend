"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUp, Mail, Palette, Save, Settings2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { QUERY_KEYS } from "@/lib/constants";
import {
  settingsFormSchema,
  timezoneOptions,
  type SettingsFormValues,
} from "@/modules/settings/forms";
import { settingsService } from "@/services/settings-service";
import type { AppSettings } from "@/types";
import { DATE_FORMAT_OPTIONS } from "@/types";
import { getApiErrorMessage } from "@/utils";

const panelClassName = "nibol-panel p-6";

const sectionIconClassName =
  "flex h-11 w-11 items-center justify-center rounded-[1.3rem] border border-stone-200/80 bg-white/85 text-stone-700 shadow-[0_12px_30px_rgba(80,58,29,0.08)]";

const formatUpdatedAt = (value: string | null): string => {
  if (!value) {
    return "Usando valores por defecto";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getLogoFallback = (appName: string): string => {
  return appName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

function SettingsSummary({
  canEdit,
  settings,
}: {
  canEdit: boolean;
  settings: AppSettings;
}) {
  return (
    <section className={`${panelClassName} grid gap-6 xl:grid-cols-[1.1fr_0.9fr]`}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.75rem] border border-stone-200/90 bg-white text-lg font-semibold text-stone-900 shadow-[0_12px_30px_rgba(80,58,29,0.08)]"
            style={{
              borderColor: `${settings.primaryColor}33`,
            }}
          >
            {settings.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${settings.appName} logo`}
                className="h-full w-full object-contain p-3"
                src={settings.logo}
              />
            ) : (
              getLogoFallback(settings.appName)
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Configuracion general
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {settings.appName}
            </h2>
            <p className="text-sm leading-7 text-stone-700">
              Marca, remitente y localizacion se administran desde una misma capa reutilizable para este proyecto y los siguientes.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.4rem] border border-stone-200/90 bg-white/80 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Soporte
            </p>
            <p className="mt-2 text-sm font-medium text-stone-900">
              {settings.supportEmail}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-stone-200/90 bg-white/80 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Zona horaria
            </p>
            <p className="mt-2 text-sm font-medium text-stone-900">{settings.timezone}</p>
          </div>
          <div className="rounded-[1.4rem] border border-stone-200/90 bg-white/80 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Actualizado
            </p>
            <p className="mt-2 text-sm font-medium text-stone-900">
              {formatUpdatedAt(settings.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="nibol-panel-dark relative overflow-hidden px-6 py-6 text-stone-50">
        <div
          className="absolute inset-x-[-15%] top-[-30%] h-40 rounded-full blur-3xl"
          style={{
            background: `${settings.primaryColor}55`,
          }}
        />
        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone-100">
            <Palette className="h-3.5 w-3.5" />
            Vista de marca
          </div>

          <div className="space-y-3">
            <div
              className="h-3 w-28 rounded-full"
              style={{
                backgroundColor: settings.primaryColor,
              }}
            />
            <div className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-4">
              <p className="text-sm font-semibold text-white">{settings.senderName}</p>
              <p className="mt-1 text-sm text-stone-300">{settings.senderEmail}</p>
            </div>
            <p className="text-sm leading-7 text-stone-300">
              {canEdit
                ? "Guarde para actualizar la identidad activa de la aplicacion, el remitente y los valores de localizacion."
                : "Puede revisar la configuracion activa, pero solo los administradores pueden publicar cambios."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SettingsSection({
  children,
  description,
  icon,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className={panelClassName}>
      <div className="flex items-start gap-4">
        <div className={sectionIconClassName}>{icon}</div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-stone-950">{title}</h2>
          <p className="text-sm leading-7 text-stone-700">{description}</p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

export function SettingsPageContent({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryFn: settingsService.getSettings,
    queryKey: QUERY_KEYS.settings,
    staleTime: 60_000,
  });

  const form = useForm<SettingsFormValues>({
    defaultValues: {
      appName: "",
      dateFormat: "YYYY-MM-DD",
      primaryColor: "#1f2937",
      senderEmail: "",
      senderName: "",
      supportEmail: "",
      timezone: "UTC",
    },
    resolver: zodResolver(settingsFormSchema),
  });

  const updateMutation = useMutation({
    mutationFn: settingsService.updateSettings,
    onSuccess: async (settings) => {
      form.reset({
        appName: settings.appName,
        dateFormat: settings.dateFormat,
        primaryColor: settings.primaryColor,
        senderEmail: settings.senderEmail,
        senderName: settings.senderName,
        supportEmail: settings.supportEmail,
        timezone: settings.timezone,
      });
      setSubmitError(null);
      setSubmitMessage("Ajustes actualizados correctamente.");
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.settings,
      });
    },
    onError: (error) => {
      setSubmitMessage(null);
      setSubmitError(getApiErrorMessage(error));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: settingsService.uploadLogo,
    onSuccess: async () => {
      setUploadError(null);
      setUploadMessage("Logotipo cargado correctamente.");
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.settings,
      });
    },
    onError: (error) => {
      setUploadMessage(null);
      setUploadError(getApiErrorMessage(error));
    },
  });

  useEffect(() => {
    if (!settingsQuery.data || form.formState.isDirty) {
      return;
    }

    form.reset({
      appName: settingsQuery.data.appName,
      dateFormat: settingsQuery.data.dateFormat,
      primaryColor: settingsQuery.data.primaryColor,
      senderEmail: settingsQuery.data.senderEmail,
      senderName: settingsQuery.data.senderName,
      supportEmail: settingsQuery.data.supportEmail,
      timezone: settingsQuery.data.timezone,
    });
  }, [form, form.formState.isDirty, settingsQuery.data]);

  const watchedPrimaryColor = useWatch({
    control: form.control,
    name: "primaryColor",
  });
  const watchedAppName = useWatch({
    control: form.control,
    name: "appName",
  });

  if (settingsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void settingsQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={settingsQuery.error.message}
        title="No fue posible cargar la configuracion"
      />
    );
  }

  const settings = settingsQuery.data;
  const currentPrimaryColor = watchedPrimaryColor || settings?.primaryColor || "#1f2937";
  const isBusy =
    settingsQuery.isLoading || updateMutation.isPending || uploadMutation.isPending;

  if (!settings) {
    return (
      <section className={panelClassName}>
        <p className="text-sm text-stone-600">Cargando configuracion...</p>
      </section>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await updateMutation.mutateAsync(values);
      })}
    >
      <PageHeader
        description="Administre valores base reutilizables para marca, soporte, remitente y localizacion de la plataforma."
        eyebrow="Configuracion"
        title="Ajustes"
      />

      <SettingsSummary canEdit={canEdit} settings={settings} />

      {!canEdit ? (
        <div className="rounded-[1.5rem] border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Puede consultar estos ajustes, pero solo los administradores pueden realizar cambios.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsSection
          description="Defina el nombre de la aplicacion y el correo de soporte que se reutilizara en modulos y canales futuros."
          icon={<Settings2 className="h-5 w-5" />}
          title="General"
        >
          <div className="grid gap-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Nombre de la aplicacion</span>
              <input
                className="nibol-field h-auto py-3 disabled:opacity-70"
                disabled={!canEdit || isBusy}
                placeholder="Ingrese el nombre de la aplicacion"
                {...form.register("appName")}
              />
              {form.formState.errors.appName ? (
                <span className="text-sm text-rose-700">
                  {form.formState.errors.appName.message}
                </span>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Correo de soporte</span>
              <input
                className="nibol-field h-auto py-3 disabled:opacity-70"
                disabled={!canEdit || isBusy}
                placeholder="support@example.com"
                type="email"
                {...form.register("supportEmail")}
              />
              {form.formState.errors.supportEmail ? (
                <span className="text-sm text-rose-700">
                  {form.formState.errors.supportEmail.message}
                </span>
              ) : null}
            </label>
          </div>
        </SettingsSection>

        <SettingsSection
          description="Cargue el logotipo activo y defina el color principal utilizado en previsualizaciones e integraciones futuras."
          icon={<Palette className="h-5 w-5" />}
          title="Marca"
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <div
                className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.6rem] border border-stone-200/90 bg-white text-lg font-semibold text-stone-900 shadow-[0_12px_30px_rgba(80,58,29,0.08)]"
                style={{
                  borderColor: `${currentPrimaryColor}33`,
                }}
              >
                {settings.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`${settings.appName} logo`}
                    className="h-full w-full object-contain p-3"
                    src={settings.logo}
                  />
                ) : (
                  getLogoFallback(watchedAppName || settings.appName)
                )}
              </div>

              <div className="space-y-3">
                <label className="nibol-btn-secondary cursor-pointer px-4 py-2.5 text-sm">
                  <ImageUp className="h-4 w-4" />
                  {uploadMutation.isPending ? "Cargando..." : "Subir logotipo"}
                  <input
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    disabled={!canEdit || uploadMutation.isPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (!file) {
                        return;
                      }

                      uploadMutation.mutate(file);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
                <p className="text-xs leading-6 text-stone-500">
                  Use archivos `PNG`, `JPEG`, `WebP` o `SVG` de hasta 5 MB.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Muestra</span>
                <input
                  className="h-14 w-full cursor-pointer rounded-2xl border border-stone-200 bg-white p-2 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={!canEdit || isBusy}
                  type="color"
                  {...form.register("primaryColor")}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Color primario</span>
                <input
                  className="nibol-field h-auto py-3 disabled:opacity-70"
                  disabled={!canEdit || isBusy}
                  placeholder="#1f2937"
                  {...form.register("primaryColor")}
                />
                {form.formState.errors.primaryColor ? (
                  <span className="text-sm text-rose-700">
                    {form.formState.errors.primaryColor.message}
                  </span>
                ) : null}
              </label>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          description="Defina la identidad remitente que utilizara la infraestructura compartida de correo y futuras notificaciones."
          icon={<Mail className="h-5 w-5" />}
          title="Correo"
        >
          <div className="grid gap-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Nombre del remitente</span>
              <input
                className="nibol-field h-auto py-3 disabled:opacity-70"
                disabled={!canEdit || isBusy}
                placeholder="Base Project"
                {...form.register("senderName")}
              />
              {form.formState.errors.senderName ? (
                <span className="text-sm text-rose-700">
                  {form.formState.errors.senderName.message}
                </span>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Correo del remitente</span>
              <input
                className="nibol-field h-auto py-3 disabled:opacity-70"
                disabled={!canEdit || isBusy}
                placeholder="no-reply@example.com"
                type="email"
                {...form.register("senderEmail")}
              />
              {form.formState.errors.senderEmail ? (
                <span className="text-sm text-rose-700">
                  {form.formState.errors.senderEmail.message}
                </span>
              ) : null}
            </label>
          </div>
        </SettingsSection>

        <SettingsSection
          description="Controle la zona horaria y el formato de fecha que se reutilizaran a medida que crezcan los modulos."
          icon={<Settings2 className="h-5 w-5" />}
          title="Localizacion"
        >
          <div className="grid gap-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Zona horaria</span>
              <input
                className="nibol-field h-auto py-3 disabled:opacity-70"
                disabled={!canEdit || isBusy}
                list="settings-timezones"
                placeholder="Seleccione una zona horaria"
                {...form.register("timezone")}
              />
              <datalist id="settings-timezones">
                {timezoneOptions.map((timezone) => (
                  <option key={timezone} value={timezone} />
                ))}
              </datalist>
              {form.formState.errors.timezone ? (
                <span className="text-sm text-rose-700">
                  {form.formState.errors.timezone.message}
                </span>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Formato de fecha</span>
              <select
                className="nibol-field h-auto py-3 disabled:opacity-70"
                disabled={!canEdit || isBusy}
                {...form.register("dateFormat")}
              >
                {DATE_FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.dateFormat ? (
                <span className="text-sm text-rose-700">
                  {form.formState.errors.dateFormat.message}
                </span>
              ) : null}
            </label>
          </div>
        </SettingsSection>
      </div>

      {submitError ? (
        <div className="rounded-[1.5rem] border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      {uploadError ? (
        <div className="rounded-[1.5rem] border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {uploadError}
        </div>
      ) : null}

      {submitMessage ? (
        <div className="rounded-[1.5rem] border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {submitMessage}
        </div>
      ) : null}

      {uploadMessage ? (
        <div className="rounded-[1.5rem] border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {uploadMessage}
        </div>
      ) : null}

      {canEdit ? (
        <div className="flex flex-wrap gap-3">
          <button
            className="nibol-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBusy}
            type="submit"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Guardando ajustes..." : "Guardar ajustes"}
          </button>
        </div>
      ) : null}
    </form>
  );
}
