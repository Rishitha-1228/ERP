import { api } from "./client";
import { Challan, PaginatedResponse } from "../types";

export async function fetchChallans(params: { page?: number; status?: string }) {
  const res = await api.get<PaginatedResponse<Challan>>("/challans", { params });
  return res.data;
}

export async function fetchChallanById(id: string) {
  const res = await api.get<{ success: boolean; data: Challan }>(`/challans/${id}`);
  return res.data.data;
}

export async function createChallan(payload: {
  customerId: string;
  status: "DRAFT" | "CONFIRMED";
  items: { productId: string; quantity: number }[];
}) {
  const res = await api.post<{ success: boolean; data: Challan }>("/challans", payload);
  return res.data.data;
}

export async function confirmChallan(id: string) {
  const res = await api.post(`/challans/${id}/confirm`);
  return res.data.data;
}

export async function cancelChallan(id: string) {
  const res = await api.post(`/challans/${id}/cancel`);
  return res.data.data;
}
