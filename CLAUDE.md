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
- react-hook-form + zod (instalados, todavía sin usar)
- Vitest (tests) · Playwright + Chromium (revisión visual)

## Comandos
- `npm run dev` — servidor de desarrollo en `http://localhost:3000`
- `npm run build` — build de producción
- `npm run start` — servir el build de producción
- `npm run lint` — ESLint
- `npm test` — Vitest, una corrida
- `npm run test:watch` — Vitest en watch
- `npm run types:api` — regenera `lib/api-types.ts` desde el backend corriendo

## Imports / alias
- `@/*` → raíz del repo (ej: `@/types`, `@/lib/utils`, `@/components/ui/button`)
- Configurado en `tsconfig.json` (`paths`)

## Rutas
| Ruta | Estado |
|---|---|
| `/` | Landing pública, terminada |
| `/login` | **Integrado con el backend real** |
| `/registro` | Placeholder ("próximamente"), deriva a `/#contacto` |
| `/olvide-contrasena` | Placeholder, deriva a `/#contacto` |
| `/activar` | **Real.** Cierra la invitación: token del link + contraseña. Pública |
| `/equipo` | **Real y completo.** Listar, invitar, rol, alta/baja, sucursales, horarios y ausencias |
| `/dashboard` | Construida, sobre mock data |
| `/agenda` | Calendario semanal, sobre mock data |
| `/sucursales` | **Real.** ABM, horarios comerciales, feriados y días especiales |
| `/configuracion` | **Real.** Negocio, marca, política de reservas y datos del plan |

## Grupos de rutas
- `app/(marketing)` → landing pública
- `app/(auth)` → login / registro / recuperar contraseña
- `app/(admin)` → panel con sidebar, protegido por guard de sesión
- `app/(tenant)` → solo tiene un layout, sin páginas todavía
- `app/api/` → vacía

## Providers globales
- `app/layout.tsx` envuelve todo en `<Providers>` (`app/providers.tsx`)
- `Providers` monta `QueryClientProvider` con `staleTime: 60_000` y los devtools de React Query
- Tocá ese archivo si necesitás cambiar la config global de cache/React Query

## Diseño — un solo vocabulario

Todo el front usa el mismo sistema. Si aparece un `gray-*` o un `rounded-md` en
código nuevo, está mal copiado de algún lado:

- Grises `neutral-*`, acento `violet-600`, bordes `black/[0.06]` (o `black/10` en controles)
- Botones **píldora** desde `cta()`; el primario es **negro** (`neutral-900`), no violeta
- Tarjetas `rounded-2xl`, controles `rounded-xl`, sombra corta
- Space Grotesk, títulos `font-semibold tracking-tight`

**Compartidos, usalos en vez de repetir clases:**
- `components/CtaLink.tsx` — `CtaLink` para enlaces y `cta()` para `<button>`
- `components/form.ts` — `controlClasses` y `control(error)` para inputs
- `components/Glow.tsx` — halos de fondo
- `lib/format.ts` — `formatPrice`
- `app/(marketing)/ui/` — `Section`, `SectionHeading`, `Badge`, `Card`, `TopBackdrop`, `GradientBand`

`components/ui/` es lo que genera shadcn y sigue sus propias convenciones: ahí sí
aparecen `rounded-md` y tokens propios. No migrarlo a mano.

Los halos necesitan `relative isolate` en el ancestro, y `overflow-x-clip` (nunca
`overflow-x-hidden`, que rompe el `sticky` del nav) en el contenedor de página.

## Tests
- Vitest, sin jsdom: los tests corren en Node contra un server real de `node:http`
- `lib/api.test.ts` — timeouts, refresh, sesión caída, 401 concurrentes
- `lib/api.crosstab.test.ts` — la carrera entre pestañas, con dos instancias del módulo
- `lib/errors.test.ts` — formateo de `ApiError`
- `features/appointments/lib/week.test.ts` — semana y layout de turnos superpuestos
- `features/employees/lib/schedule.test.ts` — tramos de trabajo y solapamientos
- `features/employees/lib/timeOff.test.ts` — ausencias: hora de pared vs instante
- `features/branches/lib/businessHours.test.ts` — semana comercial y el `null` que rompe
- `features/branches/lib/specialDays.test.ts` — feriados y la trampa UTC
- Convención: al arreglar un bug, mutá el arreglo y confirmá que el test falla.
  Un test que no falla al romper el código no está probando nada.

Playwright con Chromium está instalado para revisar cambios visuales (capturas por
ancho de pantalla). No hay script commiteado todavía.

