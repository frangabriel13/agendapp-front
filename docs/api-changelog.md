# Cambios de la API

Historial de lo que va cambiando en el backend (`../agendapp-api`), fase por fase.
Lo escribe Franco al cerrar cada fase.

**Para qué sirve:** `api-contract.md` describe cómo está la API **hoy**. Este archivo
dice **qué cambió** respecto de la última vez. Esa diferencia es la que importa:
los endpoints nuevos no molestan a nadie, pero un endpoint que ya usabas y cambió
de forma rompe la app en silencio.

**Al leer una entrada nueva, mirar primero la sección "⚠️ Cambios que rompen".**

### Cómo sincronizar cuando hay una entrada nueva

```bash
cp ../agendapp-api/docs/frontend-context.md docs/api-contract.md
npx openapi-typescript http://localhost:3001/api-json -o lib/api-types.ts
npx tsc --noEmit
```

El `tsc` es la red de seguridad: los tipos se generan desde el servidor corriendo,
así que no pueden quedar desactualizados. Si un campo desapareció o cambió, salta
como error de compilación en vez de como bug en el navegador.

---

## Fase 5 — Turnos, disponibilidad y recurrencia (2026-08-19)

8 endpoints nuevos. **No rompe nada de lo que ya estaba.** Es la fase que
**reemplaza el mock de la agenda**: a partir de acá `/dashboard` y `/agenda`
pueden correr sobre datos reales.

### Nuevo

| Área | Qué trae |
|---|---|
| `/appointments` (8) | Disponibilidad, agendar, agenda por rango, ver uno, notas, estados, reprogramar, series repetidas |

### ⚠️ Cambios que rompen

Ninguno en endpoints existentes. Lo que sí cambia es que **el mock de turnos ya
no tiene excusa**: los tipos provisorios de la agenda hay que reemplazarlos por
los generados desde el OpenAPI.

### Lo primero: mirar los huecos antes de reservar

`GET /appointments/availability?branchId=&serviceId=&date=YYYY-MM-DD`

Devuelve los slots libres del día con todo ya restado: horario del local,
horario del profesional, ausencias, turnos tomados y recursos ocupados. Cada
slot dice **quiénes** lo tienen libre, así que sirve igual para "¿a qué hora
puede Lucía?" como para "¿a qué hora hay lugar?".

```jsonc
{
  "date": "2026-09-07",
  "timezone": "America/Argentina/Buenos_Aires",
  "durationMinutes": 45, "bufferAfterMinutes": 10,
  "branchClosed": false,
  "slots": [{
    "startsAt": "2026-09-07T12:00:00.000Z",
    "endsAt": "2026-09-07T12:55:00.000Z",
    "employees": [{ "employeeId": "...", "employeeName": "Lucía Fernández" }]
  }]
}
```

Cuatro cosas que van a parecer bugs y no lo son:

1. **Los horarios pueden quedar "feos": 09:00, 09:55, 10:50.** Los slots duran
   `duración + buffer` y van pegados uno atrás del otro. Si preferís una grilla
   redonda (09:00, 09:15, 09:30…) avisá: es un cambio de una línea en el
   backend, no algo que haya que resolver en el front.
2. **El último turno del día termina antes del cierre.** El buffer es tiempo
   ocupado, así que entra dentro del slot.
3. **`branchClosed` distingue "cerrado" de "sin lugar".** Los dos dan
   `slots: []` pero el cartel es distinto.
4. **No recorta los slots que ya pasaron.** Filtrar por `startsAt > ahora` es
   tarea del front.

### Agendar

`POST /appointments` — **no hace falta usar un slot de la lista**: alcanza con
que el horario entre en el tiempo libre. Eso permite cargar a alguien que llegó
sin turno a las 09:07. El `endsAt` lo calcula el servidor.

**El precio y la duración se congelan al reservar.** Para mostrar el precio de
un turno usar `totalPriceCents` del turno, **nunca** el del servicio: si el
negocio cambia la lista de precios, los turnos viejos siguen valiendo lo que
valían.

⚠️ **Un 409 al agendar es un caso normal, no un error de la app.** Si dos
personas reservan el mismo hueco a la vez, una lo consigue y la otra recibe 409
con un mensaje que dice qué se pisó. Lo correcto es refrescar la disponibilidad
y ofrecer otro horario — reintentar el mismo POST va a fallar igual.

