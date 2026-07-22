import { api } from "./client";
import { DashboardCard } from "../types";

export async function getDashboardSummary() {
  const res = await api.get<{ success: boolean; data: { cards: DashboardCard[] } }>(
    "/dashboard/summary"
  );
  return res.data.data;
}
