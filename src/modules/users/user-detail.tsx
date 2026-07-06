"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Pencil, Power, ShieldCheck, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { userService } from "@/services/user-service";
import { getApiErrorMessage } from "@/utils";

import { useState } from "react";

type UserDetailProps = {
  userId: string;
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Nunca";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function UserDetail({ userId }: UserDetailProps) {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<"delete" | "disable" | "enable" | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const userQuery = useQuery({
    queryFn: () => userService.getUserById(userId),
    queryKey: QUERY_KEYS.userDetails(userId),
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      if (userQuery.data?.isActive) {
        return userService.disableUser(userId);
      }

      return userService.enableUser(userId);
    },
    onSuccess: async () => {
      setActionError(null);
      setPendingAction(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.userDetails(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.users,
        }),
      ]);
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => userService.deleteUser(userId),
    onSuccess: async () => {
      setActionError(null);
      setPendingAction(null);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.users,
      });
      window.location.assign("/users");
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error));
    },
  });

  if (userQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void userQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={userQuery.error.message}
        title="No fue posible cargar este usuario"
      />
    );
  }

  const user = userQuery.data;

  if (!user) {
    return (
      <section className="nibol-panel p-6 text-sm text-stone-600">
        Cargando detalle del usuario...
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="nibol-panel p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-18 w-18 items-center justify-center overflow-hidden rounded-[1.5rem] bg-stone-950 text-lg font-semibold text-white">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={user.name}
                  className="h-full w-full object-cover"
                  src={user.avatar}
                />
              ) : (
                user.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part.charAt(0).toUpperCase())
                  .join("")
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                  Ficha de usuario
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                  {user.name}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    user.isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {user.isActive ? "Activo" : "Inactivo"}
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    user.emailVerified
                      ? "bg-amber-100 text-amber-800"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {user.emailVerified ? "Correo verificado" : "Correo sin verificar"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="nibol-btn-secondary px-4 py-2.5 text-sm"
              href="/users"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a usuarios
            </Link>
            <Link
              className="nibol-btn-primary px-4 py-2.5 text-sm"
              href={`/users/${user.id}/edit`}
            >
              <Pencil className="h-4 w-4" />
              Editar usuario
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="nibol-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            Accesos asignados
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {user.roles.map((role) => (
              <div
                key={role.id}
                className="rounded-[1.4rem] border border-stone-200/90 bg-white/80 px-4 py-4"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-[1rem] bg-stone-950 p-2 text-amber-200">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-stone-950">{role.name}</p>
                    <p className="text-xs leading-5 text-stone-500">
                      {role.description || "Sin descripcion registrada."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="nibol-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            Metadatos del registro
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="rounded-[1.3rem] border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Ultimo acceso
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatDate(user.lastLoginAt)}
              </dd>
            </div>
            <div className="rounded-[1.3rem] border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Creado
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatDate(user.createdAt)}
              </dd>
            </div>
            <div className="rounded-[1.3rem] border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Actualizado
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatDate(user.updatedAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="nibol-btn-secondary px-4 py-2.5 text-sm"
              onClick={() => {
                setPendingAction(user.isActive ? "disable" : "enable");
              }}
              type="button"
            >
              <Power className="h-4 w-4" />
              {user.isActive ? "Deshabilitar usuario" : "Habilitar usuario"}
            </button>
            <button
              className="nibol-btn-primary px-4 py-2.5 text-sm text-white"
              onClick={() => {
                setPendingAction("delete");
              }}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar usuario
            </button>
          </div>

          {actionError ? (
            <div className="mt-4 rounded-[1.5rem] border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
        </section>
      </section>

      <ConfirmDialog
        confirmLabel={
          pendingAction === "delete"
            ? "Eliminar usuario"
            : pendingAction === "disable"
              ? "Deshabilitar usuario"
              : "Habilitar usuario"
        }
        description={
          pendingAction === "delete"
            ? `Se retirara ${user.name} de los registros activos. La trazabilidad permanecera intacta.`
            : pendingAction === "disable"
              ? `${user.name} perdera el acceso operativo hasta ser rehabilitado.`
              : `${user.name} recuperara el acceso operativo de inmediato.`
        }
        isLoading={deleteMutation.isPending || deactivateMutation.isPending}
        onConfirm={() => {
          if (pendingAction === "delete") {
            deleteMutation.mutate();
            return;
          }

          deactivateMutation.mutate();
        }}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
        open={Boolean(pendingAction)}
        title={
          pendingAction === "delete"
            ? "Eliminar este usuario?"
            : pendingAction === "disable"
              ? "Deshabilitar este usuario?"
              : "Habilitar este usuario?"
        }
        tone={pendingAction === "delete" ? "danger" : "default"}
      />
    </div>
  );
}