### La agenda del calendario

`GET /appointments?from=2026-09-07&to=2026-09-13` — rango de días inclusive (no
paginado: un calendario pide "esta semana"), hasta 92 días. Filtros: `branchId`,
`employeeId`, `customerId`, `status` (repetible).

### Estados

`PATCH /appointments/:id/status`. El camino es fijo:

| Desde | Puede pasar a |
|---|---|
| `PENDING_PAYMENT` | `CONFIRMED`, cancelado |
| `CONFIRMED` | `ATTENDED`, `NO_SHOW`, cancelado |
| el resto | nada: son finales |

Una transición inválida da **409**, no 400 — o sea que los botones que no
corresponden conviene deshabilitarlos según el estado actual.

Al cancelar la respuesta trae `refund` con qué corresponde devolver según la
política del negocio (`{ type, amountCents, withinPolicy, reason }`). **No mueve
plata** —eso es la Fase 6— pero el `reason` está redactado para mostrarse tal
cual. En los cambios que no son cancelación, `refund` viene `null`.

### Reprogramar y series

`POST /appointments/:id/reschedule` devuelve **el turno nuevo**; el viejo queda
en `RESCHEDULED` y los dos quedan enlazados (`rescheduledFromId` /
`rescheduledToId`). No se edita el original: el historial tiene que mostrar que
hubo un cambio.

`POST /appointments/recurring` genera series semanales, quincenales o mensuales.
⚠️ **Las fechas que no entran se saltean, no cancelan la serie**: la respuesta
trae `created` y `skipped`, cada una con su motivo. **Hay que mostrar
`skipped`** — son las fechas que alguien tiene que resolver a mano. Si no entró
ninguna, ahí sí es 409.

### El seed de demo ahora trae agenda

`npm run seed:demo` carga 4 turnos ubicados **relativos a hoy** (el próximo
lunes y miércoles), así la agenda siempre tiene algo. Hay uno esperando seña y
uno cancelado, para ver los dos estados.

### Qué se puede construir

**La agenda de verdad**: calendario semanal con turnos reales, alta con
selección de hueco libre, cancelar, marcar atendido o ausente, reprogramar,
turnos recurrentes.

### Todavía no

Cobro de señas y pagos (Fase 6), portal público de reservas (Fase 7).

---

## Fase 4 — Clientes (2026-08-19)

12 endpoints nuevos. **No rompe nada de lo que ya estaba** — Fases 0 a 3 siguen
igual. Pero trae **dos formas nuevas** que conviene resolver una sola vez, porque
se repiten de acá en adelante.

### Nuevo

| Área | Qué trae |
|---|---|
| `/customers` (7) | CRUD, búsqueda paginada, `PUT /:id/tags` |
| `/customer-tags` (5) | CRUD de etiquetas ("VIP", "Debe seña"), con `customerCount` |

### ⚠️ Cambios que rompen

Ninguno en endpoints existentes. Pero **sí se resolvió un aviso anterior**:

- **`Patient` es `Customer`.** El tipo provisorio de `types/index.ts` hay que
  reemplazarlo por el real. Campos: `id`, `firstName`, `lastName` (nullable),
  `phone`, `email` (nullable), `dateOfBirth` (`"YYYY-MM-DD"` o `null`), `notes`
  (nullable), `tags[]`, `createdAt`, `updatedAt`. **No hay campo `name`**, igual
  que en empleados.

### Lo primero: la paginación

`GET /customers` es **el primer endpoint paginado de la API**, y no devuelve un
array suelto:

```jsonc
{
  "data": [ /* ...clientes... */ ],
  "meta": { "page": 1, "pageSize": 20, "total": 137, "totalPages": 7 }
}
```

`page` arranca en **1**. `pageSize` va de 1 a 100 (default 20; pedir más da 400).
Pedir una página más allá del final devuelve `data: []` con el `meta` correcto,
**no** un 404 — o sea que no hay que manejar ese caso como error.

**Esta misma forma va a venir en el historial de turnos (Fase 5) y en el de pagos
(Fase 6).** Vale la pena un hook o un tipo genérico ahora y no tres veces después.

### Lo segundo: el 409 con datos

