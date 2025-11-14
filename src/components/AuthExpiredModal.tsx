// src/components/AuthExpiredModal.tsx
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authEvents } from "../lib/auth-events";

export default function AuthExpiredModal() {
  const [isOpen, setIsOpen] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const unsubscribe = authEvents.on("authExpired", () => {
      setIsOpen(true);
    });

    return unsubscribe;
  }, []);

  const handleRelogin = () => {
    setIsOpen(false);
    // Guarda la ruta actual para redirigir después del login
    localStorage.setItem("redirectAfterLogin", window.location.pathname);
    nav({ to: "/login", replace: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-orange-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Sesión Expirada
          </h3>
        </div>

        <p className="text-gray-600 mb-6">
          Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente para continuar.
        </p>

        <button
          onClick={handleRelogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
}
