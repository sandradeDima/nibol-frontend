import { requirePermission } from "@/lib/server-auth";
import CreateProductPage from "@/modules/products/pages/create";
import { PRODUCTS_PERMISSIONS } from "@/modules/products/constants";

export default async function NewProductRoutePage() {
  await requirePermission(PRODUCTS_PERMISSIONS.create);

  return <CreateProductPage />;
}
