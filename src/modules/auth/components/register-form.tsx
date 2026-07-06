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
import { type RegisterValues, registerSchema } from "@/modules/auth/forms";
import { authService } from "@/services/auth-service";

export function RegisterForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (_, variables) => {
      setSubmittedEmail(variables.email);
      form.reset({
        email: variables.email,
        name: variables.name,
        password: "",
      });
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await registerMutation.mutateAsync(values);
  });

  return (
    <AuthShell
      description="Cree una cuenta de acceso con correo y contrasena. Se enviara una verificacion antes de habilitar el ingreso."
      footer={<AuthLinkRow href="/login" label="Ya tiene una cuenta?" linkLabel="Iniciar sesion" />}
      title="Registrar acceso"
    >
      {submittedEmail ? (
        <AuthBanner tone="success">
          Verificacion enviada a {submittedEmail}. Abra el correo para activar su cuenta.
        </AuthBanner>
      ) : null}
      {registerMutation.error ? (
        <AuthBanner tone="error">{registerMutation.error.message}</AuthBanner>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          autoComplete="name"
          error={form.formState.errors.name?.message}
          label="Nombre completo"
          placeholder="Administrador del sistema"
          type="text"
          {...form.register("name")}
        />
        <AuthInput
          autoComplete="email"
          error={form.formState.errors.email?.message}
          label="Email"
          placeholder="usuario@nibol.com.bo"
          type="email"
          {...form.register("email")}
        />
        <AuthInput
          autoComplete="new-password"
          error={form.formState.errors.password?.message}
          label="Contrasena"
          placeholder="Defina una contrasena segura"
          type="password"
          {...form.register("password")}
        />

        <button className={authPrimaryButtonClass} disabled={registerMutation.isPending} type="submit">
          {registerMutation.isPending ? "Creando cuenta..." : "Registrar"}
        </button>
      </form>
    </AuthShell>
  );
}
