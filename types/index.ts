// Los tipos de esta sección NO se escriben a mano: derivan de `lib/api-types.ts`,
// que se genera desde el spec OpenAPI del backend con `npm run types:api`.
// Si el backend cambia un campo, el error sale en `tsc`, no en el navegador.
// Ver docs/api-contract.md y docs/api-changelog.md.

import type { components } from "@/lib/api-types"

type Schema = components["schemas"]

export type EmployeeRole = Schema["MeEmployeeDto"]["role"]

export type SubscriptionStatus = Schema["MeTenantDto"]["subscriptionStatus"]

/** Respuesta de POST /auth/login, /auth/register y /auth/refresh. */
export type AuthTokens = Schema["AuthTokensDto"]

export type LoginCredentials = Schema["LoginDto"]

export type RegisterPayload = Schema["RegisterDto"]

export type SessionUser = Schema["MeUserDto"]

export type SessionTenant = Schema["MeTenantDto"]

export type SessionEmployee = Schema["MeEmployeeDto"]

/** Respuesta de GET /auth/me: quién sos, en qué negocio y con qué rol. */
export type Session = Schema["MeResponseDto"]

/**
 * Sucursal tal como la devuelve GET /branches.
 * No lleva tenant: el backend lo saca del JWT y rechaza la request si se lo mandan.
 */
export type Branch = Schema["BranchResponseDto"]

/**
 * Horario tal como se lee. 0 = domingo … 6 = sábado. Horas como "HH:MM".
 * Ojo: no es la misma forma que se manda al escribir, ver `BusinessHourInput`.
 */
export type BusinessHour = Schema["BusinessHourResponseDto"]

/**
 * Horario tal como se escribe en PUT /branches/:id/business-hours. Difiere del
 * de lectura: acá los días cerrados **omiten** `opensAt`/`closesAt`, no los
 * mandan en `null`. Mandar `null` es un 400.
 */
export type BusinessHourInput = Schema["BusinessHourDto"]

/** El detalle de una sucursal trae además su semana comercial. */
export type BranchDetail = Schema["BranchDetailResponseDto"]

export type CreateBranchPayload = Omit<Schema["CreateBranchDto"], "address" | "phone"> & {
  address?: string
  phone?: string
}

export type UpdateBranchPayload = Omit<Schema["UpdateBranchDto"], "address" | "phone"> & {
  address?: string | null
  phone?: string | null
}

/** Feriado (`isClosed`) u horario especial de un día puntual. */
export type SpecialDay = Schema["SpecialDayResponseDto"]

export type CreateSpecialDayPayload = Omit<Schema["CreateSpecialDayDto"], "description"> & {
  description?: string
}

/** Datos del negocio. GET /tenants/me trae además el plan contratado. */
export type Tenant = Schema["TenantResponseDto"]

export type TenantPlan = Schema["TenantPlanDto"]

export type UpdateTenantPayload = Schema["UpdateTenantDto"]

export type TenantBranding = Schema["TenantBrandingResponseDto"]

export type UpdateBrandingPayload = Omit<
  Schema["UpdateTenantBrandingDto"],
  "logoUrl" | "primaryColor" | "description"
> & {
  logoUrl?: string | null
  primaryColor?: string | null
  description?: string | null
}

export type TenantSettings = Schema["TenantSettingsResponseDto"]

export type RefundType = TenantSettings["cancellationRefundType"]

export type UpdateSettingsPayload = Schema["UpdateTenantSettingsDto"]

/** Empleado tal como lo devuelve GET /employees. */
export type Employee = Schema["EmployeeResponseDto"]

/** El detalle de GET /employees/:id agrega las sucursales asignadas. */
export type EmployeeDetail = Schema["EmployeeDetailResponseDto"]

export type EmployeeStatus = Employee["status"]

/**
 * Roles que se pueden asignar. `OWNER` queda afuera a propósito: es de quien
 * creó el negocio y el backend no deja moverlo.
 */
export type AssignableRole = Schema["UpdateEmployeeDto"]["role"] & string

/**
 * El spec declara `phone`, `hiredAt`, `bio` y `avatarUrl` sin tipo, así que
 * openapi-typescript los genera como `Record<string, never>` — un objeto vacío,
 * inservible para mandar un string. Se reemplazan por lo que el backend acepta
 * de verdad; el resto sigue derivando, así un cambio del spec rompe el `tsc`.
 *
 * Si algún día el spec los tipa bien, este `Omit` se puede borrar y no se pierde
 * nada.
 */
type Untyped = "phone" | "hiredAt" | "bio" | "avatarUrl"

export type InviteEmployeePayload = Omit<Schema["InviteEmployeeDto"], Untyped> & {
  phone?: string
  hiredAt?: string
  bio?: string
}

export type UpdateEmployeePayload = Omit<Schema["UpdateEmployeeDto"], Untyped> & {
  hiredAt?: string | null
  bio?: string | null
}

/**
 * Respuesta de la invitación. `activationUrl` **se muestra una sola vez**: el
 * backend no lo vuelve a dar, hay que reenviar la invitación para obtener otro.
 */
export type EmployeeInvitation = Schema["EmployeeInvitationResponseDto"]

/** Cuerpo de POST /employees/activate: el token del link más la contraseña elegida. */
export type ActivateAccountPayload = Schema["ActivateEmployeeDto"]

/**
 * Tramo de trabajo tal como se lee de GET /employees/:id/schedules.
 * Horas de reloj ("09:00"), y `dayOfWeek` 0 = domingo … 6 = sábado, igual que
 * `Date.getDay()`.
 */
export type EmployeeShift = Schema["EmployeeShiftResponseDto"]

/**
 * Tramo tal como se escribe. **No lleva `id`**: el PUT reemplaza la semana
 * entera, así que reusar un tramo leído exige sacarle el `id` antes de mandarlo
 * o el backend responde 400.
 */
export type EmployeeShiftInput = Schema["EmployeeShiftDto"]

/**
 * Ausencia tal como se lee. A diferencia de los tramos, `startsAt` y `endsAt`
 * son **instantes ISO con zona**, no horas de reloj. `branchId` en `null`
 * significa "en ninguna sucursal", que es el caso normal de unas vacaciones.
 */
export type TimeOff = Schema["TimeOffResponseDto"]

/** Mismo parche que en `InviteEmployeePayload`: el spec deja estos campos sin tipo. */
export type CreateTimeOffPayload = Omit<Schema["CreateTimeOffDto"], "branchId" | "reason"> & {
  branchId?: string | null
  reason?: string
}

// ---------------------------------------------------------------------------
// Lo de acá abajo todavía no tiene backend (Fases 3 a 5). Son los tipos que
// sostienen el mock de la agenda; van a cambiar cuando existan los endpoints.
// ---------------------------------------------------------------------------

export interface Professional {
  id: string
  name: string
  email: string
  specialty: string
  branchId: string
  color: string
}

export interface Equipment {
  id: string
  name: string
  quantity: number
  branchId: string
}

export interface Service {
  id: string
  name: string
  duration: number
  price: number
  equipmentId?: string
  equipment?: Equipment
}

export interface Patient {
  id: string
  name: string
  phone: string
  email?: string
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show"

export interface Appointment {
  id: string
  patientId: string
  patient: Patient
  professionalId: string
  professional: Professional
  serviceId: string
  service: Service
  branchId: string
  date: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  notes?: string
}
