import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import { User } from "../types";

import {
  loginRequest,
  logoutRequest,
  registerRequest,
} from "../api/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;

  login: (
  email: string,
  password: string,
  role: string
) => Promise<void>;

  register: (
    name: string,
    email: string,
    password: string,
    role: string
  ) => Promise<void>;

  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");

    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  /* ===========================
     LOGIN
  =========================== */

  async function login(
  email: string,
  password: string,
  role: string
) {
    const {
  accessToken,
  refreshToken,
  user,
} = await loginRequest(
  email,
  password,
  role
);

    localStorage.setItem(
      "accessToken",
      accessToken
    );

    localStorage.setItem(
      "refreshToken",
      refreshToken
    );

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    setUser(user);
  }

  /* ===========================
     REGISTER
  =========================== */

  async function register(
    name: string,
    email: string,
    password: string,
    role: string
  ) {
    await registerRequest(
      name,
      email,
      password,
      role
    );
  }

  /* ===========================
     LOGOUT
  =========================== */

  async function logout() {
    try {
      await logoutRequest();
    } catch {
      // Ignore logout API errors
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}