"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { BellRing, Send } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { QUERY_KEYS } from "@/lib/constants";
import {
  notificationComposerSchema,
  notificationTypeOptions,
  type NotificationComposerValues,
} from "@/modules/notifications/forms";
import { notificationService } from "@/services/notification-service";
import { userService } from "@/services/user-service";
import { getApiErrorMessage } from "@/utils";

const panelClassName = "nibol-panel p-6";

export function NotificationComposer() {
  const queryClient = useQueryClient();
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const recipientsQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: QUERY_KEYS.userOptions,
    staleTime: 60_000,
  });

  const form = useForm<NotificationComposerValues>({
    defaultValues: {
      message: "",
      title: "",
      type: "info",
      userIds: [],
    },
    resolver: zodResolver(notificationComposerSchema),
  });

  const createMutation = useMutation({
    mutationFn: notificationService.createNotifications,
    onSuccess: async ({ createdCount, emailCount, suppressed }) => {
      form.reset({
        message: "",
        title: "",
        type: "info",
        userIds: [],
      });
      setSubmitError(null);
      const deliveries = [
        createdCount > 0 && `${createdCount} notificaciones en la plataforma`,
        emailCount > 0 && `correo programado para ${emailCount} destinatarios`,
      ].filter(Boolean);
      setSubmitMessage(
        suppressed
          ? "Las notificaciones manuales están desactivadas en la configuración."
          : deliveries.length > 0
            ? `Notificación guardada: ${deliveries.join(" y ")}.`
            : "No se pudo enviar la notificación a ningún destinatario.",
      );
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications,
      });
    },
    onError: (error) => {
      setSubmitMessage(null);
      setSubmitError(getApiErrorMessage(error));
    },
  });

  if (recipientsQuery.isError) {
    return (
      <ErrorState
        description="El formulario necesita la lista de destinatarios antes de poder enviar una notificacion."
        title="No fue posible cargar los destinatarios"
      />
    );
  }

  const recipients = recipientsQuery.data ?? [];

  return (
    <section className={panelClassName}>
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-[1.3rem] border border-stone-200/80 bg-white/85 text-stone-700 shadow-[0_12px_30px_rgba(80,58,29,0.08)]">
          <BellRing className="h-5 w-5" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-stone-950">
            Enviar notificacion
          </h2>
          <p className="text-sm leading-7 text-stone-700">
            Envíe una notificación a los destinatarios seleccionados por los
            canales activos: plataforma y/o correo.
          </p>
        </div>
      </div>

      <form
        className="mt-6 space-y-5"
        onSubmit={form.handleSubmit(async (values) => {
          await createMutation.mutateAsync(values);
        })}
      >
        <div className="grid gap-5">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-800">
              Destinatarios
            </span>
            <Controller
              control={form.control}
              name="userIds"
              render={({ field }) => (
                <SearchableSelect
                  disabled={
                    createMutation.isPending || recipientsQuery.isLoading
                  }
                  multiple
                  onChange={field.onChange}
                  options={recipients.map((user) => ({
                    description: user.email,
                    id: user.id,
                    label: user.name,
                    search: user.email,
                  }))}
                  placeholder="Buscar por nombre o correo"
                  value={field.value}
                />
              )}
            />
            {form.formState.errors.userIds ? (
              <p className="text-sm text-rose-600">
                {form.formState.errors.userIds.message}
              </p>
            ) : null}
          </label>

          <div className="grid gap-5">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-800">
                Título
              </span>
              <input
                className="nibol-field h-12 px-4 text-base"
                placeholder="Cambio de rol"
                {...form.register("title")}
                disabled={createMutation.isPending}
                type="text"
              />
              {form.formState.errors.title ? (
                <p className="text-sm text-rose-600">
                  {form.formState.errors.title.message}
                </p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-800">Tipo</span>
              <select
                className="nibol-field"
                {...form.register("type")}
                disabled={createMutation.isPending}
              >
                {notificationTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.type ? (
                <p className="text-sm text-rose-600">
                  {form.formState.errors.type.message}
                </p>
              ) : null}
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-800">
              Mensaje
            </span>
            <textarea
              className="nibol-field h-auto min-h-36 py-3"
              placeholder="Describa lo ocurrido y el siguiente paso esperado para el usuario."
              {...form.register("message")}
              disabled={createMutation.isPending}
            />
            {form.formState.errors.message ? (
              <p className="text-sm text-rose-600">
                {form.formState.errors.message.message}
              </p>
            ) : null}
          </label>
        </div>

        {submitMessage ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {submitMessage}
          </p>
        ) : null}

        {submitError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {submitError}
          </p>
        ) : null}

        <button
          className="nibol-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={createMutation.isPending || recipients.length === 0}
          type="submit"
        >
          <Send className="h-4 w-4" />
          {createMutation.isPending ? "Enviando..." : "Enviar notificacion"}
        </button>
      </form>
    </section>
  );
}
