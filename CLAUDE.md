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
| `/reportes` | Facturación del mes, por servicio y por profesional — sobre mock |
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
- **`TopBar`** — **solo en `/dashboard`**, y solo de `lg` para arriba. Va
  **adentro de `main`**, no arriba: scrollea con el contenido en vez de quedar
  clavada. El envoltorio que la acompaña se monta solo cuando hay barra —la
  agenda usa `h-full` contra `main` y un div de más en el medio le rompe el
  alto—. Trae el nombre
  del negocio, la fecha, las caras del equipo, "Nuevo turno", la cuenta y la
  campanita. Es contexto del tablero, no chrome de la aplicación; el resto de las
  pantallas trae su propio encabezado con `PageHeader`. **No repite el menú del
  riel**: dos navegaciones para las mismas cinco pantallas confunden más de lo
  que ayudan.
  La campanita **no tiene sistema atrás todavía**: por eso no lleva puntito de
  "sin leer" —sería inventar un número que nadie midió— y abre un panel que
  aclara que no hay nada. Cuando exista el endpoint, se cambia solo ese panel
- **`AccountMenu`** — el avatar y su menú (Configuración, Cerrar sesión). Está
  **siempre** al pie del riel, y además en `TopBar` (Inicio) y en `MobileBar`.
  En Inicio queda duplicado mientras estás arriba de todo, y es a propósito: la
  barra scrollea, así que si la cuenta viviera solo ahí, cerrar sesión pediría
  volver al tope de la página
- **`nav.ts`** — las secciones. Las leen el riel, el cajón del teléfono y el
  título de `MobileBar`: tienen que decir lo mismo

El fondo del shell es `bg-neutral-200` y no algo más claro: contra el blanco de
las tarjetas, `neutral-100` deja 4% de diferencia y el riel desaparece.

`main` lleva `.scrollbar-none` (definida en `globals.css`): scrollea igual pero
sin barra a la vista. **El scroll horizontal del calendario sí la conserva**: el
vertical se descubre solo con la rueda, el lateral no.

El shell usa `h-screen` (no `min-h-screen`) y marca su raíz con `data-app-shell`.
El contenido scrollea dentro de `main`; el riel y la barra quedan quietos.
`globals.css` además bloquea el scroll del documento con
`html:has([data-app-shell])`, por si algo se escapa del shell.

Debajo de `lg` el riel se esconde y el menú vuelve a tener texto, en el cajón
(`components/ui/sheet.tsx`) que abre el botón de la barra.

**Un solo valor de aire: `3` (12px).** El `p` y el `gap` del shell, el `gap` entre
la barra y el contenido, y el `gap` entre tarjetas son todos el mismo. Si aparece
un `gap-2.5` o un `p-2` suelto en el chasis, está mal: se ven tres anchos
distintos y el contenido deja de alinear con la barra.

Las páginas van envueltas en `<Page>` (`app/(admin)/ui/Page.tsx`), que elige ancho
y padding: `narrow` / `default` / `wide` centran la columna, `full` ocupa todo y
**no trae padding propio** —es lo que usa el tablero, porque un calendario de
catorce columnas dentro de una columna centrada se aprieta al pedo, y porque el
padding lo pone el shell: así las tarjetas alinean al pixel con la barra—. `<PageHeader>` está para las pantallas que
necesitan título propio; **el tablero no lo usa**: la barra de arriba ya dice en
qué sección estás, y el título grande es el de la tarjeta principal
(`<PanelHeader size="lg">`).

## El dashboard
`app/(admin)/dashboard/page.tsx` solo compone; cada bloque vive en
`features/dashboard/`:

| Bloque | Datos |
|---|---|
| `TeamAvailability` | Equipo, ausencias y horarios **reales**; los turnos que ocupan, **mock** |
| `UpcomingAppointments` | La jornada, con el próximo turno destacado — **mock** |
| `TeamCard` | Equipo, ordenado por lo que hay que hacer — **API real** |
| `RevenueCard` | Tres cortes de plata: el mes, lo que va de la semana y hoy — **mock** |

