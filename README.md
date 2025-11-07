# COI Frontend

Aplicación React (Vite + TanStack Router/Query + Tailwind) para el flujo de autenticación de COI. Usa el backend Nest como API (`/api`).

## Requisitos
- Node.js 20+
- npm 10+ (o el gestor que prefieras)

## Configuración
1. Instala dependencias:
   ```bash
   npm install
   ```
2. Copia/ajusta el archivo `.env` (de fábrica apunta a `/api`, que coincide con el prefijo global del backend):
   ```env
   VITE_API_BASE_URL=/api
   ```
   Cambia este valor si tu API corre en otra URL u origen.

## Scripts útiles
- `npm run dev` — inicia Vite en modo desarrollo (abre en `http://localhost:3000` por defecto) con el proxy a `VITE_API_BASE_URL`.
- `npm run build` — genera el bundle de producción en `dist/`.
- `npm run preview` — sirve el build generado para validación rápida.

## Notas
- El backend debe estar disponible con CORS habilitado para el `PUBLIC_APP_URL` configurado en `coi-backend`.
- Si usas otra URL para el backend, actualiza `VITE_API_BASE_URL` y/o el proxy de `vite.config.ts` para evitar problemas de CORS o cookies.

```
onClick={async () => {
        const ok = await confirm({
          title: "Eliminar ítem",
          message: "Esta acción no se puede deshacer. ¿Deseás continuar?",
          confirmText: "Eliminar",
        });
        if (ok) {
          // ... llamar API
          show({ variant: "success", title: "Eliminado" });
        }
      }}
```