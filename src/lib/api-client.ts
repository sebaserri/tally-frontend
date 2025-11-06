export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export function readCookie(name: string): string | null {
  const m = document.cookie.match(
    "(?:^|; )" + name.replace(/([$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"
  );
  return m ? decodeURIComponent(m[1]) : null;
}

type FetchApiOptions = {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
  csrf?: boolean; // force or disable csrf header
  signal?: AbortSignal;
};

export async function fetchApi<T = any>(
  path: string,
  opts: FetchApiOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const method = opts.method ?? (opts.body ? "POST" : "GET");
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
    opts.csrf ??
    ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());

  if (needsCsrf) {
    const csrf = readCookie("tally_csrf");
    if (csrf) headers["x-csrf-token"] = csrf;
  }

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
}
