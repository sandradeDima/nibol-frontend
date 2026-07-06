"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import {
  AuthBanner,
  AuthInput,
  AuthLinkRow,
  AuthShell,
  authPrimaryButtonClass,
} from "@/modules/auth/components/auth-shell";
import { type ResetPasswordValues, resetPasswordSchema } from "@/modules/auth/forms";
import { authService } from "@/services/auth-service";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const invalidMessage =
    searchParams.get("error") === "INVALID_TOKEN"
      ? "El enlace de recuperacion es invalido o ya vencio. Solicite uno nuevo."
      : token
        ? null
        : "Se requiere un token valido para definir una nueva contrasena.";

  const form = useForm<ResetPasswordValues>({
    defaultValues: {
      confirmPassword: "",
      newPassword: "",
    },
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetMutation = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      router.push("/login?reset=1");
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!token) {
      return;
    }

    await resetMutation.mutateAsync({
      newPassword: values.newPassword,
      token,
    });
  });

  return (
    <AuthShell
      description="Defina una nueva contrasena una vez que el token de recuperacion sea validado."
      footer={<AuthLinkRow href="/login" label="Volver a su cuenta?" linkLabel="Iniciar sesion" />}
      title="Nueva contrasena"
    >
      {invalidMessage ? <AuthBanner tone="info">{invalidMessage}</AuthBanner> : null}
      {resetMutation.error ? (
        <AuthBanner tone="error">{resetMutation.error.message}</AuthBanner>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          autoComplete="new-password"
          error={form.formState.errors.newPassword?.message}
          label="Nueva contrasena"
          placeholder="Defina una nueva contrasena"
          type="password"
          {...form.register("newPassword")}
        />
        <AuthInput
          autoComplete="new-password"
          error={form.formState.errors.confirmPassword?.message}
          label="Confirmar contrasena"
          placeholder="Repita la nueva contrasena"
          type="password"
          {...form.register("confirmPassword")}
        />

        <button className={authPrimaryButtonClass} disabled={!token || resetMutation.isPending} type="submit">
          {resetMutation.isPending ? "Actualizando..." : "Guardar contrasena"}
        </button>
      </form>

      {invalidMessage ? (
        <div className="border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
          Necesita un nuevo enlace?{" "}
          <Link className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)]" href="/forgot-password">
            Solicitar otro correo
          </Link>
          .
        </div>
      ) : null}
    </AuthShell>
  );
}
