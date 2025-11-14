// src/router.tsx
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  useMatchRoute,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Suspense, lazy, useEffect, useRef } from "react";
import RequireRole from "./auth/RequireRole";
import {
  LoadingOverlay,
  Logo,
  PageSkeleton,
  UnverifiedEmailBanner,
} from "./components";
import { useLogout, useSessionQuery } from "./state/session";
import { Building2, FileText, LogOut, Shield, User, Users } from "lucide-react";

// --- Lazy pages ---
const ForgotPasswordPage = lazy(() => import("./routes/forgot-password"));
const LoginPage = lazy(() => import("./routes/login"));
const RegisterPage = lazy(() => import("./routes/register"));
const ResendVerificationPage = lazy(
  () => import("./routes/resend-verification")
);
const ResetPasswordPage = lazy(() => import("./routes/reset-password"));
const VerifyEmailPage = lazy(() => import("./routes/verify-email"));
const LogoutRoute = lazy(() => import("./routes/logout"));
const ProfilePage = lazy(() => import("./routes/profile"));

// COI Pages
const PublicSubmitPage = lazy(() => import("./routes/coi/public-submit"));
const AdminCoiListPage = lazy(() => import("./routes/coi/admin-list"));
const AdminCoiDetailPage = lazy(() => import("./routes/coi/admin-detail"));
const AdminRequestCoiPage = lazy(() => import("./routes/coi/admin-request"));
const GuardCheckPage = lazy(() => import("./routes/coi/guard-check"));

// Vendor Pages
const VendorPage = lazy(() => import("./routes/vendor/vendor-portal"));

// Admin Pages
const BuildingsManagementPage = lazy(
  () => import("./routes/admin/buildings/buildings-management")
);
const VendorsManagementPage = lazy(
  () => import("./routes/admin/vendors/vendors-management")
);
const RequirementsManagementPage = lazy(
  () => import("./routes/admin/requirements-management")
);
const AuditLogsViewerPage = lazy(
  () => import("./routes/admin/audit-logs-viewer")
);

// Guard Pages
const GuardVendorsListPage = lazy(
  () => import("./routes/guard/guard-vendors-list")
);

export type RouterContext = {};

const PROTECTED_PREFIXES = ["/vendor", "/guard", "/admin", "/profile"];

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
      Skip to content
    </a>
  );
}

export function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const isActive = useMatchRoute();
  const match = isActive({ to, fuzzy: true });

  return (
    <Link
      to={to}
      className={clsx(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
        match
          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 shadow-sm"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}

function AuthHeader() {
  const location = useRouterState({ select: (s) => s.location });
  const nav = useNavigate();
  const logout = useLogout();

  const shouldCheckSession = PROTECTED_PREFIXES.some((p) =>
    location.pathname.startsWith(p)
  );
  const { data: me } = useSessionQuery({ enabled: shouldCheckSession });

  const canReturnHere = location.pathname !== "/login";
  const next = canReturnHere
    ? location.pathname + (location.searchStr ? location.searchStr : "")
    : undefined;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/60 dark:border-gray-800/60 backdrop-blur-md bg-white/80 dark:bg-gray-950/80 shadow-sm">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group transition-transform hover:scale-105"
          >
            <Logo />
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {me && (
              <>
                {me.role === "ADMIN" && (
                  <>
                    <NavLink to="/admin/cois">
                      <FileText className="h-4 w-4" />
                      <span>Certificates</span>
                    </NavLink>
                    <NavLink to="/admin/buildings">
                      <Building2 className="h-4 w-4" />
                      <span>Buildings</span>
                    </NavLink>
                    <NavLink to="/admin/vendors">
                      <Users className="h-4 w-4" />
                      <span>Vendors</span>
                    </NavLink>
                    <NavLink to="/admin/audit">
                      <Shield className="h-4 w-4" />
                      <span>Audit</span>
                    </NavLink>
                  </>
                )}

                {me.role === "GUARD" && (
                  <>
                    <NavLink to="/guard/check">
                      <Shield className="h-4 w-4" />
                      <span>Access Check</span>
                    </NavLink>
                    <NavLink to="/guard/vendors">
                      <Users className="h-4 w-4" />
                      <span>Vendors</span>
                    </NavLink>
                  </>
                )}

                {me.role === "VENDOR" && (
                  <NavLink to="/vendor">
                    <FileText className="h-4 w-4" />
                    <span>Dashboard</span>
                  </NavLink>
                )}

                {/* Divider */}
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-2"></div>

                {/* Profile Link */}
                <NavLink to="/profile">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </NavLink>

                {/* Logout Button */}
                <button
                  onClick={() =>
                    logout.mutate(undefined, {
                      onSuccess: () => nav({ to: "/login", replace: true }),
                    })
                  }
                  disabled={logout.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="h-4 w-4" />
                  <span>
                    {logout.isPending ? "Signing out..." : "Sign Out"}
                  </span>
                </button>
              </>
            )}
          </nav>
        </div>
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
      <UnverifiedEmailBanner className="mt-2" />
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
        &copy; {new Date().getFullYear()} ProofHolder
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
  const { data: me, isLoading } = useSessionQuery({ enabled: true });
  const nav = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !me && !redirected.current) {
      redirected.current = true;
      nav({ to: "/login", replace: true });
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
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-neutral-500 break-words">
        {(error as any)?.message ?? "Unknown error"}
      </p>
      <div className="mt-6">
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    </div>
  ),
});

// Public routes
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

// Public COI submission
const publicSubmitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/submit/$token",
  component: () => <PublicSubmitPage />,
});

