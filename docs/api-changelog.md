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

## Fase 6 (parte 2) — Suscripción del negocio (2026-08-20)

2 endpoints nuevos y **un código de error nuevo que puede aparecer en un
endpoint que ya usabas**. Leer eso último antes de seguir.

### Nuevo

| Área | Qué trae |
|---|---|
| `/tenants/me/subscription` (2) | Estado de la suscripción del negocio y el link para pagar el mes |

### ⚠️ Cambios que rompen

**`POST /appointments` y `POST /appointments/recurring` ahora pueden devolver
`402 Payment Required`.** Pasa cuando el negocio hace más de 7 días que no paga
su suscripción. Si el manejador de errores no lo contempla, va a caer en el
"error inesperado" genérico, que es lo peor que puede pasar acá: el usuario no
se entera de que tiene que pagar.

El mensaje viene escrito y es mostrable tal cual. Vale la pena un tratamiento
propio: es el único error de la API que se arregla pagando, no reintentando ni
corrigiendo el formulario.

**Es 402 y no 403 a propósito**, para que se pueda distinguir de un problema de
permisos sin leer el mensaje.

### Lo que sigue funcionando aunque el negocio deba

Ver la agenda, cancelar, reprogramar y pagar la suscripción. Se corta **crear
turnos nuevos**, nada más. No hace falta esconder media app: alcanza con un
aviso y con manejar el 402 donde puede aparecer.

### La pantalla de facturación

`GET /tenants/me/subscription` trae estado, plan, período, historial de cobros y
dos campos que conviene mostrar juntos:

- **`daysOverdue`** — días completos de atraso, `0` si está al día.
- **`blocked`** — si ya no puede agendar.

**Hay una ventana entre uno y otro**: durante `graceDays` (hoy 7), `daysOverdue`
ya es mayor que cero pero `blocked` sigue en `false`. Ese es el momento de
avisar; después ya es tarde.

Los dos endpoints piden rol **`OWNER` o `ADMINISTRATIVE`** (un profesional no
tiene por qué ver cuánto paga su empleador), y el checkout se comporta igual que
el de los turnos: link, cobro pendiente, y reactivación cuando llega el aviso.
Pedirlo dos veces devuelve el mismo link. Plan sin precio de lista (Empresa) da
409.

**Faltan tres pantallas de retorno**: `/suscripcion/exito`, `/suscripcion/error`
y `/suscripcion/pendiente`.

---

## Fase 6 (parte 1) — Cobros de turnos (2026-08-20)

4 endpoints nuevos. **No rompe nada.** Con esto se puede cobrar la seña online,
registrar efectivo y mostrar cuánto debe cada turno.

### Nuevo

| Área | Qué trae |
|---|---|
| `/appointments/:id/payments` (3) | Saldo del turno, link de pago online, pagos manuales y devoluciones |
| `/webhooks` (1) | Aviso de Mercado Pago. **No lo llama el front** |

### ⚠️ Cambios que rompen

Ninguno.

### Lo que hay que entender antes de escribir la pantalla

**El saldo viene calculado: no lo recalcules.** `GET /appointments/:id/payments`
devuelve `{ balance, payments }`. Usá `balance` tal cual. Hay dos formas
distintas de representar plata que vuelve —un pago que el proveedor revirtió y
una devolución nuestra— y sumar `payments` a mano cuenta una de más.

| Campo de `balance` | Qué es |
|---|---|
| `paidCents` | Lo que quedó en la caja, ya restadas las devoluciones. **Puede ser negativo** |
| `dueCents` | Lo que falta cobrar. Nunca negativo |
| `depositCovered` | Si la seña está cubierta (sin seña configurada, `true`) |
| `fullyPaid` | Si está todo pago |

**El cobro online es en dos tiempos.** `POST .../payments/checkout` devuelve el
`checkoutUrl` y deja el pago **pendiente**: el turno todavía no está pago. Lo
confirma Mercado Pago avisándole al backend, que puede tardar de segundos a
minutos. Después de mandar al cliente al checkout hay que **volver a consultar
el saldo**, no asumir nada.

