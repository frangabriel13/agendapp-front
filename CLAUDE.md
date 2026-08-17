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
| `/dashboard` | **Mitad real.** Equipo y ausencias salen de la API; los turnos siguen en mock |
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

## El chasis del panel
El panel **flota sobre un fondo tintado**, igual que el landing: el riel, la barra
y las tarjetas son superficies blancas separadas por aire.

`app/(admin)/layout.tsx` arma tres piezas, cada una en `app/(admin)/ui/`:
- **`IconRail`** — el menú: **un panel blanco de alto completo**, con la misma
  superficie que el header del landing (`bg-white/80` + `backdrop-blur` + borde
  tenue + sombra corta), puesta de canto. Adentro van la marca, las secciones y
  el engranaje: son ítems de un panel, no botones sueltos sobre el fondo.
  Solo íconos, así que hacen falta dos cosas que no son opcionales: `aria-label`
  en cada uno y una etiqueta que aparece al pasar el mouse **o al llegar con el
  teclado** (`group-focus-visible`). Abajo de todo va `AccountMenu`
- **`MobileBar`** — **en todas las pantallas**, solo debajo de `lg`: el botón de
  menú, en qué sección estás y la cuenta. Ahí el riel está oculto, así que sin
  esta barra no habría forma de navegar ni de cerrar sesión
- **`TopBar`** — **solo en `/dashboard`**, y solo de `lg` para arriba: el nombre
  del negocio, la fecha, las caras del equipo y "Nuevo turno". Es contexto del
  tablero, no chrome de la aplicación; el resto de las pantallas trae su propio
  encabezado con `PageHeader`. **No repite el menú del riel**: dos navegaciones
  para las mismas cinco pantallas confunden más de lo que ayudan
- **`AccountMenu`** — el avatar y su menú (Configuración, Cerrar sesión). Vive en
  el riel y en `MobileBar`, **nunca en `TopBar`**: cerrar sesión tiene que poder
  hacerse desde cualquier pantalla, y esa barra solo existe en Inicio
- **`nav.ts`** — las secciones. Las leen el riel, el cajón del teléfono y el
  título de `MobileBar`: tienen que decir lo mismo

El fondo del shell es `bg-neutral-200` y no algo más claro: contra el blanco de
las tarjetas, `neutral-100` deja 4% de diferencia y el riel desaparece.

El shell usa `h-screen` (no `min-h-screen`) y marca su raíz con `data-app-shell`.
El contenido scrollea dentro de `main`; el riel y la barra quedan quietos.
`globals.css` además bloquea el scroll del documento con
`html:has([data-app-shell])`, por si algo se escapa del shell.

Debajo de `lg` el riel se esconde y el menú vuelve a tener texto, en el cajón
(`components/ui/sheet.tsx`) que abre el botón de la barra.

Las páginas van envueltas en `<Page>` (`app/(admin)/ui/Page.tsx`), que elige ancho
y padding: `narrow` / `default` / `wide` centran la columna, `full` ocupa todo —es
lo que usa el tablero, porque un calendario de catorce columnas dentro de una
columna centrada se aprieta al pedo—. `<PageHeader>` está para las pantallas que
necesitan título propio; **el tablero no lo usa**: la barra de arriba ya dice en
qué sección estás, y el título grande es el de la tarjeta principal
(`<PanelHeader size="lg">`).

## El dashboard
`app/(admin)/dashboard/page.tsx` solo compone; cada bloque vive en
`features/dashboard/`:

| Bloque | Datos |
|---|---|
| `StatTiles` | Turnos de hoy y facturación — **mock** |
| `AbsenceTimeline` | Equipo y ausencias — **API real** |
| `UpcomingAppointments` | La jornada, con el próximo turno destacado — **mock** |
| `TeamCard` | Equipo, ordenado por lo que hay que hacer — **API real** |
| `QuickActions` | Saludo, atajos y estado de la suscripción — **API real** |

