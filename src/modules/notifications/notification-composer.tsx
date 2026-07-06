"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { BellRing, Send } from "lucide-react";
import { useForm } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
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
      userId: "",
    },
    resolver: zodResolver(notificationComposerSchema),
  });

  const createMutation = useMutation({
    mutationFn: notificationService.createNotification,
    onSuccess: async () => {
      form.reset({
        message: "",
        title: "",
        type: "info",
        userId: "",
      });
      setSubmitError(null);
      setSubmitMessage("Notificacion enviada.");
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
            Envie una alerta interna reutilizable desde el mismo flujo que luego podra extenderse a correo, SMS o WhatsApp.
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
            <span className="text-sm font-semibold text-stone-800">Destinatario</span>
            <select
              className="nibol-field"
              {...form.register("userId")}
              disabled={createMutation.isPending || recipientsQuery.isLoading}
            >
              <option value="">Seleccione un usuario</option>
              {recipients.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {form.formState.errors.userId ? (
              <p className="text-sm text-rose-600">{form.formState.errors.userId.message}</p>
            ) : null}
          </label>

          <div className="grid gap-5 md:grid-cols-[1fr_12rem]">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-800">Titulo</span>
              <input
                className="nibol-field"
                placeholder="Cambio de rol"
                {...form.register("title")}
                disabled={createMutation.isPending}
                type="text"
              />
              {form.formState.errors.title ? (
                <p className="text-sm text-rose-600">{form.formState.errors.title.message}</p>
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
                <p className="text-sm text-rose-600">{form.formState.errors.type.message}</p>
              ) : null}
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-800">Mensaje</span>
            <textarea
              className="nibol-field min-h-36 h-auto py-3"
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
