import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useLogout } from "../state/session";

export default function LogoutRoute() {
  const nav = useNavigate();
  const logout = useLogout();

  useEffect(() => {
    logout.mutate(undefined, {
      onSuccess: () => nav({ to: "/login", replace: true }),
      onError: () => nav({ to: "/login", replace: true }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="py-16 flex items-center justify-center">
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent" />
      <span className="ml-3 text-sm text-neutral-500">Cerrando sesión…</span>
    </div>
  );
}