**Faltan tres pantallas de retorno**: `/pago/exito`, `/pago/error` y
`/pago/pendiente`. Cuidado con la primera: que el cliente vuelva por ahí **no
garantiza** que el pago se haya acreditado.

### Cuatro cosas que van a parecer un bug y no lo son

1. **Pedir el checkout dos veces devuelve el mismo link**, con `reused: true`.
   Es a propósito: si el usuario hace doble clic, no se generan dos cobros.
2. **El tipo de cobro se deduce solo** si no mandás `paymentType`: la seña
   cuando el turno tiene una sin cubrir, el saldo en cualquier otro caso.
3. **`REFUND` da 400 en el checkout** y `MERCADOPAGO` da 400 en el pago manual.
   No es un enum incompleto: una devolución no se cobra online, y un pago de MP
   no se carga a mano porque lo crea el checkout.
4. **En desarrollo no se cobra nada.** El `checkoutUrl` apunta a
   `/pago/exito?sandbox=<paymentId>`. Para simular que se pagó:
   ```bash
   curl -X POST http://localhost:3001/webhooks/mercadopago \
     -H 'Content-Type: application/json' \
     -d '{"type":"payment","data":{"id":"sandbox-payment-1"}}'
   ```

---

## Mails transaccionales (2026-08-20)

4 endpoints nuevos y **tres pantallas que hay que construir en el front**. No
rompe nada, pero sí desbloquea el flujo de "olvidé mi contraseña", que hasta hoy
no existía.

### Nuevo

| Área | Qué trae |
|---|---|
| `/auth` (4) | `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/verify-email`, `POST /auth/verify-email/resend` |

### ⚠️ Cambios que rompen

Ninguno. `POST /employees` suma un campo (`emailSent`) y **no saca ninguno**: el
`activationUrl` sigue viniendo igual.

### Pantallas

| Ruta | Estado | Qué le falta |
|---|---|---|
| `/activar?token=` | ✅ hecha | Nada |
| `/olvide-contrasena` | ⚠️ placeholder | Dice "estará disponible muy pronto" y manda a soporte. **Ya no hace falta**: cablearla a `POST /auth/forgot-password` |
| `/restablecer?token=` | ❌ falta | `POST /auth/reset-password` |
| `/verificar-email?token=` | ❌ falta | `POST /auth/verify-email` |

Las que reciben token son públicas, lo toman por query string y devuelven **400
con un mensaje ya escrito en castellano** cuando el link no sirve: mostralo tal
cual en vez de inventar uno. El token vale **una sola vez**, así que conviene
redirigir apenas la llamada sale bien — si el usuario recarga, el segundo
intento da 400 y parece un error cuando no lo es. `/activar` ya resuelve ese
patrón (token leído con `useSearchParams` dentro de un `Suspense`): las dos que
faltan pueden copiarlo.

### Cuatro cosas que van a parecer un bug y no lo son

1. **`forgot-password` devuelve 204 aunque el email no exista.** Es a propósito:
   si contestara distinto, cualquiera podría averiguar qué emails tienen cuenta
   sin necesidad de credenciales. La UI **no puede** decir "ese email no está
   registrado" — el mensaje correcto es del tipo "si esa dirección tiene una
   cuenta, te mandamos el link".
2. **Después de un reset, el refresh token guardado deja de servir.** El reset
   cierra todas las sesiones abiertas a propósito (si alguien más había entrado,
   dejarle la sesión viva volvería inútil el cambio). Hay que mandar al login,
   no intentar refrescar.
3. **Pedir el link dos veces invalida el primero.** Vale el del mail más nuevo.
   Si llegan desordenados y el usuario abre el viejo, es 400.
4. **En desarrollo no llega ningún mail.** El back arranca con
   `MAIL_PROVIDER=log`, que escribe el link en su propia consola en vez de
   mandarlo. Para probar estas pantallas, el link se copia de ahí.

### Otro detalle

`GET /auth/me` ya traía `user.emailVerifiedAt`; ahora **se llena de verdad**. En
`null` = sin confirmar, y ahí tiene sentido un cartel con "reenviar" que llame a
`POST /auth/verify-email/resend` (409 si ya estaba confirmado). Hoy no bloquea
nada: es informativo.

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
