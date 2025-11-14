import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../lib/api";

export type Role = "ADMIN" | "VENDOR" | "GUARD";
export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  vendorId?: string;
  name?: string;
  emailVerifiedAt?: string | null;
};

/**
 * ❗️No llamar al backend por defecto.
 * Usá `useSessionQuery({ enabled: true })` SOLO en rutas protegidas (/dashboard).
 */
export function useSessionQuery(opts?: { enabled?: boolean }) {
  return useQuery<SessionUser | null>({
    queryKey: ["me"],
    enabled: opts?.enabled ?? false, // <- deshabilitado por defecto
    queryFn: async () => {
      try {
        const result = await fetchApi<{ ok: true; user: SessionUser }>(
          "/auth/me"
        );
        return result.user;
      } catch (err: any) {
        if (err.status === 401 || err.status === 403) {
          return null;
        }
        throw err;
      }
    },
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.status === 403) return false;
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      fetchApi<{ ok: true; user: SessionUser }>("/auth/login", {
        method: "POST",
        body: payload,
      }),
    onSuccess: ({ user }) => {
      // Opcionalmente seteamos el cache de 'me' para evitar un /auth/me inmediato
      qc.setQueryData<SessionUser | null>(["me"], user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      role: Role;
      name?: string;
      vendorId?: string;
    }) =>
      fetchApi<{ ok: true; user: SessionUser }>("/auth/register", {
        method: "POST",
        body: payload,
      }),
    onSuccess: ({ user }) => {
      qc.setQueryData<SessionUser | null>(["me"], user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchApi<{ ok: true }>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["me"] });
    },
  });
}

export function useRefresh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchApi<{ ok: true; user: SessionUser }>("/auth/refresh", {
        method: "POST",
      }),
    onSuccess: ({ user }) => qc.setQueryData(["me"], user),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      fetchApi<{ ok: true }>("/auth/forgot-password", {
        method: "POST",
        body: { email },
        csrf: false,
      }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: { token: string; password: string }) =>
      fetchApi<{ ok: true }>("/auth/reset-password", {
        method: "POST",
        body: payload,
        csrf: false,
      }),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) =>
      fetchApi<{ ok: true }>("/auth/verify-email", {
        method: "POST",
        body: { token },
        csrf: false,
      }),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) =>
      fetchApi<{ ok: true }>("/auth/resend-verification", {
        method: "POST",
        body: { email },
        csrf: false,
      }),
  });
}
