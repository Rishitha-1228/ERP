import { api } from "./client";
import { Customer, PaginatedResponse } from "../types";

export async function fetchCustomers(params: {
  page?: number;
  search?: string;
  status?: string;
}) {
  const res = await api.get<PaginatedResponse<Customer>>(
    "/customers",
    { params }
  );

  return res.data;
}

export async function fetchCustomerById(id: string) {
  const res = await api.get<{
    success: boolean;
    data: Customer;
  }>(`/customers/${id}`);

  return res.data.data;
}

export async function createCustomer(payload: Partial<Customer>) {
  const res = await api.post<{
    success: boolean;
    message: string;
    data: Customer;
  }>("/customers", payload);

  return res.data.data;
}

export async function updateCustomer(
  id: string,
  payload: Partial<Customer>
) {
  const res = await api.put<{
    success: boolean;
    message: string;
    data: Customer;
  }>(`/customers/${id}`, payload);

  return res.data.data;
}

// ⭐ NEW - Soft Delete (Deactivate Customer)
export async function deactivateCustomer(id: string) {
  const res = await api.patch<{
    success: boolean;
    message: string;
  }>(`/customers/${id}/deactivate`);

  return res.data;
}

export async function addFollowUpNote(
  id: string,
  note: string
) {
  const res = await api.post<{
    success: boolean;
    data: any;
  }>(`/customers/${id}/notes`, {
    note,
  });

  return res.data.data;
}