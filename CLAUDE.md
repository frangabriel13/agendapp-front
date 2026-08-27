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
| `/olvide-contrasena` | **Real.** Pide el mail de recuperación. Pública |
| `/restablecer?token=` | **Real.** Contraseña nueva con el token del mail. Pública |
| `/verificar-email?token=` | **Real.** Confirma la dirección sola al abrirse. Pública |
| `/activar` | **Real.** Cierra la invitación: token del link + contraseña. Pública |
| `/equipo` | **Real y completo.** Listar, invitar, rol, alta/baja, sucursales, horarios y ausencias |
| `/dashboard` | **Real.** Equipo, ausencias y turnos salen de la API |
| `/agenda` | **Real.** Resumen de la semana, tablero del día y calendario en mes/semana/día. Agenda turnos |
| `/reportes` | **Real.** Lo agendado del mes, por servicio y por profesional, más los cobros del día |
| `/servicios` | **Real.** Catálogo en tres solapas: servicios, categorías y recursos |
| `/clientes` | **Real.** Listado paginado, búsqueda, etiquetas y el duplicado de teléfono |
| `/sucursales` | **Real.** ABM, horarios comerciales, feriados y días especiales |
| `/configuracion` | **Real.** Negocio, marca, política de reservas y datos del plan |
| `/pago/exito` | **Real.** Vuelta del checkout. Pública, **la abre el cliente del negocio** |
| `/pago/pendiente` | **Real.** El pago quedó a la espera (efectivo, transferencia). Pública |
| `/pago/error` | **Real.** El pago no se concretó. Pública |
| `/suscripcion/exito` | **Real.** Vuelta del pago del mes. **Dentro del panel**: la abre el dueño |
| `/suscripcion/pendiente` | **Real.** El pago del mes quedó a la espera |
| `/suscripcion/error` | **Real.** El pago del mes no se concretó |

## Grupos de rutas
- `app/(marketing)` → landing pública
- `app/(auth)` → login / registro / recuperar contraseña
- `app/(admin)` → panel con sidebar, protegido por guard de sesión
- `app/(tenant)` → lo que abre **el cliente del negocio**, no el panel: hoy las tres
  vueltas del checkout (`/pago/*`), mañana el portal público de reservas
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
  clavada. El envoltorio que la acompaña se monta solo cuando hay barra: un div
  de más en el medio le rompe el alto a cualquier pantalla que mida contra
  `main`. Trae el nombre
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
| `TeamAvailability` | Equipo, ausencias, horarios y los turnos que ocupan — **API real** |
| `UpcomingAppointments` | La jornada, con el próximo turno destacado — **API real** |
| `TeamCard` | Equipo, ordenado por lo que hay que hacer — **API real** |
| `RevenueCard` | Tres cortes de plata: el mes, lo que va de la semana y hoy — **API real** |

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

**El calendario de disponibilidad** (`TeamAvailability`). La lógica está partida
en tres archivos, los tres con tests:

| Archivo | Qué contesta |
|---|---|
| `lib/timeline.ts` | Qué días entran en la ventana |
| `lib/availability.ts` | Qué tiene cada persona cada día |
| `lib/openDays.ts` | Qué días no abre el negocio |
| `lib/absenceKind.ts` | De qué es la ausencia |

Cada celda muestra **el horario de esa persona y una barra de ocupación**: la
carga a la izquierda, el tramo que se lleva una ausencia parcial en el color de
su tipo, gris lo que queda libre. Palabra no: el horario es dato duro y la barra
se lee de un vistazo.

**Dos escalas de color que no se pisan.** La *carga* es un semáforo —verde,
amarillo, rojo— y vive en la barrita de abajo de la celda. El *tipo de ausencia*
es una categoría, no un grado, y vive en las barras que cruzan la grilla:
naranja vacaciones, celeste licencia médica, violeta día libre, gris pizarra lo
que no se pudo clasificar. Naranja y amarillo son parientes, y aun así no se
confunden porque nunca comparten forma: el tipo pinta un bloque con texto, la
carga una línea de 4px.

Reglas que no son obvias:

- **El rayado gris sale de los horarios comerciales, no del fin de semana.** Un
  día se raya cuando **ninguna sucursal** abre — y los feriados y días especiales
  cuentan, con su nombre en el chip del día. `closedDays` devuelve vacío mientras
  los horarios cargan: rayar la quincena entera diría "no abrimos nunca" cuando
  lo que pasa es que todavía no llegó la respuesta
- **Una ausencia parcial no tapa el día.** `absenceMinutesByDay` mide cuánto se
  lleva la ausencia **del turno real de esa persona**: un permiso de 14 a 18 sobre
  una jornada de 10 a 19 se lleva 240 de 540 minutos, así que no es completa y se
  dibuja como tramo violeta dentro de la celda, **más el borde violeta**: el
  tramo mide 4px de alto y escaneando la grilla no se ve. Taparle el día diría
  que no vino, y atendió toda la mañana
- Por eso `layoutAbsences` arma las barras con los días **completos**, y una misma
  ausencia puede dar más de una barra —o ninguna—: la que arranca a las 14 del
  lunes y termina el miércoles tapa martes y miércoles, y deja el lunes como celda
- Un día que la persona no trabaja cuenta como completo: si no, unas vacaciones
  que cruzan el domingo se dibujarían partidas en dos
- Con dos tramos en un día se muestran **las puntas** (`09–20`), no el primero:
  "09–13" cuando se queda hasta las 20 es peor que no decir nada
- **`sin-horario` no es `no-trabaja`.** El primero es una tarea pendiente —nadie
  le cargó los horarios— y se dibuja punteado, apagado. El segundo es un dato
  cargado: ese día no le toca, y la celda va **pintada** con la palabra
  **"Franco"**. Un día que la persona no trabaja no es un hueco de información
- **El franco del horario y el "día libre" cargado como ausencia se llaman
  distinto a propósito.** El primero sale de los tramos semanales y dice
  "Franco"; el segundo es una ausencia puntual y su barra dice "Día libre". Son
  dos cosas distintas y llamarlas igual haría dudar de cuál se está mirando
- **El tipo de ausencia se adivina del texto, y es un puente.** `absenceKind`
  busca palabras clave en `reason` porque **la API no tiene campo de tipo**:
  `TimeOff` solo trae texto libre. Falla con lo que no está en la lista —"me voy
  a Brasil" cae en `otro`, barra gris con el texto tal cual— y eso es preferible
  a pintarlo de vacaciones adivinando. **Cuando el backend agregue el campo, ese
  archivo se borra entero**; por eso vive solo y es el único lugar del front que
  hace la suposición
