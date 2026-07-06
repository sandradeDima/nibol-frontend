import { requirePermission } from "@/lib/server-auth";
import EditProductPage from "@/modules/products/pages/edit";
import { PRODUCTS_PERMISSIONS } from "@/modules/products/constants";

type EditProductRoutePageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function EditProductRoutePage({
  params,
}: EditProductRoutePageProps) {
  await requirePermission(PRODUCTS_PERMISSIONS.edit);

  const { productId } = await params;

  return <EditProductPage productId={productId} />;
}