**El tablero llena la pantalla.** El envoltorio de `main` es `min-h-full`, el
calendario conserva su alto (`shrink-0`) y la grilla de las tres tarjetas se
queda con lo que sobra (`flex-1`). Así llegan hasta abajo en vez de dejar un
vacío. Cuando el contenido pasa el alto visible —un equipo grande, un teléfono—
no aprieta nada: ahí no sobra alto, `min-height: auto` frena la compresión y
`main` scrollea.

**No hay fila de KPIs, y es a propósito.** Había cuatro —turnos de hoy,
confirmados, pendientes, facturación— y se sacaron: tres eran el conteo de una
lista que ya se ve entera en `UpcomingAppointments`, justo abajo. Un número
arriba se gana el lugar cuando dice algo que el detalle no puede: una comparación
contra la semana pasada, plata, o algo accionable. Si vuelven con la Fase 5, que
sea con eso.

**El calendario de disponibilidad** (`TeamAvailability`, con
`lib/timeline.ts` y `lib/availability.ts`, los dos con tests). Cada celda dice
en una palabra qué tiene esa persona ese día: **Vacía**, **Disponible**,
**Llena**, **No trabaja**, **Sin horario** — o una barra de ausencia encima.
Palabra y no un número de turnos: lo que se decide mirando esto es "¿a quién le
doy este turno?", y para eso "Disponible" contesta mientras que "3" obliga a
saber cuántas horas trabaja esa persona para interpretarlo. Reglas:

- **`sin-horario` no es `no-trabaja`.** El primero dice que nadie le cargó los
  horarios —es una tarea pendiente—; el segundo, que ese día no le toca.
  Confundirlos haría que un equipo a medio configurar se viera como uno que no
  trabaja nunca
- "Llena" no es "sin un minuto libre": con menos del 15% del día suelto no entra
  ningún servicio real. **Cuando el front consuma los servicios de la Fase 3, la
  regla buena es "no entra ni el más corto"** y esa constante se va
- Los turnos cancelados no ocupan —ese lugar volvió a estar libre—; los "no
  asistió" sí, porque nadie más pudo tomar ese horario
- Los horarios se piden **de a una persona** (`useTeamSchedules`), igual que las
  ausencias, y comparten `queryKey` con `useEmployeeSchedules`
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
- **Hoy se marca con el borde, no con el relleno.** Relleno violeta significa
  "tiene un turno"; pintar igual un día libre decía lo contrario de lo que pasa
- La leyenda está arriba de la grilla y no en un tooltip: sin ella, un tablero
  de celdas de colores hay que descifrarlo, y nadie lo hace
- **`features/dashboard/lib/roster.ts` es un puente temporal que se borra con la
  Fase 5.** Los turnos de ejemplo traen ids de profesionales inventados (`p1`,
  `p2`…) que no existen en la API, así que se reparten por posición entre
  quienes atienden —un `ADMINISTRATIVE` no atiende, pero sí falta, así que tiene
  fila sin carga—. Cuando el backend exponga turnos, `professionalId` va a ser el
  id del empleado y esto pasa a ser un `filter` directo

## Reportes y facturación
Las cuentas viven en `features/reports/lib/revenue.ts`, con tests, y **no** en las
páginas: hoy los turnos salen de `mockData` y mañana de la API, y la cuenta es la
misma. Reglas que no son obvias:

- Suman **`completed`** (ya se atendió) y **`confirmed`** (agendado y en pie).
  `pending` queda **afuera del total** y se muestra aparte: todavía puede no
  confirmarse. `cancelled` y `no_show` no existen para la plata
- Por eso la tarjeta del tablero muestra dos números y no uno: "facturación" a
  secas mezcla lo hecho con lo prometido
- En los cortes (`revenueByService`, `revenueByProfessional`) el `share` se mide
  **contra el total del corte**, no contra el más grande: una barra llena
  significa "se lleva todo", no "es el mayor de la lista"
- Empate en plata, desempata alfabético: si no, las filas bailan entre renders

