"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailPlus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import {
  invitationCreateSchema,
  type InvitationCreateValues,
} from "@/modules/invitations/forms";
import { invitationService } from "@/services/invitation-service";
import { userService } from "@/services/user-service";
import { getApiErrorMessage } from "@/utils";

const sectionClassName =
  "nibol-panel p-6";

const inputClassName = "nibol-field h-auto py-3";

export function InvitationForm() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const rolesQuery = useQuery({
    queryFn: userService.getRoleOptions,
    queryKey: QUERY_KEYS.roleOptions,
    staleTime: 60_000,
  });

  const form = useForm<InvitationCreateValues>({
    defaultValues: {
      email: "",
      roleId: "",
    },
    resolver: zodResolver(invitationCreateSchema),
  });

  const createMutation = useMutation({
    mutationFn: invitationService.createInvitation,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.invitations,
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.roleOptions,
        }),
      ]);

      router.push("/invitations");
      router.refresh();
    },
  });

  if (rolesQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void rolesQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={rolesQuery.error.message}
        title="No fue posible cargar los roles"
      />
    );
  }

  const isBusy = createMutation.isPending || rolesQuery.isLoading;

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await createMutation.mutateAsync(values);
      })}
    >
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Nueva invitacion
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              Invitar colaborador
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              Las invitaciones vencen automaticamente en siete dias, generan un token nuevo y envian el correo de acceso de inmediato.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="nibol-btn-secondary px-4 py-3 text-sm"
              href="/invitations"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a invitaciones
            </Link>
            <button
              className="nibol-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              type="submit"
            >
              {createMutation.isPending ? (
                <Send className="h-4 w-4" />
              ) : (
                <MailPlus className="h-4 w-4" />
              )}
              {createMutation.isPending ? "Enviando invitacion..." : "Enviar invitacion"}
            </button>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700" htmlFor="email">
                Correo del invitado
              </label>
              <input
                className={inputClassName}
                id="email"
                placeholder="colaborador@empresa.com"
                type="email"
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-rose-700">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700" htmlFor="roleId">
                Rol asignado
              </label>
              <select
                className={inputClassName}
                id="roleId"
                {...form.register("roleId")}
              >
                <option value="">Seleccione un rol</option>
                {(rolesQuery.data ?? []).map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.roleId ? (
                <p className="text-sm text-rose-700">
                  {form.formState.errors.roleId.message}
                </p>
              ) : null}
            </div>

            {createMutation.error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-900">
                {getApiErrorMessage(createMutation.error)}
              </div>
            ) : null}
          </div>

          <aside className="rounded-[1.6rem] border border-stone-200/90 bg-white/75 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Flujo
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
              <p>1. Seleccione el correo y el rol inicial.</p>
              <p>2. El sistema genera un token seguro con vencimiento de siete dias.</p>
              <p>3. El invitado recibe el correo y completa su activacion desde el enlace.</p>
            </div>
          </aside>
        </div>
      </section>
    </form>
  );
}
