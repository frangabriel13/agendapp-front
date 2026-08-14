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
- **`Service.price` va a ser un entero en centavos**, no un decimal. El tipo
  actual en `types/index.ts` es provisorio.
- **`Professional` va a pasar a ser `Employee`**, y un empleado puede estar
  asignado a **varias** sucursales, no a una.
- **`Patient` va a pasar a llamarse `Customer`** (Fase 4).
