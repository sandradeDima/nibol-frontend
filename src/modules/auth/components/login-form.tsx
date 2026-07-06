"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { QUERY_KEYS } from "@/lib/constants";
import {
  AuthBanner,
  AuthInput,
  AuthLinkRow,
  AuthShell,
  authPrimaryButtonClass,
} from "@/modules/auth/components/auth-shell";
import { type LoginValues, loginSchema } from "@/modules/auth/forms";
import { authService } from "@/services/auth-service";

export function LoginForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const invitedEmail = searchParams.get("email");

  const form = useForm<LoginValues>({
    defaultValues: {
      email: invitedEmail ?? "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!invitedEmail) {
      return;
    }

    form.setValue("email", invitedEmail, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form, invitedEmail]);

  const statusMessage =
    searchParams.get("verified") === "1"
      ? "Su correo fue verificado correctamente. Ya puede iniciar sesion."
      : searchParams.get("registered") === "1"
        ? "Cuenta creada. Revise su bandeja para verificar el acceso."
        : searchParams.get("invited") === "1"
          ? "Invitacion aceptada. Inicie sesion con la contrasena que acaba de crear."
        : searchParams.get("reset") === "1"
          ? "Contrasena actualizada. Ingrese con su nueva credencial."
          : null;

  const verificationError =
    searchParams.get("error") === "TOKEN_EXPIRED"
      ? "Su enlace de verificacion vencio. Puede solicitar uno nuevo abajo."
      : searchParams.get("error") === "INVALID_TOKEN"
        ? "El enlace de verificacion no es valido. Puede solicitar uno nuevo abajo."
        : null;

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.authSession,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.authorization,
      });
      router.push("/");
    },
  });

  const resendMutation = useMutation({
    mutationFn: authService.resendVerificationEmail,
    onSuccess: () => {
      setResendError(null);
      setResendMessage("Enviamos un nuevo correo de verificacion.");
    },
    onError: (error) => {
      setResendMessage(null);
      setResendError(error.message);
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setResendError(null);
    setResendMessage(null);
    await loginMutation.mutateAsync(values);
  });

  const handleResend = async () => {
    const email = form.getValues("email");

    if (!email) {
      form.setError("email", {
        message: "Ingrese su correo para saber a donde reenviar la verificacion.",
      });
      return;
    }

    await resendMutation.mutateAsync(email);
  };

  return (
    <AuthShell
      description="Ingrese con su correo y contrasena. La verificacion y la sesion se administran automaticamente."
      footer={<AuthLinkRow href="/register" label="Necesita una cuenta?" linkLabel="Solicitar acceso" />}
      title="Iniciar sesion"
    >
      {statusMessage ? <AuthBanner tone="success">{statusMessage}</AuthBanner> : null}
      {verificationError ? <AuthBanner tone="info">{verificationError}</AuthBanner> : null}
      {loginMutation.error ? (
        <AuthBanner tone="error">{loginMutation.error.message}</AuthBanner>
      ) : null}
      {resendMessage ? <AuthBanner tone="success">{resendMessage}</AuthBanner> : null}
      {resendError ? <AuthBanner tone="error">{resendError}</AuthBanner> : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          autoComplete="email"
          error={form.formState.errors.email?.message}
          label="Email"
          placeholder="usuario@nibol.com.bo"
          type="email"
          {...form.register("email")}
        />
        <AuthInput
          autoComplete="current-password"
          error={form.formState.errors.password?.message}
          label="Contrasena"
          placeholder="Ingrese su contrasena"
          type="password"
          revealable
          {...form.register("password")}
        />

        <div className="flex items-center justify-between gap-4 text-sm">
          <button
            className="font-semibold text-[var(--foreground-soft)] transition hover:text-[var(--foreground)]"
            onClick={handleResend}
            type="button"
          >
            Reenviar verificacion
          </button>
          <Link className="font-semibold text-[var(--foreground-soft)] transition hover:text-[var(--foreground)]" href="/forgot-password">
            Olvido su contrasena?
          </Link>
        </div>

        <button className={authPrimaryButtonClass} disabled={loginMutation.isPending} type="submit">
          {loginMutation.isPending ? "Ingresando..." : "Iniciar sesion"}
        </button>
      </form>
    </AuthShell>
  );
}
