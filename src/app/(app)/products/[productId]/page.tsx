import { requirePermission } from "@/lib/server-auth";
import ProductViewPage from "@/modules/products/pages/view";
import { PRODUCTS_PERMISSIONS } from "@/modules/products/constants";

type ProductRoutePageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function ProductRoutePage({
  params,
}: ProductRoutePageProps) {
  await requirePermission(PRODUCTS_PERMISSIONS.view);

  const { productId } = await params;

  return <ProductViewPage productId={productId} />;
}
