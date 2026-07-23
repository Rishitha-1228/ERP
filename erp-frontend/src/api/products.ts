import { api } from "./client";
import { Product, PaginatedResponse } from "../types";

export async function fetchProducts(params: {
  page?: number;
  search?: string;
  category?: string;
}) {
  const res = await api.get<PaginatedResponse<Product>>(
    "/products",
    { params }
  );

  return res.data;
}

export async function fetchProductById(id: string) {
  const res = await api.get<{
    success: boolean;
    data: Product;
  }>(`/products/${id}`);

  return res.data.data;
}

export async function createProduct(
  payload: Partial<Product>
) {
  const res = await api.post<{
    success: boolean;
    message: string;
    data: Product;
  }>("/products", payload);

  return res.data.data;
}

export async function updateProduct(
  id: string,
  payload: Partial<Product>
) {
  const res = await api.put<{
    success: boolean;
    message: string;
    data: Product;
  }>(`/products/${id}`, payload);

  return res.data.data;
}

// ⭐ NEW
export async function deactivateProduct(id: string) {
  const res = await api.patch<{
    success: boolean;
    message: string;
  }>(`/products/${id}/deactivate`);

  return res.data;
}
export async function transferProductWarehouse(
  id: string,
  payload: { warehouse: string; reason?: string }
) {
  const res = await api.patch<{
    success: boolean;
    message: string;
  }>(`/products/${id}/transfer`, payload);

  return res.data;
}
export async function fetchCategories() {
  const res = await api.get<{
    success: boolean;
    data: string[];
  }>("/products/categories");

  return res.data.data;
}

export async function fetchWarehouses() {
  const res = await api.get<{
    success: boolean;
    data: string[];
  }>("/products/warehouses");

  return res.data.data;
}