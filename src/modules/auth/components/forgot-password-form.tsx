"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  AuthBanner,
  AuthInput,
  AuthLinkRow,
  AuthShell,
  authPrimaryButtonClass,
} from "@/modules/auth/components/auth-shell";
import {
  type ForgotPasswordValues,
  forgotPasswordSchema,
} from "@/modules/auth/forms";
import { authService } from "@/services/auth-service";

export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: (_, variables) => {
      setSubmittedEmail(variables.email);
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await forgotPasswordMutation.mutateAsync(values);
  });

  return (
    <AuthShell
      description="Enviaremos un enlace seguro si la direccion existe dentro del sistema."
      footer={<AuthLinkRow href="/login" label="Recordo su contrasena?" linkLabel="Volver al acceso" />}
      title="Recuperar acceso"
    >
      {submittedEmail ? (
        <AuthBanner tone="success">
          Si {submittedEmail} existe en el sistema, enviamos un enlace de recuperacion.
        </AuthBanner>
      ) : null}
      {forgotPasswordMutation.error ? (
        <AuthBanner tone="error">{forgotPasswordMutation.error.message}</AuthBanner>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          autoComplete="email"
          error={form.formState.errors.email?.message}
          label="Email"
          placeholder="usuario@nibol.com.bo"
          type="email"
          {...form.register("email")}
        />

        <button
          className={authPrimaryButtonClass}
          disabled={forgotPasswordMutation.isPending}
          type="submit"
        >
          {forgotPasswordMutation.isPending ? "Enviando..." : "Enviar enlace"}
        </button>
      </form>
    </AuthShell>
  );
}
