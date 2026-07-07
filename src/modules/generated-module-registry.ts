export const generatedPermissionResources = [
  {
    key: "areas",
    label: "Areas y gerencias",
  },
  {
    key: "risk_levels",
    label: "Niveles de riesgo",
  },
  {
    key: "observation_statuses",
    label: "Estados de observacion",
  },
  {
    key: "system_parameters",
    label: "Parametros generales",
  },
  {
    key: "catalogs",
    label: "Catalogos basicos",
  },
  {
    key: "products",
    label: "Productos",
  },
  {
    key: "observations",
    label: "Observaciones",
  },
  {
    key: "extension_requests",
    label: "Ampliaciones de plazo",
  },
] as const;

export const generatedSidebarItems = [
  {
    icon: "Package",
    label: "Productos",
    permission: "products.view",
    route: "/products",
  },
];
