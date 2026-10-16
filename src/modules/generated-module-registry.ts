export const generatedPermissionResources = [
  {
    key: "areas",
    label: "Áreas y gerencias",
  },
  {
    key: "risk_levels",
    label: "Niveles de riesgo",
  },
  {
    key: "observation_statuses",
    label: "Estados de observación",
  },
  {
    key: "system_parameters",
    label: "Parámetros generales",
  },
  {
    key: "catalogs",
    label: "Catálogos básicos",
  },
  {
    key: "products",
    label: "Productos",
  },
  {
    key: "observation_dictionary",
    label: "Diccionario de observaciones",
  },
  {
    key: "risks",
    label: "Riesgos asociados",
  },
  {
    key: "observation_areas",
    label: "Áreas de observación",
  },
  {
    key: "progress_evaluations",
    label: "Evaluaciones de avance",
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
