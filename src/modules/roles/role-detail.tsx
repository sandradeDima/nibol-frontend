"use client";

import { useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, ShieldCheck, Trash2, Users } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { usePermissions } from "@/hooks/use-permissions";
import { QUERY_KEYS } from "@/lib/constants";
import { CRITICAL_ADMIN_PERMISSIONS } from "@/lib/permission-catalog";
import { PermissionMatrix } from "@/modules/roles/permission-matrix";
import { roleService } from "@/services/role-service";
import { getApiErrorMessage } from "@/utils";

type RoleDetailProps = {
  roleId: string;
};

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function RoleDetail({ roleId }: RoleDetailProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const roleQuery = useQuery({
    queryFn: () => roleService.getRoleById(roleId),
    queryKey: QUERY_KEYS.roleDetails(roleId),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => roleService.deleteRole(roleId),
    onSuccess: async () => {
      setActionError(null);
      setIsDeleteDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.roles,
      });
      window.location.assign("/roles");
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error));
    },
  });

  if (roleQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="nibol-btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              void roleQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={roleQuery.error.message}
        title="No fue posible cargar este rol"
      />
    );
  }

  const role = roleQuery.data;
  const canEdit = permissions.includes("roles.edit");
  const canDelete = permissions.includes("roles.delete");

  if (!role) {
    return (
      <section className="nibol-panel p-6 text-sm text-stone-600">
        Cargando detalle del rol...
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="nibol-panel p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-[1.5rem] bg-stone-950 p-4 text-white">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                  Ficha de rol
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                  {role.name}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5">
                  <Users className="h-4 w-4" />
                  {role.usersCount} usuario{role.usersCount === 1 ? "" : "s"} asignado{role.usersCount === 1 ? "" : "s"}
                </span>
                {role.isAdmin ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                    Rol Administrador protegido
                  </span>
                ) : null}
              </div>
              <p className="max-w-3xl text-sm leading-7 text-stone-700">
                {role.description || "Sin descripcion registrada para este rol."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="nibol-btn-secondary px-4 py-2.5 text-sm"
              href="/roles"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a roles
            </Link>
            {canEdit ? (
              <Link
                className="nibol-btn-primary px-4 py-2.5 text-sm"
                href={`/roles/${role.id}/edit`}
              >
                <Pencil className="h-4 w-4" />
                Editar rol
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="nibol-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            Permisos
          </p>
          <div className="mt-5">
            <PermissionMatrix
              helperText={
                role.isAdmin
                  ? "Los permisos criticos del rol Administrador permanecen bloqueados para conservar el acceso total del sistema."
                  : undefined
              }
              lockedPermissionNames={role.isAdmin ? CRITICAL_ADMIN_PERMISSIONS : []}
              permissionNames={role.permissions}
              readOnly
            />
          </div>
        </section>

        <section className="nibol-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            Metadatos del registro
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="rounded-[1.3rem] border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Usuarios asignados
              </dt>
              <dd className="mt-2 font-medium text-stone-900">{role.usersCount}</dd>
            </div>
            <div className="rounded-[1.3rem] border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Creado
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatDate(role.createdAt)}
              </dd>
            </div>
            <div className="rounded-[1.3rem] border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Actualizado
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatDate(role.updatedAt)}
              </dd>
            </div>
          </dl>

          {canDelete ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="nibol-btn-primary px-4 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={role.isAdmin}
                onClick={() => {
                  setIsDeleteDialogOpen(true);
                }}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
                {role.isAdmin ? "El rol Administrador esta protegido" : "Eliminar rol"}
              </button>
            </div>
          ) : null}

          {actionError ? (
            <div className="mt-4 rounded-[1.5rem] border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
        </section>
      </section>

      <ConfirmDialog
        confirmLabel="Eliminar rol"
        description={`Eliminar ${role.name} y retirar sus accesos asignados de los registros activos?`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate();
        }}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
        }}
        open={isDeleteDialogOpen}
        title="Eliminar este rol?"
        tone="danger"
      />
    </div>
  );
}
