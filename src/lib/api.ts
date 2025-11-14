// src/lib/api.ts
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

// ============================================================================
// SISTEMA DE COLA PARA AUTO-REFRESH
// ============================================================================

type QueuedRequest = {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retry: () => Promise<any>;
};

let refreshPromise: Promise<boolean> | null = null;
let requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;

/**
 * Procesa la cola de requests pendientes después de un refresh exitoso o fallido
 * @param error - Si hay error, rechaza todos los requests; si es null, los reintenta
 */
function processQueue(error: Error | null = null): void {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  const queue = [...requestQueue];
  requestQueue = [];

  queue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      // Reintentar el request original con las nuevas cookies
      item.retry().then(item.resolve).catch(item.reject);
    }
  });

  isProcessingQueue = false;
}

/**
 * Intenta refrescar el token de autenticación
 * @returns true si el refresh fue exitoso, false en caso contrario
 */
async function tryRefresh(): Promise<boolean> {
  // Si ya hay un refresh en progreso, esperar a que termine
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const csrf = readCookie("proofholder_csrf");
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) {
        const error = new Error("Token refresh failed");
        processQueue(error);
        return false;
      }

      // Refresh exitoso - procesar cola de requests pendientes
      authEvents.emit("authRecovered");
      processQueue(null);
      return true;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Token refresh failed");
      processQueue(error);
      return false;
    } finally {
      // Pequeño delay para permitir setear cookies antes de siguientes fetch
      setTimeout(() => {
        refreshPromise = null;
      }, 100); // Aumentado a 100ms para mayor seguridad
    }
  })();

  return refreshPromise;
}

// ============================================================================
// FETCH API PRINCIPAL
// ============================================================================

export async function fetchApi<T = any>(
  path: string,
  opts: FetchApiOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const method = (
    opts.method ?? (opts.body ? "POST" : "GET")
  ).toUpperCase() as HttpMethod;

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
    const csrf = readCookie("proofholder_csrf");
    if (csrf) headers["x-csrf-token"] = csrf;
  }

  /**
   * Función interna que ejecuta el fetch
   */
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

  // ============================================================================
  // LÓGICA DE AUTO-REFRESH CON COLA
  // ============================================================================

  try {
    return await doFetch();
  } catch (err: any) {
    const status = err?.status;
    const attemptRefresh = opts.attemptRefreshOn401 ?? true;

    // Nunca intentes refresh en rutas de auth explícitas para evitar loops infinitos
    const isAuthPath =
      /^\/auth\/(login|register|logout|forgot-password|reset-password|verify-email|resend-verification)/.test(
        path
      );

    // Si es 401/403 y no es ruta de auth, intentar refresh
    if (attemptRefresh && (status === 401 || status === 403) && !isAuthPath) {
      // Si ya hay un refresh en progreso, agregar a la cola
      if (refreshPromise) {
        return new Promise<T>((resolve, reject) => {
          requestQueue.push({
            resolve,
            reject,
            retry: () => doFetch(),
          });
        });
      }

      // Intentar refresh
      const refreshOk = await tryRefresh();

      if (refreshOk) {
        // Refresh exitoso - reintentar request original
        return await doFetch();
      } else {
        // Refresh falló - avisar a la app para que muestre modal de re-login
        authEvents.emit("authExpired");
        throw err;
      }
    }

    // Para otros errores o si no aplica refresh, propagar error
    throw err;
  }
}

// ============================================================================
// UTILIDADES ADICIONALES
// ============================================================================

/**
 * Limpia la cola de requests pendientes (útil en logout o errores críticos)
 */
export function clearRequestQueue(): void {
  const error = new Error("Request queue cleared");
  requestQueue.forEach((item) => item.reject(error));
  requestQueue = [];
}

/**
 * Verifica si hay un refresh en progreso
 */
export function isRefreshingToken(): boolean {
  return refreshPromise !== null;
}

/**
 * Obtiene el número de requests en cola
 */
export function getQueuedRequestsCount(): number {
  return requestQueue.length;
}