- **La carga tiene tres escalones, no dos**: verde con lugar, amarillo
  `casi-llena` —queda tiempo, pero menos del 15% del día y no entra ningún
  servicio real— y rojo `llena`, que es no tener un solo minuto. Pintar los dos
  últimos igual escondía justo la diferencia que decide si vale la pena llamar a
  esa persona. **Cuando el front consuma los servicios de la Fase 3, el corte del
  amarillo pasa a ser "no entra ni el más corto"** y esa constante se va
- Los turnos cancelados no ocupan; los "no asistió" sí, porque nadie más pudo
  tomar ese horario
- **Hoy no se marca en la celda**: lo señala el chip violeta del encabezado, que
  ya distingue la columna entera. Dos violetas distintos en la misma grilla
  —"hoy" y "ausencia parcial"— hacían dudar de cuál era cuál
- La leyenda va arriba de la grilla y no en un tooltip
- Horarios, ausencias y calendarios de sucursal se piden **de a uno**
  (`useTeamSchedules`, `useTeamTimeOff`, `useBranchCalendars`): la API no los
  expone por tenant. Comparten `queryKey` con las pantallas que los editan, así
  guardar un horario en `/equipo` o `/sucursales` refresca el tablero
- **`lib/roster.ts` es un puente temporal que se borra con la Fase 5.** Los turnos
  de ejemplo traen ids de profesionales inventados que no existen en la API, así
  que se reparten por posición entre quienes atienden
- Las fotos son marcadores: `avatarUrl` existe en la API pero todavía no hay
  forma de subir una desde el panel. El aro del avatar lleva el color de la persona

## La agenda
`app/(admin)/agenda/page.tsx` compone **tres bandas**, cada una contestando una
pregunta distinta:

| Banda | Qué contesta | Componente |
|---|---|---|
| Resumen de la semana | Cómo viene | `WeekSummary` |
| Hoy por estado | Qué hay que hacer | `DayBoard` |
| Calendario | Cuándo es cada cosa | `AgendaCalendar` |

**Las dos primeras miran siempre la semana y el día en curso; el calendario se
mueve por su cuenta.** Si el resumen siguiera la navegación, los números
cambiarían debajo del mouse al pasar de semana para mirar algo.

Reglas que no son obvias:

- **El color del bloque dice quién atiende, no cómo viene el turno.** Son dos
  datos distintos y en una grilla de veinte bloques el color rinde mucho más
  identificando a la persona: si dijera el estado, una semana normal sería una
  pared verde con dos excepciones y no se podría seguir a nadie de una columna a
  otra. El estado va en el **relleno** (`blockLook` en `lib/tone.ts`): sólido
  confirmado, tinta clara y borde punteado a confirmar, apagado atendido, gris
  lo que no se hizo
- Los tonos salen del hexadecimal de la persona con `color-mix`, no de una
  paleta paralela: el color es un dato suyo y tiene que haber uno solo. Cuando
  salga de la API, `lib/tone.ts` no cambia
- **La barra al pie del bloque mide cuánto del turno ya transcurrió**, no
  progreso inventado: los días pasados llenos, el que está ocurriendo a medias,
  lo que viene vacío. Da de un vistazo dónde está parado el día
- **La vista mes mide contra el día más movido del mes, no contra un cupo.** La
  agenda no conoce los horarios del equipo —eso lo sabe el calendario de Inicio,
  que sí los pide a la API—, así que un "70% lleno" acá sería un número sin nada
  atrás. Por eso tampoco usa el semáforo verde/amarillo/rojo de Inicio: sería la
  misma escala diciendo otra cosa
- `cancelled` y `no_show` comparten la cuarta columna del tablero: las dos
  significan que el turno no se hizo, y separarlas daba una quinta columna casi
  siempre vacía. La ficha sigue diciendo cuál de las dos es
- **Un solo vocabulario**: los nombres de estado salen de `STATUS_LABELS` y
  `STATUS_PLURAL` (`lib/status.ts`), que también leen el modal y la lista de
  Inicio. `pending` es **"A confirmar"** y no "Pendiente" a propósito: nombra lo
  que hay que hacer con el turno, no el casillero en el que está
- `TimeGrid` es una sola grilla para semana y día —las dos son columnas de
  tiempo con distinta cabecera—; en la vista día la columna es la persona
- El alto de hora (`ALTO_HORA`) no es un número redondo por gusto: con menos, un
  turno de una hora no tiene lugar para el nombre y el servicio en líneas
  separadas y el texto queda cortado contra el borde. El bloque tiene **dos
  anatomías** y elige por alto y por ancho: con la columna partida en dos, el
  avatar y la duración no dejan lugar para el nombre, que es lo único que no se
  puede perder
- El scroll lateral vive dentro de `TimeGrid`, no en la página: en un teléfono la
  semana scrollea al costado y las tres bandas quedan quietas. Verificado de 390
  a 1920 en las tres vistas

Las cuentas viven en `lib/agenda.ts`, con tests: `weekStats`, `boardColumns`,
`elapsedFraction`, `monthCells`, `busiestDay`. La plata sale de `rangeBreakdown`
(`features/reports/lib/revenue.ts`) y no se recalcula acá: qué estado suma y cuál
no es una regla sola para toda la app.

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

El layout del panel usa `h-screen` y no `min-h-screen`: le da altura definida a
la columna, así el contenido scrollea dentro de `main` en vez de estirar la
página. **Ninguna pantalla mide contra `main` con `h-full` hoy**: el tablero y la
agenda son bandas apiladas que scrollean. Si alguna vuelve a hacerlo, mirar la
nota del envoltorio de `TopBar`.

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
- `lib/time.ts` — **La frontera instante ↔ hora de pared**, en la zona del negocio
  (`splitInstant`/`toInstant`/`businessNow`/`today`), más el par de días de
  calendario (`dateToStr`/`parseCalendarDay`), que sigue siendo local. Con tests
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
- `features/auth/utils/validators.test.ts` — email y la regla de contraseña que
  comparten `/activar` y `/restablecer`
- `features/appointments/lib/week.test.ts` — semana y layout de turnos superpuestos
- `features/catalog/lib/money.test.ts` — centavos, el round-trip por el input y la seña
- `features/catalog/lib/assignments.test.ts` — la grilla de (empleado, sucursal)
- `lib/pagination.test.ts` — la ventana de páginas, el rango y a dónde ir tras borrar
- `features/customers/lib/customer.test.ts` — nombre, iniciales y la edad sin UTC
- `features/appointments/lib/subscription.test.ts` — la ventana del aviso de deuda
- `features/appointments/lib/fixtures.ts` — **no es un test**: el molde de turnos
  que usan los demás, para no escribir veintipico de campos por caso
