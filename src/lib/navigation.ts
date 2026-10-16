import { generatedSidebarItems } from "@/modules/generated-module-registry";
import type { AuthorizationSummary, SidebarItem } from "@/types";
import { hasAnyPermission, hasPermission } from "./permissions";

type SidebarConfigItem = Omit<SidebarItem, "icon"> & {
  icon: string;
};

const CORE_SIDEBAR_ITEMS: SidebarConfigItem[] = [
  {
    group: "Principal",
    icon: "LayoutDashboard",
    label: "Inicio",
    route: "/dashboard",
  },
  {
    group: "Principal",
    icon: "ChartNoAxesCombined",
    label: "Tablero - Avance de planes",
    permission: "reports.view",
    route: "/dashboard/reporteria",
  },
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
    group: "Gestion",
    icon: "Activity",
    label: "Actividad",
    permissions: ["activity.view", "activity_logs.view", "observations.view"],
    route: "/actividad",
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
    icon: "ChartNoAxesCombined",
    label: "Reportes",
    permission: "reports.view",
    route: "/reportes",
  },
  {
    group: "Control",
    icon: "FileSearch",
    label: "Reportes de auditoría",
    permission: "audit_reports.view",
    route: "/reportes/auditoria",
  },
  {
    group: "Control",
    icon: "ClipboardPenLine",
    label: "Planes de acción",
    permission: "action_plans.view",
    route: "/planes-accion",
  },
  {
    group: "Control",
    icon: "FolderKanban",
    label: "Avances y evidencias",
    permissions: [
      "observations.view",
      "action_plans.view",
      "progress_evaluations.view",
    ],
    route: "/avances-evidencias",
  },
  {
    group: "Control",
    icon: "BadgeCheck",
    label: "Aprobaciones pendientes",
    permissions: [
      "action_plans.evaluate",
      "deadline_extensions.approve",
      "deadline_extensions.reject",
    ],
    route: "/aprobaciones/pendientes",
  },
  {
    group: "Control",
    icon: "GitBranchCheck",
    label: "Tareas de flujos",
    permissions: [
      "workflow_tasks.view",
      "workflow_tasks.approve",
      "workflow_tasks.complete",
      "workflow_tasks.reject",
      "workflow_tasks.observe",
      "workflow_tasks.request_correction",
      "workflow_tasks.reassign",
    ],
    route: "/aprobaciones/flujos",
  },
  {
    group: "Control",
    icon: "Send",
    label: "Solicitud especial",
    permission: "workflow_instances.start",
    route: "/solicitudes-especiales/nueva",
  },
  {
    group: "Control",
    icon: "CalendarPlus2",
    label: "Ampliaciones de plazo",
    permission: "deadline_extensions.view",
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
    icon: "FileText",
    label: "Informes de Auditoría",
    permission: "audit_reports.view",
    route: "/administracion/informes-auditoria",
  },
  {
    group: "Administracion",
    icon: "ListTree",
    label: "Diccionario de observaciones",
    permission: "observation_dictionary.view",
    route: "/administracion/diccionario-observaciones",
  },
  {
    group: "Administracion",
    icon: "ShieldAlert",
    label: "Riesgos asociados",
    permission: "risks.view",
    route: "/administracion/riesgos",
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
    icon: "Workflow",
    label: "Flujos",
    permission: "workflows.view",
    route: "/configuracion/flujos",
  },
  {
    group: "Administracion",
    icon: "BellRing",
    label: "Notificaciones automáticas",
    permission: "automatic_jobs.view",
    route: "/administracion/notificaciones",
  },
  {
    group: "Administracion",
    icon: "LibraryBig",
    label: "Catalogos",
    permission: "catalogs.view",
    route: "/administracion/catalogos",
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

export const getVisibleSidebarItems = (
  authorization: AuthorizationSummary,
): SidebarItem[] =>
  SIDEBAR_ITEMS.filter((item) =>
    item.permissions
      ? hasAnyPermission(authorization.permissions, item.permissions)
      : !item.permission ||
        hasPermission(authorization.permissions, item.permission),
  );

const routeLabelMap = new Map(
  SIDEBAR_ITEMS.map((item) => [item.route, item.label] as const),
);

routeLabelMap.set("/dashboard/auditoria", "Dashboard Auditoría");
routeLabelMap.set("/dashboard/area", "Dashboard Área");
routeLabelMap.set("/dashboard/reporteria", "Tablero - Avance de planes");
routeLabelMap.set("/reportes", "Reportes");
routeLabelMap.set("/reportes/generador", "Generador de reportes");
routeLabelMap.set("/reportes/vigentes-vencidas", "Vigentes y vencidas");
routeLabelMap.set("/reportes/auditoria", "Reportes de auditoría");
routeLabelMap.set("/forbidden", "Acceso denegado");
routeLabelMap.set("/configuracion", "Configuración");
routeLabelMap.set("/configuracion/flujos", "Flujos");
routeLabelMap.set("/configuracion/flujos/nuevo", "Nuevo flujo");
routeLabelMap.set("/aprobaciones/flujos", "Tareas de flujos");
routeLabelMap.set("/solicitudes-especiales/nueva", "Nueva solicitud especial");
routeLabelMap.set("/configuracion/flujos/instancias", "Instancias de flujos");

const titleCaseSegment = (segment: string): string => {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const isOpaqueRouteSegment = (segment: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    segment,
  );

export type BreadcrumbItem = {
  href: string;
  label: string;
};

export const getRouteLabel = (route: string): string => {
  return routeLabelMap.get(route) ?? titleCaseSegment(route.replace(/^\//, ""));
};

export const buildBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  if (pathname === "/" || pathname === "/dashboard") {
    return [
      {
        href: "/dashboard",
        label: "Inicio",
      },
    ];
  }

  const segments = pathname.split("/").filter(Boolean);
  const pathSegments =
    segments[0] === "dashboard" ? segments.slice(1) : segments;

  return [
    {
      href: "/dashboard",
      label: "Inicio",
    },
    ...pathSegments.map((segment, index) => {
      const href =
        segments[0] === "dashboard"
          ? `/dashboard/${pathSegments.slice(0, index + 1).join("/")}`
          : `/${pathSegments.slice(0, index + 1).join("/")}`;

      return {
        href,
        label: isOpaqueRouteSegment(segment) ? "Detalle" : getRouteLabel(href),
      };
    }),
  ];
};
