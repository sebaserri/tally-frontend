import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode, useEffect, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { router } from "./router";

// Centralized QueryClient with sensible prod/dev defaults & logging
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount) => (import.meta.env.DEV ? false : failureCount < 2),
      refetchOnWindowFocus: false,
      staleTime: 15_000,
    },
    mutations: { retry: 0 },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("[React Query] Query error:", query?.queryKey, error);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error(
          "[React Query] Mutation error:",
          mutation?.options?.mutationKey,
          error
        );
      }
    },
  }),
});

// Lazy-load devtools only in development if installed
function ReactQueryDevtoolsGate() {
  const [Devtools, setDevtools] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    import("@tanstack/react-query-devtools")
      .then((m) => {
        // IMPORTANT: set a value, not an updater; also type as ComponentType to accept ReactElement | null returns
        setDevtools(() => m.ReactQueryDevtools as ComponentType<any>);
      })
      .catch(() => {
        // devtools not installed; ignore silently
      });
  }, []);

  return Devtools ? (
    <Devtools initialIsOpen={false} buttonPosition="bottom-right" />
  ) : null;
}

function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtoolsGate />
    </QueryClientProvider>
  );
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>
);