## shadcn/ui (`components.json`)
- `style: radix-nova`, `baseColor: neutral`, `iconLibrary: lucide`
- Aliases: `ui → @/components/ui`, `utils → @/lib/utils`, `hooks → @/hooks`
- Agregar componentes con `npx shadcn@latest add <componente>`
- Ojo: el registro `form` viene vacío en `radix-nova`. El reemplazo es `field`

## Archivos clave
- `docs/api-contract.md` — **Contrato del backend. Leerlo antes de tocar cualquier llamada a la API.**
- `docs/api-changelog.md` — Qué cambió en el backend, fase por fase. **Mirar "cambios que rompen" cuando aparezca una entrada nueva.**
- `lib/api.ts` — Cliente HTTP: tokens, timeout, refresh serializado, `ApiError`. Toda llamada pasa por acá
- `lib/api-types.ts` — **Generado** desde el OpenAPI del backend. No editar a mano
- `types/index.ts` — Los tipos de arriba derivan de `lib/api-types.ts`, así un cambio
  del backend rompe el `tsc` en el lugar exacto. Los de abajo son provisorios (mock de agenda)
- `services/auth.ts` — Llamadas a `/auth/*`
- `features/auth/hooks/useAuth.ts` — `useSession`, `useHasToken`, `useLogin`, `useRegister`, `useLogout`, `canManage`
- `features/auth/components/` — `AuthCard` (cascarón), `AuthNotice` (aviso "próximamente"), `LoginForm`
- `features/appointments/lib/week.ts` — `getWeekDates` y `layoutDay`, con tests
- `features/appointments/data/mockData.ts` — Datos de prueba hasta que exista la Fase 5
- `app/(admin)/layout.tsx` — Sidebar **y guard de sesión**

## Backend — `../agendapp-api`
NestJS 11 + Prisma 7 + Postgres. **Es la fuente de verdad**: si el front y el backend
no coinciden, se cambia el front.

**El repo del backend está fuera de scope.** La info sale de `docs/api-contract.md` o
del `/api-json` del servicio corriendo, no de leer `../agendapp-api`.

- **Corriendo en `http://localhost:3001`** (`NEXT_PUBLIC_API_URL`). Swagger en `/api`, spec en `/api-json`
- **Disponible hoy:** `/auth`, `/tenants`, `/branches`, `/employees`, `/health`
- **Todavía no existe:** servicios (Fase 3), clientes (Fase 4), **turnos y disponibilidad (Fase 5)**, pagos (Fase 6), portal público (Fase 7)
- Levantarlo: `docker compose up -d && npm run seed:demo && npm run start:dev` desde `../agendapp-api`
- Usuario de demo: `dueno@demo.test` / `demo1234`

**Tres cosas que rompen si no se saben** (el detalle está en `docs/api-contract.md`):
1. El login devuelve **solo tokens**; los datos del usuario salen de `GET /auth/me`, que responde `{ user, tenant, employee }`
2. El refresh token **rota en cada uso** y reusar uno viejo revoca la sesión entera.
   Nunca refrescar por fuera de `lib/api.ts`, que lo serializa en dos niveles:
   `refreshInFlight` agrupa los pedidos de una misma pestaña, y un **Web Lock**
   (`navigator.locks`) coordina entre pestañas distintas. Al entrar al lock se
   vuelve a leer el token guardado: si otra pestaña ya refrescó, se usa el suyo.
   **Sin ese re-chequeo el lock no sirve de nada.** Ver `lib/api.crosstab.test.ts`
3. El backend corre con `forbidNonWhitelisted`: **un campo de más en el body devuelve 400**. Mandar solo lo que se edita

No reemplazar el mock de la agenda hasta que exista la Fase 5.

## Convenciones
- Componentes interactivos (useState, eventos): agregar "use client" arriba
- Componentes sin interactividad: Server Components por defecto (sin directiva)
- Comentarios solo cuando el **motivo** no es obvio. Explicar el porqué, no el qué
- Sin abstracciones prematuras — solo lo que el task requiere
- Los `<label>` van con `htmlFor`, y los errores atados por `aria-describedby`

## Git
- Rama principal: `main`
- Rama de desarrollo: `develop`
- Flujo: crear rama nueva por feature → PR → merge a develop
- Nunca trabajar directo en main
- **Los commits los hace Franco.** No commitear

## Roles de usuario
`OWNER | PROFESSIONAL | ADMINISTRATIVE` — son **tres**, los del backend.

`SUPERADMIN`, `MANAGER` y `RECEPTIONIST` existían solo en el front y se
eliminaron: nunca estuvieron en el backend. `MANAGER` y `RECEPTIONIST` se
colapsan en `ADMINISTRATIVE`.

Escribir sucursales y empleados exige `OWNER` o `ADMINISTRATIVE`; un
`PROFESSIONAL` recibe 403. Usar `canManage(role)` de `features/auth/hooks/useAuth.ts`.

