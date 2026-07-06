"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MailCheck, ShieldX } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { usePermissions } from "@/hooks/use-permissions";
import { invitationService } from "@/services/invitation-service";
import type { InvitationStatus, InvitationTableRow } from "@/types";

const formatDate = (value: string | null): string => {
  if (!value) {
    return "No aceptada";
  }

  return format(new Date(value), "MMM d, yyyy");
};

const statusLabels: Record<InvitationStatus, string> = {
  Accepted: "Aceptada",
  Expired: "Vencida",
  Pending: "Pendiente",
  Revoked: "Revocada",
};

const statusClassNames: Record<InvitationStatus, string> = {
  Accepted: "nibol-badge nibol-badge-success",
  Expired: "nibol-badge nibol-badge-accent",
  Pending: "nibol-badge nibol-badge-info",
  Revoked: "nibol-badge",
};

const invitationColumns: ColumnDef<InvitationTableRow>[] = [
  {
    accessorKey: "email",
    cell: ({ row }) => (
      <div className="min-w-[14rem] space-y-1">
        <p className="font-semibold text-stone-950">{row.original.email}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          Creada {formatDate(row.original.createdAt)}
        </p>
      </div>
    ),
    header: "Email",
  },
  {
    accessorKey: "role.name",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-stone-900">{row.original.role.name}</p>
        <p className="text-sm text-stone-500">
          {row.original.role.description || "Sin descripcion para este rol."}
        </p>
      </div>
    ),
    enableSorting: false,
    header: "Rol",
  },
  {
    accessorKey: "createdBy.name",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-stone-900">{row.original.createdBy.name}</p>
        <p className="text-sm text-stone-500">
          Invitada el {formatDate(row.original.createdAt)}
        </p>
      </div>
    ),
    enableSorting: false,
    header: "Creada por",
  },
  {
    accessorKey: "status",
    cell: ({ row }) => (
      <span className={statusClassNames[row.original.status]}>
        {statusLabels[row.original.status]}
      </span>
    ),
    enableSorting: false,
    header: "Estado",
  },
  {
    accessorKey: "expiresAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatDate(row.original.expiresAt)}
      </span>
    ),
    header: "Vence",
  },
  {
    accessorKey: "acceptedAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatDate(row.original.acceptedAt)}
      </span>
    ),
    header: "Aceptada",
  },
];

export function InvitationTable() {
  const { permissions } = usePermissions();
  const canResend = permissions.includes("invitations.edit");
  const canRevoke = permissions.includes("invitations.delete");

  const invitationTableConfig: DataTableConfig<InvitationTableRow> = {
    columns: invitationColumns,
    csv: {
      columns: [
        {
          header: "Email",
          key: "email",
          value: (row) => row.email,
        },
        {
          header: "Rol",
          key: "role",
          value: (row) => row.role.name,
        },
        {
          header: "Creada por",
          key: "createdBy",
          value: (row) => row.createdBy.name,
        },
        {
          header: "Estado",
          key: "status",
          value: (row) => statusLabels[row.status],
        },
        {
          header: "Vence",
          key: "expiresAt",
          value: (row) => row.expiresAt,
        },
        {
          header: "Aceptada",
          key: "acceptedAt",
          value: (row) => row.acceptedAt ?? "",
        },
      ],
      fileName: "invitaciones.csv",
    },
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "Pruebe ampliar la busqueda, limpiar el estado o crear una nueva invitacion.",
      title: "No hay invitaciones para esta vista",
    },
    enableSelection: false,
    filters: [
      {
        id: "status",
        label: "Estado",
        options: [
          {
            label: "Pendiente",
            value: "pending",
          },
          {
            label: "Aceptada",
            value: "accepted",
          },
          {
            label: "Vencida",
            value: "expired",
          },
          {
            label: "Revocada",
            value: "revoked",
          },
        ],
        placeholder: "Todos los estados",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: ["invitations", "table"],
    rowActions: [
      {
        confirmation: {
          confirmLabel: "Reenviar invitacion",
          description: (rows) =>
            `Enviar un nuevo enlace a ${rows[0]?.email ?? "este invitado"} y rotar el token actual de inmediato.`,
          title: "Reenviar invitacion?",
        },
        disabled: (row) => row.status === "Accepted" || row.status === "Revoked",
        hidden: !canResend,
        icon: MailCheck,
        id: "resend",
        invalidateAfterSuccess: true,
        label: "Reenviar",
        onClick: async (row) => {
          await invitationService.resendInvitation(row.id);
        },
        variant: "custom",
      },
      {
        confirmation: {
          confirmLabel: "Revocar invitacion",
          description: (rows) =>
            `Revocar la invitacion de ${rows[0]?.email ?? "este invitado"} para inutilizar el enlace actual.`,
          title: "Revocar invitacion?",
          tone: "danger",
        },
        disabled: (row) => row.status === "Accepted" || row.status === "Revoked",
        hidden: !canRevoke,
        icon: ShieldX,
        id: "revoke",
        invalidateAfterSuccess: true,
        label: "Revocar",
        onClick: async (row) => {
          await invitationService.revokeInvitation(row.id);
        },
        tone: "danger",
        variant: "delete",
      },
    ],
    searchPlaceholder: "Buscar por correo, rol o remitente",
  };

  return <DataTable config={invitationTableConfig} endpoint="/invitations" />;
}
