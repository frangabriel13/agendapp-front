# Contrato de la API — agendapp-api

**El backend es la fuente de verdad.** Cuando el front y el backend no coinciden,
se cambia el front. Este documento explica las convenciones; el spec OpenAPI en
`http://localhost:3001/api-json` tiene la firma exacta de cada endpoint.

Repo del backend: `../agendapp-api` (NestJS 11 + Prisma 7 + Postgres).

---

## Levantar el backend

Desde `../agendapp-api`:

```bash
docker compose up -d      # Postgres en :5432
npm run seed:demo         # datos de demo realistas
npm run start:dev         # API en :3001
```

- Swagger navegable: <http://localhost:3001/api>
- Spec JSON: <http://localhost:3001/api-json>
- El backend ya tiene CORS habilitado para `http://localhost:3000`.

`NEXT_PUBLIC_API_URL` apunta a `http://localhost:3001` (ver `.env.local`).

### Datos de demo

`npm run seed:demo` crea el tenant **Peluquería Demo** con 2 sucursales con
horario, 1 feriado y 3 empleados:

| Email | Rol | Estado |
|---|---|---|
| `dueno@demo.test` | `OWNER` | activo |
| `profesional@demo.test` | `PROFESSIONAL` | activo, con turno partido y una ausencia |
| `invitada@demo.test` | `PROFESSIONAL` | pendiente de activación |

Contraseña de los activos: `demo1234`. El seed imprime el link de activación de
la empleada pendiente.

### Tipos generados

Con el backend corriendo:

```bash
npx openapi-typescript http://localhost:3001/api-json -o lib/api-types.ts
```

Regenerar cada vez que el backend suma endpoints.

---

## Autenticación

### Cómo funciona

`POST /auth/login` y `POST /auth/register` devuelven **solo tokens**:

