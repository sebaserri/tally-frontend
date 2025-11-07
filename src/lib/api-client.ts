// src/lib/api-client.ts
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type FetchApiOptions = {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
  csrf?: boolean; // force / disable csrf header
  signal?: AbortSignal;
  // Control de auto-refresh + reintento
  attemptRefreshOn401?: boolean;
};

export function readCookie(name: string): string | null {
  const m = document.cookie.match(
    "(?:^|; )" + name.replace(/([$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"
  );
  return m ? decodeURIComponent(m[1]) : null;
}

import { authEvents } from "./auth-events";

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const csrf = readCookie("tally_csrf");
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) return false;
      // Si refresh OK, notificamos recuperación
      authEvents.emit("authRecovered");
      return true;
    } catch {
      return false;
    } finally {
      // pequeño delay para permitir setear cookies antes de siguientes fetch
      setTimeout(() => (refreshPromise = null), 0);
    }
  })();
  return refreshPromise;
}

export async function fetchApi<T = any>(
  path: string,
  opts: FetchApiOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const method = (opts.method ?? (opts.body ? "POST" : "GET")).toUpperCase() as HttpMethod;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers || {}),
  };

  let body: BodyInit | undefined = undefined;
  if (opts.body instanceof FormData) {
    body = opts.body;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const needsCsrf =
    opts.csrf ?? ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (needsCsrf) {
    const csrf = readCookie("tally_csrf");
    if (csrf) headers["x-csrf-token"] = csrf;
  }

  const doFetch = async () => {
    const res = await fetch(url, {
      method,
      headers,
      body,
      credentials: "include",
      signal: opts.signal,
    });
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await res.json()
      : await res.text();

    if (!res.ok) {
      const message =
        (data && (data.message || data.error || data.errors)) || res.statusText;
      const err: any = new Error(
        typeof message === "string" ? message : JSON.stringify(message)
      );
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data as T;
  };

  try {
    return await doFetch();
  } catch (err: any) {
    const status = err?.status;
    const attemptRefresh = opts.attemptRefreshOn401 ?? true;

    // Nunca intentes refresh en rutas de auth explícitas para evitar loops
    const isAuthPath = /^\/auth\/(login|register|logout|forgot-password|reset-password|verify-email|resend-verification)/.test(
      path
    );

    if (
      attemptRefresh &&
      (status === 401 || status === 403) &&
      !isAuthPath
    ) {
      const ok = await tryRefresh();
      if (ok) {
        // reintentar 1 vez
        return await doFetch();
      }
      // refresh falló → avisar a la app (mostrará modal/banner y pedirá login)
      authEvents.emit("authExpired");
    }
    throw err;
  }
}
