export const PRODUCTS_API_ENDPOINT = "/products";

export const PRODUCTS_PERMISSIONS = {
  create: "products.create",
  delete: "products.delete",
  edit: "products.edit",
  view: "products.view",
} as const;

export const PRODUCTS_QUERY_KEYS = {
  all: ["products"] as const,
  detail: (productId: string) => ["products", "detail", productId] as const,
  table: ["products", "table"] as const,
} as const;

export const PRODUCTS_ROUTES = {
  create: "/products/new",
  edit: (productId: string) => `/products/${productId}/edit`,
  list: "/products",
  view: (productId: string) => `/products/${productId}`,
} as const;
