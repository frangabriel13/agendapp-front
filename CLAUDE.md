# reservApp — Contexto del proyecto

SaaS de gestión de turnos para estéticas y centros de belleza. Mercado objetivo: Argentina (y futuro LATAM).

## ⚠️ Next.js 16 — NO es el Next.js que conocés
Este proyecto usa **Next.js 16.2.6**, que tiene breaking changes respecto de versiones anteriores. APIs, convenciones y estructura pueden diferir de lo que está en tu training data. **Antes de escribir código, leé la guía relevante en `node_modules/next/dist/docs/`.** Prestá atención a los avisos de deprecación.

## Stack
- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- @tanstack/react-query v5
- shadcn/ui (Radix) + Lucide React

## Comandos
- `npm run dev` — servidor de desarrollo en `http://localhost:3000`
- `npm run build` — build de producción
- `npm run start` — servir el build de producción
- `npm run lint` — ESLint
- No hay framework de tests configurado todavía

## Imports / alias
- `@/*` → raíz del repo (ej: `@/types`, `@/lib/utils`, `@/components/ui/button`)
- Configurado en `tsconfig.json` (`paths`)

## Estructura de rutas
- `/` → Landing page de marketing
- `/login` → Login
- `/dashboard` → Panel admin (inicio)
- `/agenda` → Calendario semanal de turnos

## Grupos de rutas (route groups)
- `app/(marketing)` → Landing pública
- `app/(auth)` → Login / registro
- `app/(admin)` → Panel de administración (sidebar)
- `app/(tenant)` → Futuro panel por sucursal
- `app/(superadmin)` → Futuro panel superadmin

## Providers globales
- `app/layout.tsx` envuelve todo en `<Providers>` (`app/providers.tsx`)
- `Providers` monta `QueryClientProvider` con `staleTime: 60_000` y los devtools de React Query
- Tocá ese archivo si necesitás cambiar la config global de cache/React Query

## Paleta de colores
- Base: blanco / gris (`gray-50`, `gray-100`, `gray-200`)
- Acento principal: violeta (`violet-600`)
- Acento secundario: rosa/magenta (`pink-500`) — usado en badges de descuento
- Texto principal: `gray-900`
- Texto secundario: `gray-500`

## Tipografía
- Space Grotesk (Google Fonts) — aplicada en `app/layout.tsx` via `next/font/google`

## shadcn/ui (`components.json`)
- `style: radix-nova`
- `baseColor: neutral`
- `iconLibrary: lucide`
- Aliases: `ui → @/components/ui`, `utils → @/lib/utils`, `hooks → @/hooks`
- Agregar componentes con `npx shadcn@latest add <componente>`

## Archivos clave
- `docs/api-contract.md` — **Contrato del backend. Leerlo antes de tocar cualquier llamada a la API.**
- `docs/api-changelog.md` — Qué cambió en el backend, fase por fase. **Mirar la sección "cambios que rompen" cuando aparezca una entrada nueva.**
- `lib/api.ts` — Cliente HTTP: tokens, refresh serializado, `ApiError`. Toda llamada pasa por acá
- `types/index.ts` — Tipos TypeScript. La sección de arriba espeja el backend; la de abajo es provisoria
- `services/auth.ts` — Llamadas a `/auth/*`
- `features/auth/hooks/useAuth.ts` — `useSession`, `useLogin`, `useRegister`, `useLogout`, `canManage`
- `features/auth/components/LoginForm.tsx` — Formulario de login
- `features/appointments/components/WeekCalendar.tsx` — Calendario semanal
- `features/appointments/data/mockData.ts` — Datos de prueba hasta que exista la Fase 5
- `hooks/` — carpeta de hooks compartidos (vacía por ahora, scaffolding)

## Backend — `../agendapp-api`
NestJS 11 + Prisma 7 + Postgres. **Es la fuente de verdad**: si el front y el backend
no coinciden, se cambia el front.

- **Corriendo en `http://localhost:3001`** (`NEXT_PUBLIC_API_URL`). Swagger en `/api`, spec en `/api-json`
- **Disponible hoy (37 endpoints):** `/auth` (6), `/tenants` (6), `/branches` (11), `/employees` (13), `/health`
- **Todavía no existe:** servicios (Fase 3), clientes (Fase 4), **turnos y disponibilidad (Fase 5)**, pagos (Fase 6), portal público (Fase 7)
- Levantarlo: `docker compose up -d && npm run seed:demo && npm run start:dev` desde `../agendapp-api`
- Usuario de demo: `dueno@demo.test` / `demo1234`

**Tres cosas que rompen si no se saben** (el detalle está en `docs/api-contract.md`):
1. El login devuelve **solo tokens**; los datos del usuario salen de `GET /auth/me`, que responde `{ user, tenant, employee }`
2. El refresh token **rota en cada uso** y reusar uno viejo revoca la sesión entera. Nunca refrescar por fuera de `lib/api.ts`
3. El backend corre con `forbidNonWhitelisted`: **un campo de más en el body devuelve 400**. Mandar solo lo que se edita

No reemplazar el mock de la agenda hasta que exista la Fase 5.

## Convenciones
- Componentes interactivos (useState, eventos): agregar "use client" arriba
- Componentes sin interactividad: Server Components por defecto (sin directiva)
- Sin comentarios en el código salvo que el motivo sea no obvio
- Sin abstracciones prematuras — solo lo que el task requiere

## Git
- Rama principal: `main`
- Rama de desarrollo: `develop` (creada por Franco)
- Flujo: crear rama nueva por feature → PR → merge a develop
- Nunca trabajar directo en main

## Roles de usuario
`OWNER | PROFESSIONAL | ADMINISTRATIVE` — son **tres**, los del backend.

`SUPERADMIN`, `MANAGER` y `RECEPTIONIST` existían solo en el front y se
eliminaron: nunca estuvieron en el backend. `MANAGER` y `RECEPTIONIST` se
colapsan en `ADMINISTRATIVE`.

Escribir sucursales y empleados exige `OWNER` o `ADMINISTRATIVE`; un
`PROFESSIONAL` recibe 403. Usar `canManage(role)` de `features/auth/hooks/useAuth.ts`.

## Estado actual
- Landing page: completa, light theme, 3 planes de pricing con descuentos
- **Login: integrado con el backend real** (tokens + refresh con rotación + `/auth/me`)
- Dashboard: página de bienvenida básica
- Agenda: calendario semanal con mock data (Fase 5 del backend pendiente)

**Próximo paso natural:** las pantallas de Equipo y Configuración, que ya tienen
backend completo (`/employees`, `/branches`, `/tenants`). Falta también un guard
de rutas: hoy `/dashboard` no verifica sesión.