## Deuda conocida
Relevada y no atendida todavía:
- 84 botones vacíos en la grilla de `WeekCalendar` (12 franjas × 7 días): tienen
  `aria-label`, pero son 84 paradas de tabulación
- `dashboard/page.tsx` podría ser Server Component (~3 KB menos y arregla un
  desajuste de hidratación latente)
- `next.config.ts` vacío; `tsconfig` sin `noUncheckedIndexedAccess`
- `/registro` y `/olvide-contrasena` siguen siendo carteles de "próximamente"
- `/dashboard` y `/agenda` corren sobre `mockData`: el backend no tiene turnos todavía
- `formatPrice` tiene la moneda fija en ARS; debería salir de `tenant.currency`

## Alta de empleados — el flujo completo
1. `POST /employees` da de alta sin contraseña y devuelve un `activationUrl`
2. Ese link **se muestra una sola vez**. Para recuperarlo hay que reenviar la
   invitación (`POST /employees/:id/invitation`), que emite otro e invalida el anterior
3. El invitado abre `/activar?token=…`, elige contraseña y el front postea a
   `POST /employees/activate` — el único endpoint público de `/employees`

La regla de contraseña vive en `validateNewPassword`; el schema de zod de `/activar`
la reusa con un `superRefine` en vez de reescribirla, para que no se desincronice.

## Horarios de empleado — tres cosas que rompen
1. `PUT /employees/:id/branches` y `/schedules` **reemplazan todo**: se manda cómo
   queda, no lo que cambió. Mandar `[]` vacía
2. **Las sucursales se guardan primero.** Un tramo apunta a una `branchId`; si esa
   sucursal no está asignada todavía, el PUT de horarios da 400. Ver `useSaveSchedule`
3. `EmployeeShiftResponseDto` trae `id` y `EmployeeShiftDto` no. Reenviar un tramo
   leído sin sacarle el `id` es un 400 por `forbidNonWhitelisted`. Lo resuelve `toPayload`

Horas de tramo en reloj (`"09:00"`); las ausencias, en cambio, van en ISO con zona.
`dayOfWeek` es 0 = domingo, como `Date.getDay()` — `WEEK_DAYS` en
`features/employees/lib/schedule.ts` lo reordena para mostrar lunes primero.

**Ausencias** (`features/employees/lib/timeOff.ts`): la persona escribe hora de pared
y la API guarda un instante, así que la conversión pasa por `new Date(y, m, d, …)`,
que interpreta en la zona del navegador. **No hay campo `allDay` en la API**: un día
completo se guarda de 00:00 a 23:59 locales y se deduce al releerlo (`isAllDay`).
`branchId: null` = ausente en todas.

## Horarios comerciales y días especiales — la trampa
`PUT /branches/:id/business-hours` espera **los 7 días envueltos en `{ days }`**, y
un día cerrado va **sin `opensAt`/`closesAt`**. En la lectura esos campos vienen en
`null`, pero mandar `null` al escribir es un 400. Lo resuelve `toPayload` en
`features/branches/lib/businessHours.ts`; lo mismo aplica a los días especiales.

El plan limita sucursales y empleados: crear de más devuelve 403 con un mensaje ya
redactado por el backend, que se muestra tal cual.

## Mutaciones: usar `mutate`, no `await mutateAsync`
Un `mutateAsync` rechazado dentro de un handler escapa y el navegador lo reporta
como **error de página**, aunque el hook ya lo haya mostrado en un toast. Eso
dispararía cualquier herramienta de monitoreo por un error de usuario normal
—superar el tope del plan, por ejemplo—. Va `mutate(payload, { onSuccess })`.

## Tests: zona horaria fijada
`vitest.config.mts` fuerza `TZ=America/Argentina/Buenos_Aires`. No es cosmético:
en UTC, `new Date("2026-12-25")` devuelve el día correcto y el bug de interpretar
un día de calendario como UTC **pasa desapercibido**. Con offset negativo retrocede
al 24 y el test lo agarra.

## Próximo paso
Acordado con Franco, en orden:
1. ~~Arreglos baratos: labels, `global-error`, logo, metadata~~ ✅ hecho
2. ~~**`/equipo`** con react-hook-form + zod, más `/activar`~~ ✅ hecho
3. ~~Sucursales y horarios del empleado~~ ✅ hecho
4. ~~Ausencias (`/employees/:id/time-off`)~~ ✅ hecho — `/equipo` quedó completo
5. ~~`/configuracion` y el ABM de sucursales~~ ✅ hecho — **22 de 23 endpoints cableados** (falta solo `/health`, que no hace falta)
6. ~~La carrera de refresh entre pestañas~~ ✅ hecho
7. ~~Migrar el panel al vocabulario nuevo~~ ✅ hecho
