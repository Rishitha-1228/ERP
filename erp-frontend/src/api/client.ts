import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL: BASE_URL });

// Attach the access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, try ONE silent refresh using the refresh token before giving up.
// This assumes: POST /auth/refresh { refreshToken } -> { accessToken, refreshToken }
// Adjust the payload/response shape here to match your actual auth.controller.ts.
let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/login") window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    original._retry = true;
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // wait for the in-flight refresh to finish, then retry
      return new Promise((resolve) => {
        pendingQueue.push(() => resolve(api(original)));
      });
    }

    isRefreshing = true;
    try {
      const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefresh } = res.data.data;
      localStorage.setItem("accessToken", accessToken);
      if (newRefresh) localStorage.setItem("refreshToken", newRefresh);
      pendingQueue.forEach((cb) => cb());
      pendingQueue = [];
      return api(original);
    } catch (refreshErr) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