- `features/appointments/lib/agenda.test.ts` — números de la semana, tablero del día, grilla del mes
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
- `types/index.ts` — **Todo** deriva de `lib/api-types.ts`, así un cambio del backend
  rompe el `tsc` en el lugar exacto. Ya no queda nada provisorio: el mock murió en el punto 12
- `services/auth.ts` — Llamadas a `/auth/*`
- `features/auth/hooks/useAuth.ts` — `useSession`, `useHasToken`, `useLogin`, `useRegister`, `useLogout`, `canManage`
- `features/auth/components/` — `AuthCard` (cascarón), `AuthNotice` (aviso "próximamente"), `LoginForm`
- `components/ResultCard.tsx` — El desenlace de una pantalla sin panel: ícono, tono,
  título y salidas. **Nació como `AuthResult` en `features/auth` y se mudó**: ya lo
  usaba `features/employees`, y ahora también las vueltas del checkout, que las abre
  gente que no tiene sesión ni la va a tener
- `features/appointments/lib/week.ts` — `getWeekDates` y `layoutDay`, con tests
- `features/appointments/lib/agenda.ts` — las cuentas de la agenda, con tests
- `features/appointments/lib/tone.ts` — el color de la persona convertido en los
  cuatro rellenos del bloque
- `features/catalog/lib/money.ts` — **El único formateador de plata de la app**, y la
  única conversión centavos ↔ pesos. `formatPrice` se borró
- `features/payments/lib/balance.ts` — Qué decir con un saldo, qué cobro proponer y a
  qué turnos se les puede mover plata. Con tests
- `features/tenants/lib/subscription.ts` — El estado de la cuenta que el negocio le
  paga a reservApp, y si se puede pagar desde el panel. Con tests
- `features/appointments/lib/refund.ts` — Qué decir con la devolución que el backend
  calcula al cancelar. Con tests
- `features/appointments/lib/recurrence.ts` — Cómo se cuenta el resultado de una
  serie, salteadas incluidas. Con tests
- `lib/async.ts` — `mapLimit`: recorre una lista con tope de pedidos en vuelo.
  Existe por el throttle de 10 por segundo. Con tests
- `services/payments.ts` — Las tres llamadas de cobro
- `app/(admin)/layout.tsx` — Sidebar **y guard de sesión**

## Backend — `../agendapp-api`
NestJS 11 + Prisma 7 + Postgres. **Es la fuente de verdad**: si el front y el backend
no coinciden, se cambia el front.

**El repo del backend está fuera de scope.** La info sale de `docs/api-contract.md` o
del `/api-json` del servicio corriendo, no de leer `../agendapp-api`.

- **Corriendo en `http://localhost:3001`** (`NEXT_PUBLIC_API_URL`). Swagger en `/api`, spec en `/api-json`
- **Disponible hoy:** `/auth`, `/tenants`, `/branches`, `/employees`, `/service-categories`, `/services`, `/resources`, `/customers`, `/customer-tags`, `/appointments`, `/health`
- **Todavía no existe:** portal público (Fase 7). Del lado de pagos falta el débito automático y la devolución automática
- **Catálogo (Fase 3):** precios en **centavos** (`priceCents`); un servicio se presta por par `(empleado, sucursal)`, no solo por empleado; los recursos son feature de plan
- **Turnos (Fase 5, nuevo):** la agenda ya no necesita mock. `GET /appointments/availability` da los huecos libres con todo restado; `POST /appointments` acepta cualquier horario que **entre** en el tiempo libre (no hace falta un slot exacto). **El precio se congela al reservar**: mostrar `totalPriceCents` del turno, nunca el del servicio. **Un 409 al agendar es un caso normal** (alguien tomó el hueco primero), no un error a reintentar. Las series recurrentes **saltean** las fechas ocupadas y las devuelven en `skipped`. Detalle en `docs/api-changelog.md`
- **Clientes (Fase 4):** `Patient` ahora es **`Customer`** (el tipo provisorio se reemplaza). Dos formas nuevas que se repiten en las fases que vienen: `GET /customers` devuelve **`{ data, meta }`** paginado (primer endpoint así de la API), y un **error puede traer campos extra** — el 409 de `POST /customers` manda `existingCustomer` con la ficha ya cargada, para ofrecer "¿es esta persona?" en vez de un cartel rojo. El teléfono lo compara el backend normalizado: **no normalizar en el front**. Detalle en `docs/api-changelog.md`
- **Pagos (Fase 6):** los tres endpoints están cableados y las tres pantallas de retorno existen. Ver "Cobros — la plata va en dos tiempos" más abajo, que es donde quedaron las trampas
- **Suscripción del negocio (nuevo):** ⚠️ **`POST /appointments` y `/appointments/recurring` ahora pueden devolver `402`** cuando el negocio hace más de 7 días que no paga. Si el manejador de errores no lo contempla cae en el "error inesperado" genérico, que acá es lo peor: el usuario no se entera de que hay que pagar. Es 402 y no 403 para poder distinguirlo de un problema de permisos. `GET /tenants/me/subscription` trae `daysOverdue` y `blocked`, y **hay una ventana entre los dos** (`graceDays`): ahí es cuando conviene avisar. Ver, cancelar y reprogramar siguen funcionando aunque deba. Detalle en `docs/api-changelog.md`
- **Mails:** ya salen del backend, sus links apuntan acá y **las cuatro pantallas que los reciben están hechas** (`/activar`, `/olvide-contrasena`, `/restablecer`, `/verificar-email`). Ver "Las pantallas de los mails" más abajo. Detalle en `docs/api-changelog.md`
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
- 84 botones vacíos en la grilla de `TimeGrid` (12 franjas × 7 días): tienen
  `aria-label`, pero son 84 paradas de tabulación
- `tsconfig` sin `noUncheckedIndexedAccess`
- `/registro` sigue siendo un cartel de "próximamente" — a decidir, ver el final
- `useTeamTimeOff` y `useAssignableEmployees` hacen N pedidos (uno por empleado)
  porque la API no expone esos datos juntos. Alcanza para los planes actuales
- `/reportes` mide lo **agendado** (`totalPriceCents`), no lo **cobrado**
  (`balance.paidCents`). Desde el punto 13 las dos cifras existen y son distintas
- En desarrollo **el pago de la suscripción no se puede confirmar**: el id del
  sandbox choca con el de un pago de turno y el webhook resuelve el del turno.
  Ver "La suscripción del negocio"

