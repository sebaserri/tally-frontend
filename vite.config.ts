import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // carga todo, no solo VITE_

  const DEV_PORT = Number(env.VITE_DEV_SERVER_PORT || env.PORT || 5000);
  const BACKEND_URL =
    env.VITE_BACKEND_URL ||
    (env.BACKEND_PORT
      ? `http://localhost:${env.BACKEND_PORT}`
      : "http://localhost:4000");
  const API_PREFIX_RAW = env.VITE_API_BASE_URL || "/api";
  const API_PREFIX = API_PREFIX_RAW.startsWith("/")
    ? API_PREFIX_RAW
    : `/${API_PREFIX_RAW}`;
  const PROXY_SECURE =
    String(env.VITE_PROXY_SECURE || "false").toLowerCase() === "true";

  return {
    plugins: [react()],

    server: {
      port: DEV_PORT,
      host: true, // permite acceder desde LAN si lo necesitás
      proxy: {
        // Todo lo que empiece con /api va al backend
        [API_PREFIX]: {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: PROXY_SECURE, // false para self-signed en dev
          // Importante: NO reescribimos el prefijo /api
          // rewrite: (path) => path,
        },
      },
    },

    // opcional: mismo puerto en `vite preview`
    preview: {
      port: DEV_PORT,
    },
  };
});
