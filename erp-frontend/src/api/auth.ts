import { api } from "./client";
import { User } from "../types";

/* ===========================
   REGISTER
=========================== */

export async function registerRequest(
  name: string,
  email: string,
  password: string,
  role: string
) {
  const res = await api.post<{
    success: boolean;
    message: string;
    data: User;
  }>("/auth/register", {
    name,
    email,
    password,
    role,
  });

  return res.data;
}

/* ===========================
   LOGIN
=========================== */

export async function loginRequest(
  email: string,
  password: string,
  role: string
) {
  const res = await api.post<{
    success: boolean;
    data: {
      accessToken: string;
      refreshToken: string;
      user: User;
    };
 }>("/auth/login", {
  email,
  password,
  role,
});

  return res.data.data;
}

/* ===========================
   LOGOUT
=========================== */

export async function logoutRequest() {
  const refreshToken = localStorage.getItem("refreshToken");

  await api.post("/auth/logout", {
    refreshToken,
  });
}

/* ===========================
   CURRENT USER
=========================== */

export async function getMe() {
  const res = await api.get<{
    success: boolean;
    data: User;
  }>("/auth/me");

  return res.data.data;
}