// Protected routes
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: () => (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  ),
});

// Admin routes
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => {
    const navigate = useNavigate();
    useEffect(() => {
      navigate({ to: "/admin/cois", replace: true });
    }, [navigate]);
    return null;
  },
});

const adminCoiListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/cois",
  component: () => (
    <RequireAuth>
      <RequireRole anyOf={["ADMIN"]}>
        <AdminCoiListPage />
      </RequireRole>
    </RequireAuth>
  ),
});

const adminCoiDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/cois/$id",
  component: () => (
    <RequireAuth>
      <RequireRole anyOf={["ADMIN"]}>
        <AdminCoiDetailPage />
      </RequireRole>
    </RequireAuth>
  ),
});

const adminRequestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/request",
  component: () => (
    <RequireAuth>
      <RequireRole anyOf={["ADMIN"]}>
        <AdminRequestCoiPage />
      </RequireRole>
    </RequireAuth>
  ),
});

const adminBuildingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/buildings",
  component: () => (
    <RequireAuth>
      <RequireRole anyOf={["ADMIN"]}>
        <BuildingsManagementPage />
      </RequireRole>
    </RequireAuth>
  ),
});

const adminVendorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/vendors",
  component: () => (
    <RequireAuth>
      <RequireRole anyOf={["ADMIN"]}>
        <VendorsManagementPage />
      </RequireRole>
    </RequireAuth>
  ),
});

const adminRequirementsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/buildings/$id/requirements",
  component: () => (
    <RequireAuth>
      <RequireRole anyOf={["ADMIN"]}>
        <RequirementsManagementPage />
      </RequireRole>
    </RequireAuth>
  ),
});

const adminAuditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/audit",
  component: () => (
    <RequireAuth>
      <RequireRole anyOf={["ADMIN"]}>
        <AuditLogsViewerPage />
      </RequireRole>
    </RequireAuth>
  ),
});

// Guard routes
const guardCheckRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/guard/check",
  component: () => (
    <RequireAuth>
      <RequireRole anyOf={["GUARD", "ADMIN"]}>
        <GuardCheckPage />
      </RequireRole>
    </RequireAuth>
  ),
});

const guardVendorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/guard/vendors",
  component: () => (
    <RequireAuth>
      <RequireRole anyOf={["GUARD", "ADMIN"]}>
        <GuardVendorsListPage />
      </RequireRole>
    </RequireAuth>
  ),
});

// Vendor route
const vendorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vendor",
  component: () => (
    <RequireAuth>
      <RequireRole anyOf={["VENDOR", "ADMIN"]}>
        <VendorPage />
      </RequireRole>
    </RequireAuth>
  ),
});

const logoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/logout",
  component: () => <LogoutRoute />,
});

// 404
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: () => (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-neutral-500">
        We couldn't find what you're looking for.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link to="/" className="btn btn-ghost">
          Go Home
        </Link>
        <Link to="/login" className="btn btn-primary">
          Log In
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
  profileRoute,
  publicSubmitRoute,
  adminRoute,
  adminCoiListRoute,
  adminCoiDetailRoute,
  adminRequestRoute,
  adminBuildingsRoute,
  adminVendorsRoute,
  adminRequirementsRoute,
  adminAuditRoute,
  guardCheckRoute,
  guardVendorsRoute,
  vendorRoute,
  logoutRoute,
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