`POST /customers` con un teléfono que ya existe **rechaza con 409 y no crea
nada**, pero el cuerpo del error trae la ficha existente:

```jsonc
{
  "statusCode": 409,
  "message": "Ya tenés un cliente con ese teléfono",
  "error": "Conflict",
  "existingCustomer": { "id": "...", "firstName": "María", "lastName": "González", ... }
}
```

Con eso alcanza para mostrar *"Ya existe María González con ese teléfono — ¿es
esta persona?"* con un botón que abra su ficha, en vez de un cartel rojo. **No
hay merge automático a propósito:** dos personas pueden compartir teléfono (una
madre y su hija, una pareja) y unir dos historiales es una decisión de quien está
atendiendo, no del backend.

`PATCH /customers/:id` pasa por el mismo chequeo: cambiar un teléfono a uno ya
usado también da 409.

⚠️ Esto también cambia una suposición general sobre errores: **el cuerpo de un
error puede traer campos extra** además de los seis de siempre. El helper que los
muestra no debería descartarlos.

### Tres cosas más sobre clientes

1. **El teléfono se compara normalizado — no normalices nada en el front.** El
   backend guarda lo que el usuario tipeó y lo muestra tal cual, pero compara
   solo los dígitos (los últimos 10). `+54 9 11 5555-1234`, `011 5555-1234` y
   `(011) 5555.1234` son la misma persona, tanto para el 409 como para buscar.
2. **La búsqueda es una sola caja, no un formulario de filtros.**
   `?search=...` cruza nombre, apellido, email y teléfono a la vez. Con varias
   palabras, todas tienen que aparecer en el nombre completo en cualquier orden:
   `maría gonzález` y `gonzález maría` traen lo mismo.
3. **Permisos más abiertos que en el resto.** Cargar y editar clientes lo puede
   hacer **cualquier empleado**, incluido `PROFESSIONAL` — quien atiende el
   mostrador no siempre es administrativo. Solo **dar de baja** un cliente y
   **administrar etiquetas** son `OWNER` / `ADMINISTRATIVE`.

Detalles menores: solo `firstName` y `phone` son obligatorios. El email **no** es
único (dos clientes pueden compartir casilla). `dateOfBirth` no puede ser futura.
`PUT /customers/:id/tags` reemplaza el set completo (`[]` las saca todas), igual
que los `PUT` del catálogo. Cada etiqueta trae `customerCount` (clientes vivos),
útil para avisar antes de borrarla. Dar de baja un cliente **libera su teléfono**
para una ficha nueva.

### El seed de demo ahora trae clientas

`npm run seed:demo` carga 3 clientas y 2 etiquetas. Los teléfonos están escritos
de tres formas distintas a propósito (`+54 9 11 4123-5566`, `(011) 4777-8899`,
`11 5030-2211`): es el caso que rompe cualquier búsqueda que compare strings.

### Qué se puede construir

Pantalla de clientes completa: listado con búsqueda y paginación, ficha con
etiquetas, alta con detección de duplicados.

### Todavía no

**Turnos y disponibilidad** (Fase 5), pagos, portal público. La agenda sigue con
mock.

---

## Fase 3 — Catálogo: servicios, categorías y recursos (2026-08-18)

19 endpoints nuevos. **No rompe nada de lo que ya estaba** — todo lo de Fases 0 a 2
sigue igual.

### Nuevo

| Área | Qué trae |
|---|---|
| `/service-categories` (5) | CRUD de categorías |
| `/services` (9) | CRUD de servicios, `PUT /:id/employees` (quién lo presta y dónde), `PUT /:id/resources` |
| `/resources` (5) | CRUD de camillas, salas y sillones, por sucursal |

### ⚠️ Cambios que rompen

Ninguno en endpoints existentes. Pero **sí se resolvió un aviso anterior**:

- **`Service.price` ahora es `priceCents`, entero en centavos.** El tipo
  provisorio que estaba en `types/index.ts` hay que reemplazarlo. `1500000` son
  $15.000. Lo mismo `depositAmountCents` (la seña, `null` si no pide).

### Tres cosas que conviene saber antes de armar la pantalla

1. **La seña no puede superar al precio, ni indirectamente.** Bajar el precio por
   debajo de una seña ya cargada devuelve 400. Si el usuario baja el precio,
   mandá `priceCents` y `depositAmountCents` juntos.
