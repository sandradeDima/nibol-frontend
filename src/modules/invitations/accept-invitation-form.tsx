"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { QUERY_KEYS } from "@/lib/constants";
import {
  AuthBanner,
  AuthInput,
  AuthLinkRow,
  AuthShell,
} from "@/modules/auth/components/auth-shell";
import {
  invitationAcceptSchema,
  type InvitationAcceptValues,
} from "@/modules/invitations/forms";
import { invitationService } from "@/services/invitation-service";

const buttonClass =
  "nibol-btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60";

const summaryCardClassName = "nibol-panel-muted px-4 py-3";

export function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const previewQuery = useQuery({
    enabled: Boolean(token),
    queryFn: () => invitationService.previewInvitation(token as string),
    queryKey: token
      ? QUERY_KEYS.invitationPreview(token)
      : ["invitations", "preview", "missing-token"],
    retry: false,
  });

  const form = useForm<InvitationAcceptValues>({
    defaultValues: {
      confirmPassword: "",
      name: "",
      password: "",
    },
    resolver: zodResolver(invitationAcceptSchema),
  });

  const acceptMutation = useMutation({
    mutationFn: async (values: InvitationAcceptValues) => {
      if (!token) {
        throw new Error("Se requiere una invitacion valida para continuar.");
      }

      return invitationService.acceptInvitation({
        name: values.name,
        password: values.password,
        token,
      });
    },
    onSuccess: (acceptedInvitation) => {
      const nextSearchParams = new URLSearchParams({
        email: acceptedInvitation.email,
        invited: "1",
      });

      router.push(`/login?${nextSearchParams.toString()}`);
    },
  });

  const invalidMessage = token
    ? null
    : "Necesita una invitacion valida para terminar de activar su cuenta.";

  const handleSubmit = form.handleSubmit(async (values) => {
    await acceptMutation.mutateAsync(values);
  });

  return (
    <AuthShell
      description="Confirme sus datos, defina su contrasena y active la cuenta corporativa asociada a este correo."
      footer={<AuthLinkRow href="/login" label="Ya tiene acceso?" linkLabel="Iniciar sesion" />}
      title="Activar invitacion"
    >
      {invalidMessage ? <AuthBanner tone="info">{invalidMessage}</AuthBanner> : null}
      {previewQuery.error ? (
        <AuthBanner tone="error">{previewQuery.error.message}</AuthBanner>
      ) : null}
      {acceptMutation.error ? (
        <AuthBanner tone="error">{acceptMutation.error.message}</AuthBanner>
      ) : null}

      {previewQuery.data ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={summaryCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Email
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {previewQuery.data.email}
            </p>
          </div>
          <div className={summaryCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Rol
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {previewQuery.data.roleName}
            </p>
          </div>
          <div className={summaryCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Invitado por
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {previewQuery.data.invitedByName}
            </p>
          </div>
          <div className={summaryCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Vence
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {new Date(previewQuery.data.expiresAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          autoComplete="name"
          error={form.formState.errors.name?.message}
          label="Nombre completo"
          placeholder="Su nombre"
          type="text"
          {...form.register("name")}
        />
        <AuthInput
          autoComplete="new-password"
          error={form.formState.errors.password?.message}
          label="Contrasena"
          placeholder="Cree una contrasena"
          type="password"
          {...form.register("password")}
        />
        <AuthInput
          autoComplete="new-password"
          error={form.formState.errors.confirmPassword?.message}
          label="Confirmar contrasena"
          placeholder="Repita la contrasena"
          type="password"
          {...form.register("confirmPassword")}
        />

        <button
          className={buttonClass}
          disabled={!previewQuery.data || acceptMutation.isPending || previewQuery.isLoading}
          type="submit"
        >
          {acceptMutation.isPending ? "Activando cuenta..." : "Activar cuenta"}
        </button>
      </form>

      {previewQuery.isLoading ? (
        <div className="nibol-panel-muted px-4 py-3 text-sm text-[var(--foreground-soft)]">
          Validando su invitacion...
        </div>
      ) : null}

      {(invalidMessage || previewQuery.error) ? (
        <div className="nibol-panel-muted px-4 py-3 text-sm text-[var(--foreground-soft)]">
          Necesita ayuda? Vuelva a{" "}
          <Link className="font-semibold text-[var(--primary)]" href="/login">
            la pantalla de acceso
          </Link>
          .
        </div>
      ) : null}
    </AuthShell>
  );
}