## Alta de empleados — el flujo completo
1. `POST /employees` da de alta sin contraseña y devuelve un `activationUrl`
2. Ese link **se muestra una sola vez**. Para recuperarlo hay que reenviar la
   invitación (`POST /employees/:id/invitation`), que emite otro e invalida el anterior
3. El invitado abre `/activar?token=…`, elige contraseña y el front postea a
   `POST /employees/activate` — el único endpoint público de `/employees`

La regla de contraseña vive en `validateNewPassword`; `newPasswordSchema` la reusa
con un `superRefine` en vez de reescribirla, para que no se desincronice.

## Turnos reales — el mock está muerto
`/dashboard`, `/agenda` y `/reportes` corren sobre `/appointments`. Se fueron
`features/appointments/data/mockData.ts` y `lib/format.ts`.

**Diez cosas que no son obvias:**

1. **La API manda instantes; el calendario dibuja horas de pared.** Son dos cosas
   distintas —las 12:00 UTC son las 9 en Buenos Aires—, y la conversión pasa por
   `splitInstant` / `toInstant` en `lib/time.ts` y por `toAppointment` en
   `services/appointments.ts`, **por ningún otro lado**. La zona es la del
   **negocio**, no la del navegador: ver "La zona horaria del negocio". El tipo `Appointment` es
   el de la API **más** `day`, `startTime` y `endTime`, que son derivados: nadie
   los manda de vuelta
2. **Los estados son siete, no cinco.** Hay **dos formas de cancelar** —quién
   canceló decide la política de devolución— y `RESCHEDULED` no es una baja: es
   el turno *viejo*, enlazado con el nuevo por `rescheduledFromId`/`ToId`
3. **`NO_SHOW` ocupa la agenda; las cancelaciones y `RESCHEDULED` no.** Está en
   `ocupaAgenda()`, y de ahí sale tanto la carga del calendario de Inicio como
   qué se dibuja en la grilla
4. **Los estados finales son finales.** El modal ofrecía "Reabrir" un turno
   cancelado y eso daba 409. Ahora las acciones salen de `TRANSICIONES`, así que
   no puede volver a desincronizarse
5. **Un turno puede encadenar varios servicios.** `services` es una lista, y por
   eso `revenueByService` cuenta **renglones, no turnos**: un corte + color suma
   en los dos. `serviceName()` los muestra como "Corte + Color"
6. **El precio está congelado al reservar.** Se muestra `totalPriceCents` del
   turno, **nunca** el del servicio: el catálogo pudo cambiar después
7. **`formatPrice` se borró.** Recibía **pesos** y convivía con datos en
   centavos; esa convivencia ya costó dos bugs de cien veces el monto.
   `formatCents` es el único formateador de plata
8. **La API no guarda un color por empleado.** Sale de `personColor(id).hex`, la
   misma paleta del calendario de ausencias: la misma persona, el mismo color en
   todo el panel
9. **La grilla se estira para que entre lo que haya.** 8–20 es el piso, no el
   techo: un turno de 19:55 a 20:50 se dibujaba fuera de la caja. Lo resuelve
   `gridRange()`, testeado
10. **Reprogramar crea otro turno, y la plata no se muda.** El viejo queda en
    `RESCHEDULED` enlazado con el nuevo, y **a partir de ahí no acepta
    movimientos** —el mismo 409 que un cancelado—. Lo cobrado queda asentado en el
    viejo: el turno nuevo nace debiendo todo. El modal lo avisa antes de mover.

11. **Una serie saltea las fechas que no entran, y hay que mostrarlas.** `POST
    /appointments/recurring` crea lo que puede y devuelve el resto en `skipped`
    con el motivo redactado. "Se agendaron 4 turnos" cuando se pidieron 6 es
    cierto y engaña: el titular nombra los dos números. `occurrences` **cuenta el
    primero**. Si no entró ninguna, ahí sí es 409.

12. **`availability` acepta un solo `serviceId`.** Repetirlo da 400. Por eso el
    formulario manda un servicio por turno aunque `POST /appointments` acepte
    varios: con dos, los horarios ofrecidos serían los de uno y se mostrarían
    huecos donde no entra.

13. **`GET /appointments` va por rango, no paginado**, hasta 92 días. Un turno
    que arranca el día anterior y termina dentro del rango **también viene**

### Agendar
`BookingModal`. El orden de los campos es el del mostrador: primero quién viene,
después qué se hace, y recién ahí los horarios.

- **`availability` no recorta los slots pasados**: describe lo que el horario
  permite, no lo que todavía se puede reservar. El corte lo pone la pantalla, y
  usa `dataUpdatedAt` —cuándo llegó la respuesta— y no el reloj de cada render:
  leerlo en render no es puro y haría desaparecer un horario mientras lo mirás
- **Los slots duran duración + buffer**, así que el último del día termina antes
  del cierre. No es un bug, y el formulario lo dice
- **`branchClosed` distingue "cerrado" de "sin lugar"**: los dos devuelven
  `slots: []` y el cartel que corresponde es distinto
- **El 409 no es un error a reintentar**: alguien tomó el hueco. Se refresca la
  disponibilidad y se ofrece otro horario
- **El 402 es la suscripción impaga**, y es 402 y no 403 justamente para poder
  distinguirlo de un problema de permisos. El aviso preventivo sale de
  `deudaVisible()` y vive **en la ventana entre atrasarse y ser bloqueado**: antes
  no hay nada que decir, después lo dice el error. **Ver, cancelar y reprogramar
  siguen andando aunque deba**

⚠️ **La demo arranca sin ningún turno.** `npm run seed:demo` carga negocio,
equipo, catálogo y clientes, pero no agenda nada: las tres pantallas se ven
vacías hasta que alguien reserve. No está roto.

⚠️ **El backend tiene dos baldes de límite, y son para *todos* los pedidos, no
solo las escrituras: 10 por segundo y 100 cada ~50 s.** Vienen en las cabeceras
`X-RateLimit-*` de cualquier respuesta, así que no hay que adivinarlos. `/auth/login`
es más estricto (5). Un 429 es el throttler, no un fallo: importa al sembrar datos
y al recorrer una lista pidiendo el detalle de cada ítem.

## Clientes — el teléfono es la identidad
`/clientes` es la primera pantalla **paginada** y la primera que trata un error
del backend como una salida en vez de un cartel.

1. **El 409 de teléfono repetido no es un fallo.** El cuerpo del error trae
   `existingCustomer` con la ficha ya cargada, y con eso la pantalla pregunta
   *"¿es esta persona?"* y ofrece abrirla. Para que eso funcione, `ApiError`
   ahora **guarda el cuerpo crudo** y `errorDetail(error, 409, "existingCustomer")`
   lo lee. `errorDetail` exige el `statusCode` a propósito: sin ese chequeo, un
   500 con un cuerpo raro se leería como un duplicado