2. **Un servicio se presta por *persona + sucursal*, no solo por persona.**
   `PUT /services/:id/employees` recibe `{ assignments: [{ employeeId, branchId }] }`
   y valida cada par contra las sucursales del empleado: si no trabaja ahí, 400.
   El selector tiene que dejar elegir las dos cosas.
3. **Los recursos son feature de plan.** Con plan Básico, `POST /resources` da 403
   con un mensaje explicando que hay que cambiar de plan — conviene mostrarlo tal
   cual. El gate corre solo en el alta: un negocio que baja de plan sigue viendo y
   editando lo que ya tenía.

Detalles menores: `color` es `#RRGGBB` y va directo al calendario;
`durationMinutes` va de 1 a 1440; las categorías se ordenan por `displayOrder` y a
igual valor alfabéticamente; **dar de baja una categoría no borra sus servicios**,
los deja con `category: null`; el nombre de un recurso es único **por sucursal**
(puede haber "Camilla 1" en Centro y en Palermo).

### El seed de demo ahora trae catálogo

`npm run seed:demo` carga 2 categorías, 2 servicios y 2 recursos. Lucía hace corte
en las dos sucursales pero color solo en Centro — es el caso que rompe la
suposición "un servicio, todas las sucursales".

### Qué se puede construir

Pantalla de catálogo completa: categorías, servicios con precio y duración,
asignación de quién presta qué y dónde, recursos por sucursal.

### Todavía no

Clientes (Fase 4), **turnos y disponibilidad** (Fase 5), pagos, portal público.
La agenda sigue con mock.

---

## Fases 0 a 2 — Base, auth y estructura del negocio (2026-08-12)

Punto de partida. Es todo lo que existía cuando el front se integró por primera vez.

### Nuevo — 37 endpoints

| Área | Qué trae |
|---|---|
| `/auth` (6) | Registro, login, refresh con rotación, logout, perfil, cambio de contraseña |
| `/tenants` (6) | Datos del negocio, branding (colores y logo), preferencias |
| `/branches` (11) | CRUD de sucursales, horario semanal, feriados y días especiales |
| `/employees` (13) | CRUD, invitación con link, activación pública, permisos, asignación a sucursales, horario con turno partido, ausencias |
| `/health` (1) | Healthcheck |

### ⚠️ Cambios que rompen

Respecto de lo que el front asumía antes de existir el backend:

- **Los roles son tres, no cinco.** `OWNER | PROFESSIONAL | ADMINISTRATIVE`.
  `SUPERADMIN`, `MANAGER` y `RECEPTIONIST` nunca existieron en el backend y se
  eliminaron del front.
- **El login devuelve solo tokens**, no el usuario. Los datos de la persona salen
  de `GET /auth/me`, que responde `{ user, tenant, employee }`.
- **No hay campo `name`**: son `firstName` y `lastName`.
- **El puerto es `:3001`**, no `:4000`.
- **Hay refresh token y rota en cada uso.** Reusar uno viejo revoca la sesión
  entera. Nunca refrescar por fuera de `lib/api.ts`.

### Qué se puede construir

- Toda la capa de sesión (ya integrada)
- Pantalla de Equipo (`/employees`)
- Pantalla de Configuración del negocio (`/tenants`, `/branches`)

### Todavía no

Servicios y precios, clientes, **turnos y disponibilidad**, pagos, portal público
de reservas. La agenda sigue con mock.

---

## Avisos de cambios que vienen

Cosas ya decididas que **van a romper** cuando lleguen. Conviene no construir
encima de ellas.

- **`POST /employees` va a dejar de devolver el link de activación.** Hoy el link
  viaja en la respuesta porque todavía no se mandan emails. Cuando se implemente
  el envío (antes de la Fase 7), desaparece de la respuesta. **No armar UI que
  dependa de mostrarlo.**

Resueltos:

- ~~`Patient` va a pasar a llamarse `Customer`~~ → es `Customer` desde la Fase 4.
- ~~`Service.price` va a ser un entero en centavos~~ → es `priceCents`.
- ~~`Professional` va a pasar a ser `Employee` con varias sucursales~~ → así es
  desde la Fase 2, y la Fase 3 lo lleva al catálogo: un servicio se presta por
  par `(empleado, sucursal)`.
