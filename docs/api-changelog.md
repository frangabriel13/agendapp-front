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
- **`Patient` va a pasar a llamarse `Customer`** (Fase 4).

Resueltos (ver la entrada de la Fase 3):

- ~~`Service.price` va a ser un entero en centavos~~ → es `priceCents`.
- ~~`Professional` va a pasar a ser `Employee` con varias sucursales~~ → así es
  desde la Fase 2, y la Fase 3 lo lleva al catálogo: un servicio se presta por
  par `(empleado, sucursal)`.