2. **No hay merge automático, y es una decisión.** Dos personas pueden compartir
   teléfono —una madre y su hija—, así que unir historiales lo decide quien
   atiende. `PATCH` pasa por el mismo chequeo: cambiar un teléfono a uno ya usado
   también da 409
3. **El teléfono se manda tal como lo tipearon.** El backend guarda el texto
   original y compara solo los últimos 10 dígitos, así que `+54 9 11 4123-5566` y
   `011 4123-5566` son la misma persona. **No normalizar en el front** sería una
   segunda regla que se desincroniza
4. **La búsqueda es una sola caja**: el backend cruza nombre, apellido, email y
   teléfono. Va con `useDebounced` porque es una consulta pesada y una request
   por tecla devuelve respuestas desordenadas
5. **`keepPreviousData` no es cosmético.** Sin él, cada tecla vacía la tabla y el
   scroll salta al principio
6. **La paginación vive en `lib/pagination.ts`, no en la pantalla**: la misma
   forma `{ data, meta }` se repite en el historial de turnos y de pagos.
   `pageAfterRemoval` existe porque borrar el último de una página la dejaba
   vacía con una paginación que decía que había páginas
7. **La edad se calcula por partes de fecha, sin `new Date(cadena)`.**
   `new Date("1995-11-02")` es medianoche **UTC**, o sea el 1 de noviembre a las
   21:00 acá: la edad daba un año de más durante todo el día del cumpleaños. Es
   la misma trampa de los feriados
8. **Permisos partidos**: cargar y editar lo puede hacer cualquier empleado —quien
   atiende el mostrador no siempre es administrativo—; **dar de baja** y
   **administrar etiquetas** son `OWNER` / `ADMINISTRATIVE`
9. Dar de baja una etiqueta **la saca de todos los clientes**, y dar de baja un
   cliente **libera su teléfono** para una ficha nueva

⚠️ **El backend limita a 10 pedidos por segundo y 100 cada ~50 s** (los dos baldes
salen en las cabeceras `X-RateLimit-*`). No es un bug del front. Importa si alguna
vez se hace una importación masiva de clientes: hay que espaciar los pedidos y
tratar el 429 como "esperá", no como un fallo.

## El catálogo — la plata va en centavos
`/servicios` son tres solapas y no tres pantallas: son tres entidades que solo
tienen sentido juntas. Tampoco son un diálogo dentro de servicios —como los
horarios dentro de una sucursal— porque cada una es un ABM completo, no la
configuración de otra cosa.

**El error más caro de toda la app vive acá: el backend guarda centavos.**
`priceCents: 1500000` son $15.000. La conversión está encerrada en
`features/catalog/lib/money.ts` y **nadie multiplica por 100 a mano**. Ojo con
`formatPrice` de `lib/format.ts`: ese recibe **pesos enteros** y lo usan las
pantallas del mock. Mezclarlos es exactamente cómo se cuela un factor 100.

1. **El ida y vuelta por el input tiene que cerrar, y ya se rompió una vez.**
   `centsToInput` devolvía `String(cents/100)` —o sea `"2500.5"`— y
   `inputToCents` leía el punto como separador de miles: abrir un servicio con
   seña de $2.500,50 y guardarlo **sin tocar nada** la dejaba en $25.005. Hay un
   test de round-trip para esto; no lo saques
2. **El punto se desambigua por cuántos dígitos lo siguen.** "15.000" son quince
   mil, "2.5" son dos con cincuenta: nadie deja menos de tres cifras después de
   un separador de miles
3. **La seña no puede superar el precio, ni indirectamente.** Bajar el precio por
   debajo de una seña ya cargada da 400 aunque el body no toque la seña, y ese
   error no señala ningún campo: `checkDeposit` lo ataja antes de viajar
4. **Un servicio se presta por par `(empleado, sucursal)`**, no por persona.
   `PUT /services/:id/employees` valida cada par contra las sucursales del
   empleado y da 400 si no trabaja ahí, así que la grilla **apaga** esas casillas
   en vez de dejarlas marcar. La lógica está en `lib/assignments.ts`, testeada
5. **Saber dónde trabaja cada uno cuesta un pedido por empleado.** `GET
   /employees` no trae `branchIds`; solo el detalle. Es la misma deuda que
   `useTeamTimeOff` y alcanza igual. Comparte clave con `useEmployeeDetail`, así
   que si `/equipo` ya los pidió, sale de la caché
6. **Dar de baja una categoría no borra sus servicios**: quedan con
   `category: null`. El diálogo de confirmación lo dice con el número exacto
7. **Los recursos son feature de plan.** Con el Básico, `POST /resources` da 403
   con el mensaje ya redactado por el backend, que se muestra tal cual. El gate
   corre **solo en el alta**: quien baja de plan sigue editando lo que tenía
8. **El nombre del recurso es único por sucursal**, así que la sucursal no se
   puede cambiar al editar: movería el recurso a un nombre que quizás ya existe
9. En el alta los campos opcionales se **omiten** y en la edición viajan como
   `null`. Es a propósito: el backend corre con `forbidNonWhitelisted`, y sin el
   `null` explícito no habría forma de sacarle la seña a un servicio

## Cobros — la plata va en dos tiempos
`GET/POST /appointments/:id/payments`. El panel de cobros vive **dentro del turno**
(`PaymentsPanel`, dentro de `AppointmentModal`): cobrar no es una tarea aparte, se
hace con el turno abierto adelante y mirando a quien vino.

1. **El saldo lo calcula el backend. No rehacerlo.** `balance.dueCents` viene
   hecho; sumar `payments` para llegar a lo mismo es donde se cuenta de más,
   porque una devolución es una fila propia **y** ya está descontada de
   `paidCents`. `paidCents` puede ser **negativo** si se devolvió de más;
   `dueCents` nunca lo es.

2. **El link de pago no cobra.** `POST .../payments/checkout` crea el pago
   *pendiente* y devuelve a dónde mandar al cliente. Lo confirma Mercado Pago
   avisándole al backend, de segundos a minutos después. Por eso el bloque del
   link es **ámbar y no verde** y dice "todavía no está pago": dar por cobrado lo
   que no entró es el malentendido más caro de esta pantalla.

3. **Cuando el cobro online se acredita, el turno también cambió.** Cubrir la seña
   lo saca de `PENDING_PAYMENT` y lo deja `CONFIRMED`, y eso pasa del lado del
   backend: acá nadie mutó nada. `usePayments` repregunta cada 10 s mientras haya
   un pendiente **y además invalida los turnos** en la transición. Sin lo segundo
   el saldo se actualiza pero el turno sigue diciendo "Falta la seña" en el modal,
   en la agenda y en el tablero del día.

