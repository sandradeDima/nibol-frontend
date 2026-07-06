"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { apiClient } from "@/services/api-client";
import type { ApiSuccessResponse } from "@/types";

import type { ProductRecord } from "../types";
import {
  PRODUCTS_API_ENDPOINT,
  PRODUCTS_QUERY_KEYS,
} from "../constants";

export const productFormSchema = z.object({
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().default(true),
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(191),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

const toPayload = (values: ProductFormValues) => {
  return {
    description: values.description?.trim() ? values.description.trim() : null,
    isActive: values.isActive,
    name: values.name.trim(),
  };
};

const getProductById = async (
  productId: string,
): Promise<ProductRecord> => {
  const response = await apiClient.get<ApiSuccessResponse<ProductRecord>>(
    `${PRODUCTS_API_ENDPOINT}/${productId}`,
  );

  return response.data.data;
};

export const useProducts = () => {
  const queryClient = useQueryClient();

  const useProduct = (productId: string) =>
    useQuery({
      enabled: Boolean(productId),
      queryFn: () => getProductById(productId),
      queryKey: PRODUCTS_QUERY_KEYS.detail(productId),
    });

  const useCreateProduct = () =>
    useMutation({
      mutationFn: async (values: ProductFormValues) => {
        const response = await apiClient.post<ApiSuccessResponse<ProductRecord>>(
          PRODUCTS_API_ENDPOINT,
          toPayload(values),
        );

        return response.data.data;
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: PRODUCTS_QUERY_KEYS.all,
        });
      },
    });

  const useUpdateProduct = () =>
    useMutation({
      mutationFn: async ({
        productId,
        values,
      }: {
        productId: string;
        values: ProductFormValues;
      }) => {
        const response = await apiClient.put<ApiSuccessResponse<ProductRecord>>(
          `${PRODUCTS_API_ENDPOINT}/${productId}`,
          toPayload(values),
        );

        return response.data.data;
      },
      onSuccess: async (_record, variables) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: PRODUCTS_QUERY_KEYS.all,
          }),
          queryClient.invalidateQueries({
            queryKey: PRODUCTS_QUERY_KEYS.detail(variables.productId),
          }),
        ]);
      },
    });

  const useDeleteProduct = () =>
    useMutation({
      mutationFn: async (productId: string) => {
        await apiClient.delete(`${PRODUCTS_API_ENDPOINT}/${productId}`);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: PRODUCTS_QUERY_KEYS.all,
        });
      },
    });

  return {
    useProduct,
    useCreateProduct,
    useDeleteProduct,
    useUpdateProduct,
  };
};
