import { useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SessionUser } from "../state/session";
import { Card } from "../components";
import { useQueryClient } from "@tanstack/react-query";

export type Role = SessionUser["role"];

type Props =
  | { anyOf: Role[]; allOf?: never; not?: Role[]; children: ReactNode }
  | { allOf: Role[]; anyOf?: never; not?: Role[]; children: ReactNode }
  | { anyOf?: never; allOf?: never; not: Role[]; children: ReactNode };

function hasAny(user: SessionUser, list: Role[]) {
  return list.some((r) => r === user.role);
}
function hasAll(user: SessionUser, list: Role[]) {
  return list.every((r) => r === user.role);
}
function hasNot(user: SessionUser, list: Role[]) {
  return !list.includes(user.role);
}

export default function RequireRole(props: Props) {
  const qc = useQueryClient();
  const me = qc.getQueryData<SessionUser | null>(["me"]);
  const nav = useNavigate();

  // Si no hay sesión en cache, enviá a login (rutas protegidas deberían haberla seteado)
  useEffect(() => {
    if (!me)
      nav({ to: "/login", search: { next: location.pathname }, replace: true });
  }, [me, nav]);

  if (!me) return null;

  let ok = true;
  if ("anyOf" in props && props.anyOf) ok = hasAny(me, props.anyOf);
  if ("allOf" in props && props.allOf) ok = hasAll(me, props.allOf);
  if ("not" in props && props.not) ok = ok && hasNot(me, props.not);

  if (!ok) {
    return (
      <div className="mx-auto max-w-xl">
        <Card padding="lg" className="space-y-2">
          <h2 className="text-lg font-semibold">Acceso denegado</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            No tenés permisos para ver esta sección.
          </p>
          <div className="mt-4">
            <a href="/dashboard" className="btn btn-ghost">
              Volver al panel
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return <>{props.children}</>;
}