4. **⚠️ Un turno cancelado no acepta la devolución.** El 409 es
   `"El turno está cancelado o fue reprogramado: no se le pueden registrar pagos"`
   y alcanza a **todos** los movimientos, `REFUND` incluido. O sea que el orden
   importa y no se puede deshacer: **hay que devolver antes de cancelar.** El
   modal avisa antes de cancelar un turno con plata adentro; después ya no hay
   dónde asentarlo y la caja del mes queda diciendo que ese dinero está.

5. **`RESCHEDULED` cuenta como cancelado para la plata**, aunque no sea una
   cancelación. `sePuedeCobrar` no puede salir de `estaCancelado` solo; y tampoco
   de `noOcurrio`, que además junta `NO_SHOW` —esa hora estuvo tomada y se cobra
   igual.

6. **El backend acepta cobrar y devolver de más sin decir nada.** $150.000 en un
   turno de $1.500 devuelve 201, deja el saldo en cero y la pantalla diciendo
   "Pagado". El error de cien veces es de una sola tecla, así que el formulario
   **avisa y no bloquea**: los dos excesos pueden ser correctos (una propina, un
   paquete cobrado de una, una compensación acordada).

7. **`MERCADOPAGO` no se puede cargar a mano** (400): ese pago solo lo crea el
   checkout, que es el único que un sistema externo puede confirmar. La regla la
   sostiene el tipo, no una lista: `ManualPaymentMethod` sale del spec y no lo
   incluye, así que sumarlo no compila.

8. **Pedir el checkout dos veces devuelve el mismo link** (`reused: true`). Es a
   propósito y no hay que pelearlo deshabilitando el botón. Con un link vivo el
   botón directamente no se muestra: ya está en pantalla.

9. **`recordedBy` es el único rastro de un cobro que nadie puede confirmar.** En
   los online viene `null` a propósito —lo pagó el cliente—; en los de mostrador
   dice quién lo cargó, y por eso se muestra.

10. **Las tres pantallas de vuelta no consultan nada, y no pueden.** Volver por
    `/pago/exito` **no prueba** que el pago esté acreditado, y no hay endpoint
    público para preguntarlo. Todo lo que pueden hacer honestamente es contar qué
    sigue. Tampoco llevan a ningún lado: las abre el cliente del negocio, que no
    tiene cuenta.

11. **En dev no se cobra nada.** `PAYMENT_PROVIDER=sandbox`: el `checkoutUrl`
    apunta a `/pago/exito?sandbox=<paymentId>` y se simula el pago pegándole al
    webhook:
    ```bash
    curl -X POST http://localhost:3001/webhooks/mercadopago \
      -H 'Content-Type: application/json' \
      -d '{"type":"payment","data":{"id":"sandbox-payment-1"}}'
    ```

12. **Cobrar no es tarea de dueño.** Un `PROFESSIONAL` puede ver el saldo y
    registrar cobros —probado contra la API—, que es lo correcto en un local
    chico: quien atiende es quien recibe la plata.

## La suscripción del negocio — el aviso tiene que llevar a algún lado
`GET/POST /tenants/me/subscription`. Es lo que **reservApp le cobra al negocio**,
no lo que el negocio le cobra a su clientela. Vive en `/configuracion`, arriba de
todo, porque es el dato del que dependen los demás.

1. **⚠️ Pide `OWNER` o `ADMINISTRATIVE`: a un `PROFESSIONAL` le contesta 403.** Y
   no es teórico: `useSubscription` no tenía la guarda y cada profesional que
   abría el formulario de agendar disparaba **tres 403 en los primeros seis
   segundos**, más los que seguían con backoff. No rompía nada visible, que es lo
   peor que puede tener un error. Ahora la consulta va con `enabled:
   canManage(rol)` y **un 403 no se reintenta**: es una respuesta definitiva.
   `/configuracion` muestra dos tarjetas distintas según el rol por lo mismo.

2. **Pagar estando al día cobra el mes siguiente, no un duplicado.** Por eso la
   respuesta trae `periodStart`/`periodEnd` y la pantalla los muestra: sin las
   fechas, alguien paga sin saber qué mes pagó y con razón cree que pagó dos veces.
   El botón lo dice antes de apretarlo ("Pagar el próximo mes" / "Pagar ahora").

3. **El historial de la suscripción no trae `checkoutUrl`**, a diferencia del de
   un turno. Volver a pedir el checkout es la **única** forma de recuperar el link
   de un cobro pendiente —devuelve el mismo, con `reused: true`—, así que ahí el
   botón dice "Retomar el pago" y no "Pagar el próximo mes", que haría pensar en un
   segundo cobro del mismo mes.

4. **`priceMonthlyCents: null` no es gratis**: es un plan que se cotiza con soporte
   (Empresa). Su checkout devuelve **409**, así que `sePuedePagar` decide que el
   botón no exista, en vez de existir para explicar el error después.

5. **La pantalla de vuelta sí consulta, y es la diferencia con `/pago/*`.** Esas
   las abre el cliente del negocio, sin sesión y sin endpoint público que
   preguntar; `/suscripcion/exito` la abre el dueño, autenticado, así que espera la
   confirmación real y la canta cuando llega. **El signo de que terminó es que no
   quede ningún cobro `PENDING`** (`hayPagoEsperando`), no que la cuenta figure al
   día: quien paga por adelantado ya estaba al día antes de pagar.

6. **`/suscripcion/pendiente` no espera nada, a propósito.** Un pago en efectivo o
   por transferencia puede tardar días hábiles, y una pantalla girando todo ese
   rato solo consigue parecer colgada.

7. **El aviso de deuda ahora lleva a pagar.** `deudaVisible` en el formulario de
   agendar, el 402 cuando ya está bloqueado y la píldora de la barra de arriba
   linkean a `/configuracion` — **solo para quien puede pagar**. A un profesional
   el atajo lo llevaría a una pantalla donde ni siquiera puede ver el estado.

8. **⚠️ En dev no se puede confirmar el pago de la suscripción.** El
   `checkoutUrl` del sandbox trae `?sandbox=sandbox-payment-1`, **el mismo id que
   ya tiene un pago de turno**, y el webhook resuelve el del turno: contesta
   `applied` y el cobro de la suscripción sigue `PENDING`. Es del entorno de
   desarrollo —en producción los ids los da Mercado Pago y son únicos—, pero
   invalida la receta del `curl` para este caso. Probar la pantalla de vuelta
   exige controlar la respuesta desde afuera.

