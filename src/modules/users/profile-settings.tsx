"use client";

import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, KeyRound, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import {
  profilePasswordSchema,
  profileUpdateSchema,
  type ProfilePasswordValues,
  type ProfileUpdateValues,
} from "@/modules/users/forms";
import { userService } from "@/services/user-service";
import { getApiErrorMessage } from "@/utils";

const panelClassName = "nibol-panel p-6";

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Nunca";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function ProfileSettings() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryFn: userService.getProfile,
    queryKey: QUERY_KEYS.profile,
  });

  const profileForm = useForm<ProfileUpdateValues>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(profileUpdateSchema),
  });

  const passwordForm = useForm<ProfilePasswordValues>({
    defaultValues: {
      confirmPassword: "",
      currentPassword: "",
      newPassword: "",
    },
    resolver: zodResolver(profilePasswordSchema),
  });

  const refreshShell = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile,
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.authSession,
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.authorization,
      }),
    ]);

    router.refresh();
  };

  const updateProfileMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: async (profile) => {
      profileForm.reset({
        name: profile.name,
      });
      setProfileError(null);
      setProfileMessage("Perfil actualizado correctamente.");
      await refreshShell();
    },
    onError: (error) => {
      setProfileMessage(null);
      setProfileError(getApiErrorMessage(error));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: userService.changePassword,
    onSuccess: () => {
      passwordForm.reset();
      setPasswordError(null);
      setPasswordMessage("Contrasena actualizada correctamente.");
    },
    onError: (error) => {
      setPasswordMessage(null);
      setPasswordError(getApiErrorMessage(error));
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: userService.uploadAvatar,
    onSuccess: async () => {
      setProfileError(null);
      setProfileMessage("Avatar actualizado correctamente.");
      await refreshShell();
    },
    onError: (error) => {
      setProfileMessage(null);
      setProfileError(getApiErrorMessage(error));
    },
  });

  useEffect(() => {
    if (!profileQuery.data || profileForm.formState.isDirty) {
      return;
    }

    profileForm.reset({
      name: profileQuery.data.name,
    });
  }, [profileForm, profileForm.formState.isDirty, profileQuery.data]);

  if (profileQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void profileQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={profileQuery.error.message}
        title="No fue posible cargar su perfil"
      />
    );
  }

  const profile = profileQuery.data;

  if (!profile) {
    return (
      <section className={panelClassName}>
        <p className="text-sm text-stone-600">Cargando perfil...</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`${panelClassName} grid gap-6 xl:grid-cols-[0.75fr_1.25fr]`}>
        <div className="space-y-4">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] bg-stone-950 text-2xl font-semibold text-white">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={profile.name}
                className="h-full w-full object-cover"
                src={profile.avatar}
              />
            ) : (
              profile.name
                .split(" ")
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join("")
            )}
          </div>

          <label className="nibol-btn-secondary cursor-pointer px-4 py-2.5 text-sm">
            <Camera className="h-4 w-4" />
            {uploadAvatarMutation.isPending ? "Cargando..." : "Subir avatar"}
            <input
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={uploadAvatarMutation.isPending}
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (!file) {
                  return;
                }

                uploadAvatarMutation.mutate(file);
                event.target.value = "";
              }}
              type="file"
            />
          </label>

          <div className="rounded-[1.4rem] border border-stone-200/90 bg-white/80 px-4 py-4 text-sm text-stone-600">
            Use un avatar `PNG`, `JPEG` o `WebP` de hasta 5 MB.
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Perfil
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              {profile.name}
            </h2>
            <p className="mt-2 text-sm leading-7 text-stone-700">
              Administre la informacion visible en el shell compartido, la sesion activa y futuros modulos.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-stone-200/90 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Email
              </p>
              <p className="mt-2 text-sm font-medium text-stone-900">{profile.email}</p>
            </div>
            <div className="rounded-[1.4rem] border border-stone-200/90 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Ultimo acceso
              </p>
              <p className="mt-2 text-sm font-medium text-stone-900">
                {formatDate(profile.lastLoginAt)}
              </p>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-stone-200/90 bg-white/80 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Roles
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${panelClassName} grid gap-6 xl:grid-cols-2`}>
        <form
          className="space-y-4"
          onSubmit={profileForm.handleSubmit(async (values) => {
            await updateProfileMutation.mutateAsync(values);
          })}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Actualizar perfil
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-stone-950">
              Datos personales
            </h3>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Nombre</span>
            <input
              className="nibol-field h-auto py-3"
              disabled={updateProfileMutation.isPending}
              {...profileForm.register("name")}
            />
            {profileForm.formState.errors.name ? (
              <span className="text-sm text-rose-700">
                {profileForm.formState.errors.name.message}
              </span>
            ) : null}
          </label>

          {profileError ? (
            <div className="rounded-[1.5rem] border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {profileError}
            </div>
          ) : null}

          {profileMessage ? (
            <div className="rounded-[1.5rem] border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {profileMessage}
            </div>
          ) : null}

          <button
            className="nibol-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={updateProfileMutation.isPending}
            type="submit"
          >
            <Save className="h-4 w-4" />
            {updateProfileMutation.isPending ? "Guardando perfil..." : "Guardar perfil"}
          </button>
        </form>

        <form
          className="space-y-4"
          onSubmit={passwordForm.handleSubmit(async (values) => {
            await changePasswordMutation.mutateAsync({
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
            });
          })}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Cambiar contrasena
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-stone-950">
              Credenciales
            </h3>
          </div>

          {[
            {
              field: "currentPassword",
              label: "Contrasena actual",
            },
            {
              field: "newPassword",
              label: "Nueva contrasena",
            },
            {
              field: "confirmPassword",
              label: "Confirmar contrasena",
            },
          ].map((field) => (
            <label key={field.field} className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">{field.label}</span>
              <input
                className="nibol-field h-auto py-3"
                disabled={changePasswordMutation.isPending}
                type="password"
                {...passwordForm.register(
                  field.field as "currentPassword" | "newPassword" | "confirmPassword",
                )}
              />
              {passwordForm.formState.errors[
                field.field as "currentPassword" | "newPassword" | "confirmPassword"
              ] ? (
                <span className="text-sm text-rose-700">
                  {
                    passwordForm.formState.errors[
                      field.field as "currentPassword" | "newPassword" | "confirmPassword"
                    ]?.message
                  }
                </span>
              ) : null}
            </label>
          ))}

          {passwordError ? (
            <div className="rounded-[1.5rem] border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {passwordError}
            </div>
          ) : null}

          {passwordMessage ? (
            <div className="rounded-[1.5rem] border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {passwordMessage}
            </div>
          ) : null}

          <button
            className="nibol-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={changePasswordMutation.isPending}
            type="submit"
          >
            <KeyRound className="h-4 w-4" />
            {changePasswordMutation.isPending ? "Actualizando contrasena..." : "Cambiar contrasena"}
          </button>
        </form>
      </section>
    </div>
  );
}
