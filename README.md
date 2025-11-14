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

## Refresh token
┌─────────────────────────────────────────────────────────────┐
│                    Request al Backend                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  ¿Status 200?  │──── ✅ ──→ Retorna data
              └────────┬───────┘
                       │ ❌ (401/403)
                       ▼
              ┌────────────────┐
              │ ¿Es ruta auth? │──── ✅ ──→ Lanza error
              └────────┬───────┘
                       │ ❌
                       ▼
        ┌──────────────────────────┐
        │ ¿Hay refresh en progreso?│
        └──────────┬───────────────┘
                   │
         ┌─────────┴─────────┐
         │ ✅ SÍ             │ ❌ NO
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌───────────────────┐
│ Agregar request │  │ Iniciar refresh   │
│ a la COLA       │  │ POST /auth/refresh│
└─────────┬───────┘  └───────┬───────────┘
          │                   │
          │                   ▼
          │          ┌────────────────┐
          │          │ ¿Refresh OK?   │
          │          └────────┬───────┘
          │                   │
          │         ┌─────────┴─────────┐
          │         │ ✅ SÍ             │ ❌ NO
          │         │                   │
          │         ▼                   ▼
          │  ┌──────────────┐    ┌────────────┐
          │  │ Procesar COLA│    │ Rechazar   │
          └─→│ Reintentar   │    │ COLA       │
             │ requests     │    │            │
             └──────┬───────┘    └─────┬──────┘
                    │                  │
                    ▼                  ▼
            ┌───────────────┐  ┌──────────────┐
            │ ✅ Retorna    │  │ authExpired  │
            │    data       │  │ → Re-login   │
            └───────────────┘  └──────────────┘

Usuario en COI Approval Page
│
├─→ Hacer click en "Aprobar COI"
│   │
│   ├─→ Request 1: POST /cois/123/approve
│   │   │
│   │   └─→ Response: 401 Unauthorized
│   │       │
│   │       ├─→ 🔄 Sistema detecta 401
│   │       │   │
│   │       │   ├─→ Inicia auto-refresh (transparente)
│   │       │   │   │
│   │       │   │   └─→ Request 2: POST /auth/refresh
│   │       │   │       │
│   │       │   │       └─→ ✅ Response: 200 OK
│   │       │   │           └─→ Nuevas cookies seteadas
│   │       │   │
│   │       │   └─→ Reintenta Request 1 automáticamente
│   │       │       │
│   │       │       └─→ Request 3: POST /cois/123/approve (retry)
│   │       │           │
│   │       │           └─→ ✅ Response: 200 OK
│   │       │
│   │       └─→ ✅ Success toast: "COI aprobado"
│   │
│   └─→ 😊 Usuario NI SE ENTERÓ del refresh
│       • No vio error
│       • No perdió trabajo
│       • Flujo continuo
│
└─→ 📈 Resultado:
    • Experiencia fluida
    • Alta productividad
    • Re-login solo cada 30+ días