## La zona horaria del negocio
`lib/time.ts`. **La API manda instantes y el calendario dibuja horas de pared**, y
convertir de una a otra necesita una zona. La del navegador **no sirve**: es la de
quien mira, no la del negocio.

1. **Hay dos pares de funciones y no hay que mezclarlos.**
   - `splitInstant` / `toInstant` cruzan la frontera instante ↔ hora de pared y
     **usan la zona del negocio**
   - `dateToStr` / `parseCalendarDay` viven en el mundo de los días de calendario
     —el que arma la grilla con `new Date(año, mes, día)`— y **siguen siendo
     locales**. Hacerlos mirar la zona del negocio los rompería: medianoche local
     leída en una zona más atrasada cae el día anterior

2. **La zona se fija en `getSessionRequest`, no en un efecto.** La conversión
   ocurre dentro de `queryFn`s (`toAppointment`), fuera de todo componente, así que
   no puede depender de un hook. Poniéndola al traer `/auth/me`, cualquiera que vea
   `session` ya la tiene. Un `useEffect` dejaría el primer render con la zona
   equivocada, y eso **no se corrige solo**: los turnos ya convertidos quedan en la
   caché de React Query.

3. **Por eso el panel no dibuja páginas hasta tener la sesión.** El cascarón sí se
   monta enseguida —no muestra ningún horario—. Con la sesión en error no se
   bloquea: el 401 redirige al login por otro lado, y para cualquier otra falla es
   mejor un panel con la zona del navegador que un "Cargando…" eterno.

4. **`businessNow()` es un reloj de pared disfrazado de `Date`.** Está corrido a
   propósito para que `getHours()` y `dateToStr()` den la hora y el día del
   negocio, y así todo lo que dibuja la agenda funciona sin saber de zonas.
   **Nunca compararlo con un instante**: para eso está `Date.now()`, como en el
   corte de slots pasados del formulario de agendar.

5. **`toInstant` mide el desfase dos veces**, y no es paranoia. La primera pasada
   supone que la hora de pared es UTC para averiguar cuánto corre la zona; si esa
   suposición cae del otro lado de un cambio de horario de verano, mide el desfase
   equivocado. Con una sola medición, un turno cargado a la 01:30 del domingo del
   cambio se guarda una hora —y un día— antes. Argentina hoy no tiene DST, pero
   Chile, Brasil y México están en la lista de zonas que ofrece el panel.

6. **Una zona inválida se ignora en vez de romper.** `Intl` tira excepción con un
   nombre que no conoce, y eso dejaría la app sin poder dibujar una sola fecha.

7. **Cambiar la zona en `/configuracion` invalida toda la caché.** Los turnos
   guardados ya tienen el día y la hora derivados con la zona vieja: no se arreglan
   solos.

8. **Los tests corren con `TZ=America/Argentina/Buenos_Aires`** (`vitest.config.mts`),
   así que **la zona del navegador y la del negocio coinciden salvo que el test la
   cambie a mano**. Los casos que prueban la diferencia fijan otra con
   `setBusinessTimezone`; sin eso se aprobarían solos.

## Las pantallas de los mails
Cuatro rutas públicas que reciben un link que mandó el backend. Todas usan
`AuthCard`, y las que muestran un desenlace en vez de un formulario usan
`AuthResult` (ícono + título + salida): violeta informa, ámbar pide una acción,
verde cerró bien. **Rojo no está a propósito** — un link vencido no es culpa de
quien lo abrió.

| Ruta | Endpoint | Componente |
|---|---|---|
| `/olvide-contrasena` | `POST /auth/forgot-password` | `ForgotPasswordForm` |
| `/restablecer?token=` | `POST /auth/reset-password` | `ResetPasswordForm` |
| `/verificar-email?token=` | `POST /auth/verify-email` | `VerifyEmailCard` |
| `/activar?token=` | `POST /employees/activate` | `ActivateAccountForm` |

Seis cosas que no son obvias:

1. **`forgot-password` devuelve 204 exista la cuenta o no**, y por eso el mensaje
   empieza con "si": decir "ese email no está registrado" dejaría averiguar qué
   direcciones tienen cuenta probando una por una. **No es un texto vago por
   comodidad; es el requisito.** La pantalla de éxito es idéntica en los dos casos
2. **Los tokens valen una sola vez.** `/restablecer` hace `router.replace` al
   login apenas sale bien: si volviera atrás, el segundo intento da 400 y parece
   un error cuando en realidad funcionó
3. **`/verificar-email` se dispara sola al montar, y tiene que hacerlo una sola
   vez.** En dev React monta dos veces con StrictMode; sin el candado de `useRef`
   de `VerifyEmailCard`, la primera llamada confirma el mail y la segunda muestra
   un error por token ya usado. Es el bug más fácil de introducir acá
4. **Un reset cierra todas las sesiones.** `ResetPasswordForm` llama a
   `clearTokens()` antes de redirigir: el refresh token guardado ya no sirve y sin
   esto la próxima pantalla intenta refrescar con uno muerto
5. **El 400 viene con el motivo ya escrito en castellano.** Se muestra tal cual
   con `apiErrorMessage`; no hay que redactar uno propio que tendría que cubrir
   vencido, ya usado e inexistente a la vez
6. **En desarrollo no sale ningún mail.** El backend arranca con
   `MAIL_PROVIDER=log` y escribe el link en su propia consola: para probar el
   camino feliz hay que copiarlo de ahí

El token se lee con `useSearchParams` dentro de un `Suspense` —no en el servidor—
para que un secreto de un solo uso no viaje en el payload de la página. Las cuatro
rutas van en el `disallow` de `robots.ts`: un crawler que las visite quema el link.

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
y la API guarda un instante, así que la conversión pasa por `toInstant` de
`lib/time.ts` —la misma que usan los turnos, en la zona del **negocio**—. Tenía su
propia copia atada al navegador y cargaba las ausencias corridas. **No hay campo
`allDay` en la API**: un día completo se guarda de 00:00 a 23:59 del negocio y se
deduce al releerlo (`isAllDay`). `branchId: null` = ausente en todas.

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

**Ojo con el otro lado**: esa zona es también la del negocio de los tests, así que
la del navegador y la del negocio coinciden y un test que no fije otra a mano **no
prueba nada sobre zonas**. Los que sí prueban eso llaman a `setBusinessTimezone`.

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

---

