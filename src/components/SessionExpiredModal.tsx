import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authEvents } from "../lib/auth-events";

export default function SessionExpiredModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const off1 = authEvents.on("authExpired", () => setOpen(true));
    const off2 = authEvents.on("authRecovered", () => setOpen(false));
    return () => {
      off1();
      off2();
    };
  }, []);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[70] grid place-items-center"
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-[71] w-[92%] max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold">Sesión expirada</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Por seguridad, tu sesión se venció. Ingresá nuevamente para continuar.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            className="btn btn-ghost"
            onClick={() => setOpen(false)}
            autoFocus
          >
            Cerrar
          </button>
          <Link to="/login" className="btn btn-primary">
            Ir a ingresar
          </Link>
        </div>
      </div>
    </div>
  );
}

