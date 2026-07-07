import { generatedSidebarItems } from "@/modules/generated-module-registry";
import type { SidebarItem } from "@/types";

type SidebarConfigItem = Omit<SidebarItem, "icon"> & {
  icon: string;
};

const CORE_SIDEBAR_ITEMS: SidebarConfigItem[] = [
  { group: "Principal", icon: "LayoutDashboard", label: "Dashboard", route: "/" },
  {
    group: "Gestion",
    icon: "MailPlus",
    label: "Invitaciones",
    permission: "invitations.view",
    route: "/invitations",
  },
  {
    group: "Gestion",
    icon: "Bell",
    label: "Notificaciones",
    permission: "notifications.view",
    route: "/notifications",
  },
  {
    group: "Control",
    icon: "BadgeAlert",
    label: "Observaciones",
    permission: "observations.view",
    route: "/observaciones",
  },
  {
    group: "Control",
    icon: "ClipboardPenLine",
    label: "Planes de remediacion",
    permission: "observations.view",
    route: "/planes-remediacion",
  },
  {
    group: "Control",
    icon: "FolderKanban",
    label: "Avances y evidencias",
    permission: "observations.view",
    route: "/avances-evidencias",
  },
  {
    group: "Control",
    icon: "BadgeCheck",
    label: "Aprobaciones pendientes",
    permission: "observations.view",
    route: "/aprobaciones/pendientes",
  },
  {
    group: "Control",
    icon: "CalendarRange",
    label: "Cronograma",
    permission: "observations.view",
    route: "/cronograma",
  },
  {
    group: "Control",
    icon: "CalendarPlus2",
    label: "Ampliaciones de plazo",
    permission: "extension_requests.view",
    route: "/ampliaciones-plazo",
  },
  {
    group: "Control",
    icon: "ClipboardList",
    label: "Registro de actividad",
    permission: "activity_logs.view",
    route: "/activity-logs",
  },
  {
    group: "Control",
    icon: "FileSearch",
    label: "Auditoria",
    permission: "audit_logs.view",
    route: "/audit-logs",
  },
  {
    group: "Administracion",
    icon: "Users",
    label: "Usuarios",
    permission: "users.view",
    route: "/users",
  },
  {
    group: "Administracion",
    icon: "ShieldCheck",
    label: "Roles y permisos",
    permission: "roles.view",
    route: "/roles",
  },
  {
    group: "Administracion",
    icon: "Building2",
    label: "Gerencias",
    permission: "areas.view",
    route: "/administracion/gerencias",
  },
  {
    group: "Administracion",
    icon: "ShieldAlert",
    label: "Niveles de riesgo",
    permission: "risk_levels.view",
    route: "/administracion/niveles-riesgo",
  },
  {
    group: "Administracion",
    icon: "Workflow",
    label: "Estados",
    permission: "observation_statuses.view",
    route: "/administracion/estados",
  },
  {
    group: "Administracion",
    icon: "SlidersHorizontal",
    label: "Parametros",
    permission: "system_parameters.view",
    route: "/administracion/parametros",
  },
  {
    group: "Administracion",
    icon: "LibraryBig",
    label: "Catalogos",
    permission: "catalogs.view",
    route: "/administracion/catalogos",
  },
  {
    group: "Administracion",
    icon: "Settings",
    label: "Ajustes base",
    permission: "settings.view",
    route: "/settings",
  },
];

export const SIDEBAR_ITEMS: SidebarConfigItem[] = [
  ...CORE_SIDEBAR_ITEMS,
  ...generatedSidebarItems
    .filter((item) => item.route !== "/products")
    .map((item) => ({
      ...item,
      group: "Administracion",
    })),
];

const routeLabelMap = new Map(
  SIDEBAR_ITEMS.map((item) => [item.route, item.label] as const),
);

routeLabelMap.set("/forbidden", "Acceso denegado");

const titleCaseSegment = (segment: string): string => {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export type BreadcrumbItem = {
  href: string;
  label: string;
};

export const getRouteLabel = (route: string): string => {
  return routeLabelMap.get(route) ?? titleCaseSegment(route.replace(/^\//, ""));
};

export const buildBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  if (pathname === "/") {
    return [
      {
        href: "/",
        label: "Dashboard",
      },
    ];
  }

  const segments = pathname.split("/").filter(Boolean);

  return [
    {
      href: "/",
      label: "Dashboard",
    },
    ...segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;

      return {
        href,
        label: getRouteLabel(href),
      };
    }),
  ];
};
