import { requirePermission } from "@/lib/server-auth";
import ProductsListPage from "@/modules/products/pages/list";
import { PRODUCTS_PERMISSIONS } from "@/modules/products/constants";

export default async function ProductsRoutePage() {
  const authorization = await requirePermission(PRODUCTS_PERMISSIONS.view);

  return (
    <ProductsListPage
      canCreate={authorization.permissions.includes(PRODUCTS_PERMISSIONS.create)}
    />
  );
}
