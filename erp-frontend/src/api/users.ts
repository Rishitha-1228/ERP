import { api } from "./client";
import { User, PaginatedResponse } from "../types";

export async function fetchUsers(params: { page?: number; search?: string }) {
  const res = await api.get<PaginatedResponse<User>>("/users", { params });
  return res.data;
}

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const res = await api.post<{ success: boolean; data: User }>("/users", payload);
  return res.data.data;
}

export async function updateUser(id: string, payload: Partial<User>) {
  const res = await api.put<{ success: boolean; data: User }>(`/users/${id}`, payload);
  return res.data.data;
}

export async function resetUserPassword(id: string, newPassword: string) {
  const res = await api.post(`/users/${id}/reset-password`, { newPassword });
  return res.data.data;
}

export async function deactivateUser(id: string) {
  const res = await api.put(`/users/${id}`, { isActive: false });
  return res.data.data;
}
