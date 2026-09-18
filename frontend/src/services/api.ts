/**
 * Thin fetch wrapper shared by every service. `credentials: "include"` sends
 * the httpOnly refresh cookie; the short-lived access token is attached from
 * lib/tokenStore.ts. A single 401 triggers one silent refresh-and-retry —
 * concurrent 401s share the same in-flight refresh call instead of each
 * firing their own.
 */
import { getAccessToken, setAccessToken } from "../lib/tokenStore";

const BASE_URL = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface AuthResponse {
  user: { id: string; email: string; name: string };
  accessToken: string;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          setAccessToken(null);
          return null;
        }
        const data = (await res.json()) as AuthResponse;
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  skipAuthRetry?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  // /auth/* manages its own token lifecycle — retrying it here would recurse.
  if (res.status === 401 && !opts.skipAuthRetry && !path.startsWith("/auth/")) {
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(path, { ...opts, skipAuthRetry: true });
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
    throw new ApiError(res.status, message ?? "Não foi possível completar a operação.");
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
