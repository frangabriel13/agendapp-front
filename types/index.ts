// Los tipos de esta sección espejan el contrato real de agendapp-api.
// Ver docs/api-contract.md. Ante una duda, manda el backend.

export type EmployeeRole = "OWNER" | "PROFESSIONAL" | "ADMINISTRATIVE"

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "PAUSED"

/** Respuesta de POST /auth/login, /auth/register y /auth/refresh. */
export interface AuthTokens {
  accessToken: string
  /** Token opaco, no es un JWT. Se rota en cada uso. */
  refreshToken: string
  tokenType: string
  /** Segundos de vida del access token. */
  expiresIn: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  businessName: string
}

export interface SessionUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  emailVerifiedAt: string | null
}

export interface SessionTenant {
  id: string
  businessName: string
  slug: string
  timezone: string
  currency: string
  language: string
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: string | null
}

export interface SessionEmployee {
  id: string
  role: EmployeeRole
  isOwner: boolean
}

/** Respuesta de GET /auth/me: quién sos, en qué negocio y con qué rol. */
export interface Session {
  user: SessionUser
  tenant: SessionTenant
  employee: SessionEmployee
}

/**
 * Sucursal tal como la devuelve GET /branches.
 * No lleva tenant: el backend lo saca del JWT y rechaza la request si se lo mandan.
 */
export interface Branch {
  id: string
  name: string
  address: string | null
  phone: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** 0 = domingo … 6 = sábado, igual que Date.getDay(). Horas como "HH:MM". */
export interface BusinessHour {
  dayOfWeek: number
  isClosed: boolean
  opensAt: string | null
  closesAt: string | null
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
