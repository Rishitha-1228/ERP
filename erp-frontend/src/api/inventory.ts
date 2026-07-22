import { api } from "./client";
import { StockMovement, PaginatedResponse } from "../types";

export async function fetchStockMovements(params: {
  page?: number;
  productId?: string;
}) {
  const res = await api.get<PaginatedResponse<StockMovement>>(
    "/inventory",
    {
      params,
    }
  );

  return res.data;
}

export async function createStockMovement(payload: {
  productId: string;
  quantity: number;
  movementType: "IN" | "OUT" | "ADJUST";
  reason: string;
}) {
  const res = await api.post<{
    success: boolean;
    message: string;
    data: StockMovement;
  }>("/inventory", payload);

  return res.data;
}