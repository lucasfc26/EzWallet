import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "../services/api";
import { setAccessToken } from "../lib/tokenStore";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** true while the silent-refresh bootstrap on first load is in flight. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .post<AuthResponse>("/auth/refresh")
      .then((data) => {
        if (!active) return;
        setAccessToken(data.accessToken);
        setUser(data.user);
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthResponse>("/auth/login", { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await api.post<AuthResponse>("/auth/register", { name, email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // best-effort — clear local session regardless
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function authErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}
