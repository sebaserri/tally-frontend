import { useEffect, useState } from "react";
import { isRefreshingToken } from "../lib/api";
import { authEvents } from "../lib/auth-events";

type ConnectionState = "connected" | "refreshing" | "disconnected";

export default function ConnectionStatus() {
  const [state, setState] = useState<ConnectionState>("connected");
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Escuchar eventos de autenticación
    const unsubscribeRecovered = authEvents.on("authRecovered", () => {
      setState("connected");
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    });

    const unsubscribeExpired = authEvents.on("authExpired", () => {
      setState("disconnected");
      setShowStatus(true);
    });

    // Polling para detectar estado de refresh (opcional)
    const interval = setInterval(() => {
      if (isRefreshingToken()) {
        setState("refreshing");
        setShowStatus(true);
      } else if (state === "refreshing") {
        setState("connected");
      }
    }, 500);

    return () => {
      unsubscribeRecovered();
      unsubscribeExpired();
      clearInterval(interval);
    };
  }, [state]);

  if (!showStatus) return null;

  const statusConfig = {
    connected: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "✓",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      text: "Conectado",
      textColor: "text-green-800",
    },
    refreshing: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "↻",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      text: "Actualizando sesión...",
      textColor: "text-blue-800",
    },
    disconnected: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "✕",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      text: "Sesión expirada",
      textColor: "text-red-800",
    },
  };

  const config = statusConfig[state];

  return (
    <div className="fixed top-4 right-4 z-40 animate-slide-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${config.bg} ${config.border} shadow-lg`}
      >
        <div
          className={`w-8 h-8 rounded-full ${
            config.iconBg
          } flex items-center justify-center ${
            state === "refreshing" ? "animate-spin" : ""
          }`}
        >
          <span className={`text-lg font-bold ${config.iconColor}`}>
            {config.icon}
          </span>
        </div>
        <span className={`font-medium ${config.textColor}`}>{config.text}</span>
      </div>
    </div>
  );
}
