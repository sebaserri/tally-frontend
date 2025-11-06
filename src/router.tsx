// src/router.tsx
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Suspense, lazy, useEffect, useRef } from "react";
import { LoadingOverlay, PageSkeleton } from "./components";
import { useLogout, useSessionQuery } from "./state/session";

// --- Lazy pages ---
const DashboardPage = lazy(() => import("./routes/dashboard"));
const ForgotPasswordPage = lazy(() => import("./routes/forgot-password"));
const LoginPage = lazy(() => import("./routes/login"));
const RegisterPage = lazy(() => import("./routes/register"));
const ResendVerificationPage = lazy(
  () => import("./routes/resend-verification")
);
const ResetPasswordPage = lazy(() => import("./routes/reset-password"));
const VerifyEmailPage = lazy(() => import("./routes/verify-email"));

export type RouterContext = {};

const PROTECTED_PREFIXES = ["/dashboard"];

// ---------------- UI bits ----------------
function TopProgress() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "fixed inset-x-0 top-0 z-50 h-0.5 pointer-events-none transition-opacity",
        isLoading ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="h-full w-full bg-gradient-to-r from-brand via-sky-400 to-indigo-400 animate-[progress_1.2s_ease-in-out_infinite]" />
      <style>{`@keyframes progress{0%{transform:translateX(-100%)}50%{transform:translateX(-20%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}

function SkipToContent() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg dark:focus:bg-neutral-900"
    >
      Saltar al contenido
    </a>
  );
}

function NavLink(props: React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={clsx("link px-2 py-1 rounded-lg", props.className)}
      activeProps={{ className: "font-semibold" }}
    />
  );
}

function AuthHeader() {
  const location = useRouterState({ select: (s) => s.location });
  const nav = useNavigate();
  const logout = useLogout();

  // ❗️No llamamos /auth/me en páginas públicas. Solo en rutas protegidas.
  const shouldCheckSession = PROTECTED_PREFIXES.some((p) =>
    location.pathname.startsWith(p)
  );
  const { data: me } = useSessionQuery({ enabled: shouldCheckSession });

  const canReturnHere = location.pathname !== "/login";
  const next = canReturnHere
    ? location.pathname + (location.searchStr ? location.searchStr : "")
    : undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/60 dark:border-neutral-800/60 backdrop-blur bg-white/70 dark:bg-neutral-950/70">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg">
          <span className="text-brand">Tally</span>
        </Link>

        <nav className="text-sm flex items-center gap-2">
          {me ? (
            <>
              <NavLink to="/dashboard">Panel</NavLink>
              <button
                className="btn btn-ghost"
                onClick={() =>
                  logout.mutate(undefined, {
                    onSuccess: () => nav({ to: "/login", replace: true }),
                  })
                }
                disabled={logout.isPending}
                aria-label="Salir"
                title="Cerrar sesión"
              >
                {logout.isPending ? "Saliendo…" : "Salir"}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/register">Registrarme</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Shell() {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useRouterState({
    select: (s) => ({ pathname: s.location.pathname }),
  });

  useEffect(() => {
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-black dark:to-neutral-950">
      <TopProgress />
      <SkipToContent />
      <AuthHeader />
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto max-w-6xl px-4 py-10 outline-none"
      >
        <Suspense
          fallback={
            <div className="space-y-8">
              <LoadingOverlay />
              <PageSkeleton />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <footer className="py-10 text-center text-xs text-neutral-500">
        &copy; {new Date().getFullYear()} Tally
      </footer>
    </div>
  );
}

// ---------------- Guards ----------------
function GuardLoading() {
  return (
    <div className="py-16">
      <LoadingOverlay />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  // ✅ En rutas protegidas sí chequeamos /auth/me
  const { data: me, isLoading } = useSessionQuery({ enabled: true });
  const nav = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !me && !redirected.current) {
      redirected.current = true;
      nav({ to: "/login", search: { next: "/dashboard" }, replace: true });
    }
  }, [isLoading, me, nav]);

  if (isLoading) return <GuardLoading />;
  if (!me) return null;
  return <>{children}</>;
}

// ---------------- Routes ----------------
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Shell,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-semibold">Algo salió mal</h1>
      <p className="mt-2 text-sm text-neutral-500 break-words">
        {(error as any)?.message ?? "Error desconocido"}
      </p>
      <div className="mt-6">
        <Link to="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
    </div>
  ),
});

// "/" y "/login" SIEMPRE renderizan el login sin tocar el backend
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <LoginPage />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (s: Record<string, unknown>) =>
    ({ next: typeof s.next === "string" ? s.next : undefined } as {
      next?: string;
    }),
  component: () => <LoginPage />,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: () => <RegisterPage />,
});

const forgotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: () => <ForgotPasswordPage />,
});

const resetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  validateSearch: (s: Record<string, unknown>) =>
    ({ token: typeof s.token === "string" ? s.token : undefined } as {
      token?: string;
    }),
  component: () => <ResetPasswordPage />,
});

const verifyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-email",
  validateSearch: (s: Record<string, unknown>) =>
    ({ token: typeof s.token === "string" ? s.token : undefined } as {
      token?: string;
    }),
  component: () => <VerifyEmailPage />,
});

const resendRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/resend-verification",
  component: () => <ResendVerificationPage />,
});

// Dashboard protegido
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

// 404
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: () => (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-semibold">Página no encontrada</h1>
      <p className="mt-2 text-sm text-neutral-500">
        No pudimos encontrar lo que buscabas.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link to="/" className="btn btn-ghost">
          Ir al inicio
        </Link>
        <Link to="/login" className="btn btn-primary">
          Ingresar
        </Link>
      </div>
    </div>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  forgotRoute,
  resetRoute,
  verifyRoute,
  resendRoute,
  dashboardRoute,
  notFoundRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