**`monthOutlook` es lo que alimenta la tarjeta del tablero.** Tres decisiones que
parecen detalles y no lo son:
- **Compara contra el mismo tramo del mes anterior, no contra su cierre.** Medir
  18 días contra 31 hace que el negocio parezca en caída todos los meses hasta el
  día 30
- **La proyección no extrapola a ciegas.** Una estética sabe parte de su futuro:
  los turnos del resto del mes ya están agendados. Solo se estiman los días que
  quedan **sin nada agendado**, al ritmo de lo que va del mes. Los días que ya
  tienen turnos no se estiman: su plata ya está contada
- **`null` no es cero.** Sin registro del mes anterior devuelve `null` y la
  tarjeta dice "sin registro": un "$0" ahí afirmaría que el negocio no facturó,
  cuando lo que pasa es que todavía no usaba la app. Lo mismo con la variación
  cuando la base es cero: no es "creció infinito", es que no se puede medir
- Antes del día 5 la proyección viene marcada `preliminar`: con dos jornadas de
  datos el número no dice nada y no hay que dejar que parezca que sí
- `weekToDateRevenue` corta **en hoy**, no el domingo: es "lo que va" de la
  semana, no "lo que va a haber". Los turnos ya agendados para el jueves son
  plata que todavía no entró, y sumarlos haría que el número creciera solo por
  reservar. La semana arranca el lunes, igual que la agenda y el calendario

**`RevenueCard` no muestra ni la proyección ni el cierre del mes anterior**, y
las dos ausencias son a propósito. La proyección es un cálculo sobre un cálculo.
Y el mes anterior ya está en el chip de variación, que es la forma útil de ese
dato —cuánto mejor o peor vas— y no un número suelto que hay que restar de
cabeza. `monthOutlook` sigue calculando los dos y están testeados.

Los dos cuadros de abajo van a dos columnas en todos los anchos, sin breakpoint:
con solo dos hay lugar de sobra hasta en un teléfono. Verificado de 390 a 1920
buscando texto recortado, que es donde esto se rompe.

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
- `features/appointments/data/mockData.ts` — Datos de prueba hasta que exista la Fase 5.
  Trae **el mes en curso y el anterior**, no solo hoy: sin historial, la tarjeta de
  facturación y `/reportes` quedan vacías y no se puede ni mirar cómo se ven.
  **Las fechas se generan relativas a hoy**, nunca escritas a mano: un mock con
  fechas fijas envejece y al mes siguiente el "mes en curso" vuelve a estar vacío.
  Los días se recortan al largo real de cada mes —si no, un 30 en febrero lo
  normaliza `Date` al 2 de marzo y el turno se va de mes—. Y son **contiguos,
  todos menos los domingos**: con una lista salteada, el corte "lo que va de la
  semana" caía en una semana sin turnos según qué día fuera hoy y mostraba lo
  mismo que "hoy", como si estuviera roto
- `app/(admin)/layout.tsx` — Sidebar **y guard de sesión**

## Backend — `../agendapp-api`
NestJS 11 + Prisma 7 + Postgres. **Es la fuente de verdad**: si el front y el backend
no coinciden, se cambia el front.

**El repo del backend está fuera de scope.** La info sale de `docs/api-contract.md` o
del `/api-json` del servicio corriendo, no de leer `../agendapp-api`.

- **Corriendo en `http://localhost:3001`** (`NEXT_PUBLIC_API_URL`). Swagger en `/api`, spec en `/api-json`
- **Disponible hoy:** `/auth`, `/tenants`, `/branches`, `/employees`, `/service-categories`, `/services`, `/resources`, `/health`
- **Todavía no existe:** clientes (Fase 4), **turnos y disponibilidad (Fase 5)**, pagos (Fase 6), portal público (Fase 7)
- **Catálogo (Fase 3, nuevo):** precios en **centavos** (`priceCents`); un servicio se presta por par `(empleado, sucursal)`, no solo por empleado; los recursos son feature de plan. Detalle en `docs/api-changelog.md`
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