```jsonc
{
  "accessToken": "eyJhbGci...",   // JWT, vive 15 minutos
  "refreshToken": "4f0a1e2c-...7b.Zm9vYmFy",  // token opaco, NO es un JWT
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

**No traen el usuario.** Los datos de la persona salen de `GET /auth/me`, que
devuelve tres bloques:

```jsonc
{
  "user":     { "id", "email", "firstName", "lastName", "phone", "emailVerifiedAt" },
  "tenant":   { "id", "businessName", "slug", "timezone", "currency", "language",
                "subscriptionStatus", "trialEndsAt" },
  "employee": { "id", "role", "isOwner" }
}
```

No hay campo `name`: son `firstName` y `lastName`. **El rol vive en
`employee.role`, no en `user`.**

### Rotación de refresh tokens — cuidado acá

Cada llamada a `POST /auth/refresh` **invalida el refresh token usado** y
devuelve uno nuevo. Si se presenta uno ya usado, el backend lo interpreta como
robo de credenciales y **revoca toda la familia de tokens**: el usuario queda
deslogueado.

Consecuencia: si dos requests se topan con un 401 al mismo tiempo y cada una
dispara su propio refresh, la segunda mata la sesión. `lib/api.ts` resuelve esto
manteniendo **un único refresh en vuelo**; el resto espera ese mismo resultado.
No hacer refresh por fuera de ese helper.

### Dónde vive todo esto en el front

| Archivo | Qué hace |
|---|---|
| `lib/api.ts` | Cliente HTTP: tokens, refresh serializado, `ApiError` |
| `services/auth.ts` | Llamadas a `/auth/*` |
| `features/auth/hooks/useAuth.ts` | `useSession`, `useLogin`, `useRegister`, `useLogout`, `canManage` |

Los tokens van en `localStorage` (`accessToken` / `refreshToken`). **Los datos
del usuario no se guardan**: se piden con `useSession()` y los cachea React Query,
así no queda una copia que se desactualiza sola.

### Rutas públicas

Solo estas no requieren token: `/health`, `/auth/register`, `/auth/login`,
`/auth/refresh`, `/auth/logout` y `POST /employees/activate`. Todo lo demás
responde 401 sin `Authorization`.

### Contraseñas

Mínimo 8 caracteres, con al menos una letra y un número
(`validateNewPassword` en `features/auth/utils/validators.ts`).

---

## Roles

```ts
type EmployeeRole = "OWNER" | "PROFESSIONAL" | "ADMINISTRATIVE"
```

Son **tres**, no cinco. El front tenía `SUPERADMIN`, `MANAGER` y `RECEPTIONIST`
inventados: no existen en el backend. `MANAGER` y `RECEPTIONIST` se colapsan en
`ADMINISTRATIVE`; `SUPERADMIN` queda fuera de scope hasta que exista un panel de
plataforma.

Escribir sucursales y empleados exige `OWNER` o `ADMINISTRATIVE`. Un
`PROFESSIONAL` puede leer, pero recibe **403** al intentar escribir. Usar
`canManage(role)` para esconder los controles que el rol no puede usar — eso es
UX, no seguridad: el backend valida siempre.

---

## Fechas y horas — la fuente de bugs más común

La API distingue **tres cosas** que en JavaScript tienden a colapsar en un `Date`:

| Concepto | Formato | Ejemplo | Qué es |
|---|---|---|---|
| **Hora de reloj** | `"HH:MM"` | `"09:30"` | Horario de pared, sin día ni zona |
| **Día de calendario** | `"YYYY-MM-DD"` | `"2026-08-13"` | Un día, sin hora |
| **Instante** | ISO 8601 | `"2026-08-13T14:30:00.000Z"` | Momento exacto (`createdAt`, `trialEndsAt`) |

**Reglas:**

1. Las horas de reloj (`opensAt`, `closesAt`) se manejan **como string**. Un
   `new Date("09:30")` no significa nada.
2. Los días de calendario también son **strings**. `new Date("2026-08-13")` se
   parsea como medianoche **UTC**, así que en Argentina se muestra como el 12 de
   agosto. Si hay que operar, partir el string o usar solo métodos UTC.
3. Solo los instantes son `Date` de verdad, y se muestran en el huso del usuario.

Día de la semana: entero **0 = domingo … 6 = sábado**, igual que `Date.getDay()`.

---

## Errores

Todos tienen la misma forma:

```jsonc
{
  "statusCode": 400,
  "message": "El email no tiene un formato válido",  // string O string[]
  "error": "Bad Request",
  "path": "/auth/register",
  "timestamp": "2026-08-13T14:30:00.000Z",
  "requestId": "a1b2c3d4-..."
}
```

**`message` puede ser string o array.** Los errores de validación devuelven un
array con un mensaje por campo. `lib/api.ts` normaliza siempre a `ApiError.messages:
string[]`, así que en los componentes se itera esa lista y no hace falta el chequeo.

Los mensajes vienen **en español** y son aptos para mostrar tal cual.

| Código | Significado |
|---|---|
| 400 | Datos inválidos. `messages` suele traer varios. |
| 401 | Token ausente o vencido. `lib/api.ts` refresca y reintenta solo. |
| 403 | El rol no alcanza. Reintentar no sirve. |
| 404 | No existe, o es de otro tenant (indistinguible a propósito). |
| 409 | Conflicto: nombre duplicado, solapamiento de horario. |
| 429 | Rate limit. Ver `Retry-After`. |

### Rate limiting

General: 10 requests por segundo y 100 por minuto.

**`/auth/register`, `/auth/login` y `PATCH /auth/password` son más estrictos: 5
por minuto.** Probando el login a mano se llega al 429 enseguida — no es un bug.
Los headers `X-RateLimit-*-short` / `-long` y `Retry-After` están expuestos por
CORS y se pueden leer desde el navegador (ojo con el sufijo: no existe un
`X-RateLimit-Limit` pelado).

---

## Validación estricta — la otra fuente de bugs

El backend corre con `forbidNonWhitelisted: true`: **si el body trae una
propiedad que el DTO no declara, la request falla con 400.** No la ignora.

El caso típico: traer un objeto con `GET`, cambiarle un campo y mandarlo entero
con `PATCH`. Van `id`, `createdAt` y `updatedAt` en el camino y se rechaza.
**Mandar solo los campos que se editan.**

---

## Multi-tenancy: invisible

El `tenantId` sale del JWT. **El front no lo manda nunca** — ni en el body, ni en
la query, ni en un header. Mandarlo hace fallar la request por la regla de arriba.

Por eso un recurso de otro negocio da **404 y no 403**: desde la sesión, no existe.

---

## Otras convenciones

- **IDs:** UUID v4 en string.
- **Plata:** enteros en **centavos**. Nunca decimales ni floats. (Desde Fase 3.)
- **Borrado:** soft delete. `DELETE` devuelve 204 y el recurso desaparece de los
  listados, pero no se borra.
- **`PUT` vs `PATCH`:** el `PUT` reemplaza el conjunto entero (el horario semanal
  exige los 7 días siempre); el `PATCH` modifica solo lo que se manda.

---

## Qué existe y qué no

**Disponible — 37 endpoints:**

| Área | Endpoints | Alcanza para |
|---|---|---|
| `/auth` | 6 | Sesión completa: registro, login, refresh, logout, perfil, cambio de contraseña |
| `/tenants` | 6 | Configuración del negocio, branding (colores y logo), preferencias |
| `/branches` | 11 | CRUD de sucursales, horario semanal, feriados y días especiales |
| `/employees` | 13 | CRUD, invitación con link, activación pública, permisos, asignación a sucursales, horario con turno partido, ausencias |
| `/health` | 1 | Healthcheck |

**Todavía no existe:** servicios y precios (Fase 3), clientes (Fase 4), **turnos y
disponibilidad (Fase 5)**, pagos (Fase 6), portal público de reservas (Fase 7).

La agenda sigue con mock (`features/appointments/data/mockData.ts`) y los tipos
`Professional`, `Service`, `Patient` y `Appointment` son provisorios: van a cambiar
cuando existan los endpoints. No vale la pena diseñar contra ellos todavía.

### Invitación de empleados

**Todavía no se mandan emails.** `POST /employees` devuelve el link de activación
en la respuesta; hoy hay que copiarlo a mano. `POST /employees/activate` es público
y es donde el empleado define su contraseña.

Cuando se implemente el envío por email (antes de la Fase 7), el link va a dejar de
venir en la respuesta. No construir UI que dependa de mostrarlo.

---

## Divergencias que quedaron pendientes

- El front se llama **reservApp** y el backend **AgendApp**. Falta unificar.
- `Professional` (front) es `Employee` (backend), y un empleado puede estar en
  **varias** sucursales, no en una. Se resuelve al integrar `/employees`.
- `Patient` (front) es `Customer` (backend, Fase 4).
- `Service.price` es `number`: cuando exista la Fase 3 pasa a **centavos enteros**.

---

## Referencia visual

Detalle de cada endpoint con request y response:
<https://claude.ai/code/artifact/8811087c-7075-43ac-8d5a-aece46ec26af>
