# reservApp — Contexto del proyecto

SaaS de gestión de turnos para estéticas y centros de belleza. Mercado objetivo: Argentina (y futuro LATAM).

## Stack
- Next.js App Router (v15)
- React 19
- TypeScript
- Tailwind CSS v4
- @tanstack/react-query v5
- Lucide React (iconos)

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

## Paleta de colores
- Base: blanco / gris (`gray-50`, `gray-100`, `gray-200`)
- Acento principal: violeta (`violet-600`)
- Acento secundario: rosa/magenta (`pink-500`) — usado en badges de descuento
- Texto principal: `gray-900`
- Texto secundario: `gray-500`

## Tipografía
- Space Grotesk (Google Fonts) — aplicada en `app/layout.tsx` via `next/font/google`

## Archivos clave
- `types/index.ts` — Todos los tipos TypeScript (User, Appointment, Professional, etc.)
- `services/auth.ts` — Llamadas al backend (login, getMe). URL base: `NEXT_PUBLIC_API_URL`
- `features/auth/hooks/useAuth.ts` — useLogin, useLogout, getStoredToken, getStoredUser
- `features/auth/components/LoginForm.tsx` — Formulario de login
- `features/appointments/components/WeekCalendar.tsx` — Calendario semanal
- `features/appointments/data/mockData.ts` — Datos de prueba hasta que haya backend

## Backend
- Aún no desarrollado (lo hace Franco, hermano de Fabio)
- Cuando esté listo: ajustar `types/index.ts`, `services/auth.ts` y `features/auth/hooks/useAuth.ts`
- No reemplazar mock data hasta que existan los endpoints reales

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
SUPERADMIN | OWNER | MANAGER | RECEPTIONIST | PROFESSIONAL

## Estado actual
- Landing page: completa, light theme, 3 planes de pricing con descuentos
- Login: completo (hardcodeado, sin backend real)
- Dashboard: página de bienvenida básica
- Agenda: calendario semanal con mock data
- Backend: pendiente (Franco)
