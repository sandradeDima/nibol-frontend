"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, ShieldPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { CRITICAL_ADMIN_PERMISSIONS } from "@/lib/permission-catalog";
import {
  roleFormSchema,
  type RoleFormValues,
} from "@/modules/roles/forms";
import { PermissionMatrix } from "@/modules/roles/permission-matrix";
import { roleService } from "@/services/role-service";
import type { RoleDetails } from "@/types";
import { getApiErrorMessage } from "@/utils";

type RoleFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      roleId: string;
    };

const sectionClassName =
  "nibol-panel p-6";

export function RoleForm(props: RoleFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const editingRoleId = props.mode === "edit" ? props.roleId : null;

  const roleQuery = useQuery({
    enabled: Boolean(editingRoleId),
    queryFn: () => roleService.getRoleById(editingRoleId as string),
    queryKey: editingRoleId ? QUERY_KEYS.roleDetails(editingRoleId) : ["roles", "draft"],
  });

  const form = useForm<RoleFormValues>({
    defaultValues: {
      description: "",
      name: "",
      permissionNames: [],
    },
    resolver: zodResolver(roleFormSchema) as Resolver<RoleFormValues>,
  });

  const watchedPermissionNames = useWatch({
    control: form.control,
    name: "permissionNames",
  });

  useEffect(() => {
    if (props.mode !== "edit" || !roleQuery.data) {
      return;
    }

    form.reset({
      description: roleQuery.data.description ?? "",
      name: roleQuery.data.name,
      permissionNames: roleQuery.data.permissions,
    });
  }, [form, props.mode, roleQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: RoleFormValues) => {
      const payload = {
        description: values.description.trim() || null,
        name: values.name.trim(),
        permissionNames: values.permissionNames,
      };

      if (props.mode === "create") {
        return roleService.createRole(payload);
      }

      return roleService.updateRole(props.roleId, payload);
    },
    onSuccess: async (role: RoleDetails) => {
      setSubmitError(null);
      setSubmitMessage(
        props.mode === "create"
          ? "Rol creado correctamente."
          : "Rol actualizado correctamente.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.roles,
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.authorization,
        }),
      ]);

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.roleDetails(role.id),
      });

      router.push(`/roles/${role.id}`);
      router.refresh();
    },
    onError: (error) => {
      setSubmitMessage(null);
      setSubmitError(getApiErrorMessage(error));
    },
  });

  if (props.mode === "edit" && roleQuery.isError) {
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
        title="No fue posible cargar el rol"
      />
    );
  }

  const currentRole = roleQuery.data;
  const isAdminRole = currentRole?.isAdmin ?? false;
  const isBusy = saveMutation.isPending || roleQuery.isLoading;

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await saveMutation.mutateAsync(values);
      })}
    >
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              {props.mode === "create" ? "Nuevo rol" : "Editar rol"}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {props.mode === "create"
                ? "Registrar perfil de acceso"
                : `Actualizar ${currentRole?.name ?? "rol"}`}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              Defina perfiles reutilizables y mantenga la asignacion de permisos clara en todo el espacio administrativo.
            </p>
          </div>

          <Link
            className="nibol-btn-secondary px-4 py-2.5 text-sm"
            href={props.mode === "create" ? "/roles" : `/roles/${props.roleId}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </section>

      <section className={`${sectionClassName} grid gap-6 xl:grid-cols-[0.85fr_1.15fr]`}>
        <div className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Nombre</span>
            <input
              className="nibol-field h-auto py-3 disabled:opacity-70"
              disabled={isBusy || isAdminRole}
              placeholder="Ingrese el nombre del rol"
              {...form.register("name")}
            />
            {isAdminRole ? (
              <span className="text-xs text-stone-500">
                El nombre del rol Administrador esta protegido para conservar siempre un perfil con acceso total.
              </span>
            ) : null}
            {form.formState.errors.name ? (
              <span className="text-sm text-rose-700">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Descripcion</span>
            <textarea
              className="nibol-field min-h-36 h-auto py-3"
              disabled={isBusy}
              placeholder="Describa el alcance o uso esperado de este rol"
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <span className="text-sm text-rose-700">
                {form.formState.errors.description.message}
              </span>
            ) : null}
          </label>
        </div>

        <PermissionMatrix
          disabled={isBusy}
          error={form.formState.errors.permissionNames?.message}
          helperText={
            isAdminRole
              ? "Los permisos criticos del rol Administrador se mantienen bloqueados para no perder el acceso total de la plataforma."
              : undefined
          }
          lockedPermissionNames={isAdminRole ? CRITICAL_ADMIN_PERMISSIONS : []}
          onChange={(permissionNames) => {
            form.setValue("permissionNames", permissionNames, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          permissionNames={watchedPermissionNames ?? []}
        />
      </section>

      {submitError ? (
        <div className="rounded-[1.5rem] border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      {submitMessage ? (
        <div className="rounded-[1.5rem] border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {submitMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          className="nibol-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          type="submit"
        >
          {props.mode === "create" ? (
            <ShieldPlus className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isBusy
            ? props.mode === "create"
              ? "Creando rol..."
              : "Guardando cambios..."
            : props.mode === "create"
              ? "Crear rol"
              : "Guardar cambios"}
        </button>
        <Link
          className="nibol-btn-secondary px-4 py-3 text-sm"
          href={props.mode === "create" ? "/roles" : `/roles/${props.roleId}`}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