**⚠️ El backend cerró la Fase 6 (pagos y suscripción).** El front venía dos fases
atrás y las recuperó todas: **76 de 86 endpoints cableados**, y no queda ninguna
pantalla pendiente del roadmap. Lo que falta cablear son endpoints que el panel no
necesita —los `GET /:id` de detalle, que ya salen del listado—, el webhook (que el
front **no debe** llamar nunca), `/health`, y las series recurrentes, que son
funcionalidad nueva y no una pantalla faltante. El detalle de cada uno,
en `docs/api-contract.md`; qué cambió y qué rompe, en `docs/api-changelog.md`.

### 9. ~~Las pantallas de los mails~~ ✅ hecho
`/olvide-contrasena`, `/restablecer?token=` y `/verificar-email?token=` están
cableadas. Los links que el backend manda desde hace semanas ya no caen en 404.
Las trampas quedaron escritas en "Las pantallas de los mails", más arriba.

**El 402 se hizo en el punto 12**, que es donde nacía: hasta entonces el front no
llamaba a la API de turnos desde ningún lado y `POST /appointments` es el único que
lo devuelve. `deudaVisible` avisa en la ventana entre atrasarse y ser bloqueado, y
`BookingModal` explica el 402 en ámbar aclarando que ver, cancelar y reprogramar
siguen andando. **Lo que falta es poder pagar desde ahí: es el punto 14.**

### 10. ~~`/servicios`~~ ✅ hecho
Catálogo completo en tres solapas. Las trampas quedaron en "El catálogo — la
plata va en centavos", más arriba. `formatPrice` se borró en el punto 12 y
`formatCents` quedó como el único formateador de plata; **queda pendiente** leerle
la moneda de `tenant.currency` en vez del ARS fijo, que es un parámetro con default
en un solo lugar.

- Precios en **centavos** (`priceCents`)
- **Un servicio se presta por par `(empleado, sucursal)`**, no solo por empleado
  (`PUT /services/:id/employees`). No es "quién lo hace" sino "quién lo hace dónde",
  y es la parte que se subestima al diseñar la pantalla
- Los recursos son feature de plan: crear de más devuelve 403 con el mensaje ya
  redactado por el backend, que se muestra tal cual

### 11. ~~`/clientes`~~ ✅ hecho
Listado paginado, búsqueda cruzada, etiquetas y el duplicado de teléfono como
pregunta. Las trampas quedaron en "Clientes — el teléfono es la identidad", más
arriba. **La paginación quedó resuelta para las que vienen**: `lib/pagination.ts`
y el componente `Pagination`, que solo recibe un `meta` y no sabe de clientes.

### 12. ~~Turnos reales~~ ✅ hecho
`mockData.ts` y `lib/format.ts` se borraron; `/dashboard`, `/agenda` y
`/reportes` corren sobre la API. Las trampas quedaron en "Turnos reales — el mock
está muerto", más arriba. **El 402 del punto 9 se hizo acá**, que es donde nacía.

Lo que no entró está en el punto 15. Sigue además `lib/absenceKind.ts`: la API
todavía no tiene campo de tipo de ausencia.

### 13. ~~Cobros~~ ✅ hecho
Saldo, historial, cobro de mostrador, devolución y link de pago online, todo
dentro del turno. Las tres pantallas de vuelta del checkout existen. Las trampas
quedaron en "Cobros — la plata va en dos tiempos", más arriba.

Lo que no entró está en el punto 15, junto con el resto.

### 14. ~~La suscripción del negocio~~ ✅ hecho
Estado de la cuenta, historial de cobros y link para pagar el mes, en
`/configuracion`. El aviso de deuda dejó de ser un callejón sin salida: desde el
formulario de agendar, desde el 402 y desde la barra de arriba se llega a pagar.
Las trampas quedaron en "La suscripción del negocio", más arriba.

**Con esto el roadmap queda cerrado.** Lo que sigue no es una pantalla faltante
sino trabajo nuevo; en orden de lo que más se va a extrañar:

### 15. ~~Lo que quedó afuera~~ ✅ hecho, salvo dos cosas bloqueadas
- ~~`/reportes` decía "facturación" y medía lo agendado~~ ✅ ahora dice **"Agendado
  en total"** y la bajada aclara que no es lo que entró en la caja
- ~~No hay corte de caja del día~~ ✅ panel **"Los turnos de hoy"** en `/reportes`:
  cuánto se cobró y quién quedó debiendo. **Arranca apagado**, porque cuesta un
  pedido por turno
- ~~La devolución que sugiere el backend al cancelar se descarta~~ ✅ se muestra
  después de cancelar, que es cuando llega. Ver "Cobros" punto 13
- ~~Series recurrentes~~ ✅ con las fechas salteadas a la vista
- ~~Reprogramar desde la UI~~ ✅ adentro del modal del turno
- ~~Elegir el profesional al agendar~~ ✅ aparece cuando hay más de uno que preste
  ese servicio en esa sucursal
- `/registro`, que sigue sin decidirse — ver abajo

**Lo que quedó bloqueado por la API, no por falta de trabajo:**

1. **Facturación cobrada por mes.** `GET /appointments/:id/payments` es **de a un
   turno** y no hay endpoint agregado, así que un mes de un local con movimiento
   serían cientos de pedidos contra un límite de 100 cada 50 s. Por eso lo cobrado
   se muestra **solo del día**. Con un `GET /payments?from&to` esto se destraba en
   una tarde.

2. **Varios servicios en un turno.** `POST /appointments` acepta `serviceIds`
   (plural) pero **`GET /appointments/availability` acepta un solo `serviceId`** —
   repetirlo da 400. La duración de dos servicios es la suma, así que los horarios
   que se ofrecerían serían los de uno solo: se mostrarían huecos que no entran.
   Se destraba haciendo que `availability` acepte `serviceIds`.

### 16. ~~La zona horaria del panel~~ ✅ hecho
El panel usa la zona del **negocio** (`tenant.timezone`), no la del navegador. Con
la máquina en UTC, la agenda ahora dibuja los turnos en hora de Buenos Aires y los
huecos coinciden con el horario cargado de cada profesional. Las trampas quedaron
en "La zona horaria del negocio", más arriba.

De paso se fue una duplicación: `features/employees/lib/timeOff.ts` tenía su propia
copia de `toInstant`/`toDateInput`/`toTimeInput`, también atada al navegador, así
que las ausencias se cargaban corridas. Ahora delegan en `lib/time.ts`.

### Sin decidir
`/registro` es un placeholder que deriva a `/#contacto`, pero `POST /auth/register`
existe y funciona hace rato. Si el alta es a propósito por teléfono —onboarding
manual, que para vender a estéticas tiene sentido— no hay nada que hacer.
**Preguntarle a Franco antes de construirla.**
