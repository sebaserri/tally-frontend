// src/pages/profile.tsx
import { useNavigate } from "@tanstack/react-router";
import { Building2, LogOut, Mail, RefreshCw, Shield, User } from "lucide-react";
import { Card, LoadingOverlay } from "../components";
import { useLogout, useRefresh, useSessionQuery } from "../state/session";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { data: me, isLoading } = useSessionQuery({ enabled: true });
  const logout = useLogout();
  const refresh = useRefresh();

  if (isLoading) return <LoadingOverlay />;
  if (!me) return null;

  const roleColors = {
    ADMIN:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200",
    VENDOR: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
    GUARD:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center mb-4">
          <User className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {me.name || me.email.split("@")[0]}
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          {me.email}
        </p>
      </div>

      {/* Account Info Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand" />
          Account Information
        </h2>
        <dl className="space-y-4">
          <div className="flex items-center justify-between">
            <dt className="text-sm text-neutral-500 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </dt>
            <dd className="font-medium">{me.email}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-sm text-neutral-500 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role
            </dt>
            <dd>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  roleColors[me.role]
                }`}
              >
                {me.role}
              </span>
            </dd>
          </div>
          {me.vendorId && (
            <div className="flex items-center justify-between">
              <dt className="text-sm text-neutral-500 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Vendor ID
              </dt>
              <dd className="font-mono text-sm">{me.vendorId}</dd>
            </div>
          )}
          {me.name && (
            <div className="flex items-center justify-between">
              <dt className="text-sm text-neutral-500 flex items-center gap-2">
                <User className="h-4 w-4" />
                Name
              </dt>
              <dd className="font-medium">{me.name}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Quick Actions Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="space-y-3">
          {me.role === "ADMIN" && (
            <button
              onClick={() => navigate({ to: "/admin/cois" })}
              className="w-full btn btn-ghost justify-start"
            >
              <Shield className="h-4 w-4" />
              Go to Admin Dashboard
            </button>
          )}
          {me.role === "GUARD" && (
            <button
              onClick={() => navigate({ to: "/guard/check" })}
              className="w-full btn btn-ghost justify-start"
            >
              <Shield className="h-4 w-4" />
              Go to Access Check
            </button>
          )}
          {me.role === "VENDOR" && (
            <button
              onClick={() => navigate({ to: "/vendor" })}
              className="w-full btn btn-ghost justify-start"
            >
              <Building2 className="h-4 w-4" />
              Go to Vendor Portal
            </button>
          )}
          <button
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            className="w-full btn btn-ghost justify-start"
          >
            <RefreshCw
              className={`h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`}
            />
            {refresh.isPending ? "Refreshing Session..." : "Refresh Session"}
          </button>
          <button
            onClick={() =>
              logout.mutate(undefined, {
                onSuccess: () => navigate({ to: "/login", replace: true }),
              })
            }
            disabled={logout.isPending}
            className="w-full btn btn-ghost justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4" />
            {logout.isPending ? "Logging Out..." : "Log Out"}
          </button>
        </div>
      </Card>

      {/* Debug Info (only in dev) */}
      {import.meta.env.DEV && (
        <Card className="p-6 bg-neutral-50 dark:bg-neutral-900">
          <h3 className="text-sm font-semibold mb-3 text-neutral-500">
            Debug Info (dev only)
          </h3>
          <pre className="text-xs bg-neutral-100 dark:bg-neutral-950 p-3 rounded overflow-auto">
            {JSON.stringify(me, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