El chip "Turnos de ejemplo" del encabezado avisa qué parte todavía no es real.

**El calendario de ausencias** (`features/dashboard/lib/timeline.ts`, con tests):
- La ventana son 14 días **a partir del lunes** de la semana actual, y se fija al
  montar. Recalcularla en cada render correría el calendario al cruzar la medianoche
- Trabaja sobre **días de calendario**, no instantes: una ausencia de dos horas
  ocupa la columna de su día igual que una de dos semanas ocupa catorce
- Lo que cruza el borde de la ventana se recorta y se dibuja con el borde recto
  de ese lado (`continuesBefore` / `continuesAfter`)
- Dos ausencias superpuestas de la misma persona van a filas distintas (`lane`)
- El ancho de la columna de nombres es la variable CSS `--tl-name`, no una
  constante de JS: la comparten el encabezado, las filas y la línea de hoy, y
  además cambia por breakpoint
- Las ausencias se piden **de a una persona** (`useTeamTimeOff`, N pedidos en
  paralelo): la API no tiene un endpoint por tenant. Comparte `queryKey` con
  `useTimeOff`, así guardar una ausencia refresca el diálogo y el panel juntos

## Responsive
Verificado en 390 / 768 / 1024 / 1440, landing y panel. El sidebar del panel se
esconde por debajo de `lg` y pasa a un cajón (`components/ui/sheet.tsx`), con una
barra superior que trae el botón de menú. El cajón lo cierra Radix al navegar
—los enlaces llaman a `onNavigate`— y con Escape.

El layout del panel usa `h-screen` y no `min-h-screen`: le da altura definida a la
columna, que es lo que necesita la agenda para ocupar el alto restante con
`h-full` y scrollear adentro en vez de estirar la página.

## Diseño — un solo vocabulario

Todo el front usa el mismo sistema. Si aparece un `gray-*` o un `rounded-md` en
código nuevo, está mal copiado de algún lado:

- Grises `neutral-*`, acento `violet-600`, bordes `black/[0.06]` (o `black/10` en controles)
- Botones **píldora** desde `cta()`; el primario es **negro** (`neutral-900`), no violeta
- Tarjetas `rounded-2xl`, controles `rounded-xl`, sombra corta
- Space Grotesk, títulos `font-semibold tracking-tight`

**Compartidos, usalos en vez de repetir clases:**
- `components/surface.ts` — `cardSurface`, la superficie de **toda** tarjeta.
  Vive fuera de `(marketing)` y `(admin)` para que los dos lados no se separen
- `components/CtaLink.tsx` — `CtaLink` para enlaces y `cta()` para `<button>`
- `components/Panel.tsx` — `Panel`, `PanelHeader`, `PanelLink` y `pillClasses` /
  `pillLinkClasses`: la tarjeta del panel y las píldoras de su barra
- `components/form.ts` — `controlClasses`, `control(error)`, `selectClasses`, `selectControl(error)`
- `components/Glow.tsx` — halos de fondo
- `lib/format.ts` — `formatPrice`
- `lib/time.ts` — `dateToStr` / `parseCalendarDay` y las cuentas de "HH:MM"
- `features/employees/lib/palette.ts` — `personColor(id)`, color estable por persona
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
- `tsconfig` sin `noUncheckedIndexedAccess`
- `/registro` y `/olvide-contrasena` siguen siendo carteles de "próximamente"
- `/dashboard` y `/agenda` corren sobre `mockData`: el backend no tiene turnos todavía
- `formatPrice` tiene la moneda fija en ARS; debería salir de `tenant.currency`
- `useTeamTimeOff` hace N pedidos (uno por empleado) porque la API no expone las
  ausencias del tenant juntas. Alcanza para los planes actuales

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
8. ~~Rediseño del dashboard~~ ✅ hecho — calendario de ausencias real + bento
