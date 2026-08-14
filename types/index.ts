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
