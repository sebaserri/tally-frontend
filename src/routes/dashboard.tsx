import { useNavigate } from "@tanstack/react-router";
import { useLogout, useRefresh, useSessionQuery } from "../state/session";
import { Button, Card, PageTitle } from "../components";

export default function DashboardPage() {
  const nav = useNavigate();
  const { data: me, isLoading, error } = useSessionQuery();
  const logout = useLogout();
  const refresh = useRefresh();

  if (isLoading) return <div className="text-center">Cargando…</div>;

  if (!me || (error as any)?.status === 401) {
    nav({ to: "/login", search: { next: "/dashboard" }, replace: true });
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle>Panel</PageTitle>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            title="Llama a /auth/refresh (requiere CSRF + cookies)"
          >
            {refresh.isPending ? "Refrescando…" : "Refrescar sesión"}
          </Button>
          <Button
            onClick={() => logout.mutate(undefined, { onSuccess: () => nav({ to: "/login" }) })}
            disabled={logout.isPending}
          >
            {logout.isPending ? "Saliendo…" : "Salir"}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Tu sesión</h2>
        <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">ID</dt>
            <dd className="font-mono">{me.id}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">Email</dt>
            <dd>{me.email}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">Rol</dt>
            <dd>{me.role}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">Vendor</dt>
            <dd>{me.vendorId || "—"}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">Nombre</dt>
            <dd>{me.name || "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Endpoints cubiertos</h2>
        <ul className="mt-3 list-disc pl-5 text-sm space-y-1">
          <li><code>/auth/register</code> — desde <strong>Registro</strong></li>
          <li><code>/auth/login</code> — desde <strong>Login</strong></li>
          <li><code>/auth/me</code> — usado en carga de sesión</li>
          <li><code>/auth/refresh</code> — botón Refrescar sesión</li>
          <li><code>/auth/logout</code> — botón Salir</li>
          <li><code>/auth/verify-email</code> — pantalla Verificar email</li>
          <li><code>/auth/resend-verification</code> — pantalla Reenviar verificación</li>
          <li><code>/auth/forgot-password</code> — pantalla Recuperar</li>
          <li><code>/auth/reset-password</code> — pantalla Reset con token</li>
        </ul>
      </Card>
    </div>
  );
}
