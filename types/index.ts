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

/** Categoría del catálogo. Ordena por `displayOrder` y, a igual valor, alfabético. */
export type ServiceCategory = Schema["ServiceCategoryResponseDto"]

export type CreateCategoryPayload = Schema["CreateServiceCategoryDto"]

export type UpdateCategoryPayload = Schema["UpdateServiceCategoryDto"]

/**
 * Servicio del catálogo.
 *
 * **`priceCents` y `depositAmountCents` van en centavos**: `1500000` son $15.000.
 * No confundir con `MockService`, que trae el precio en pesos enteros.
 * `depositAmountCents` en `null` significa que el servicio no pide seña.
 */
export type Service = Schema["ServiceResponseDto"]

/** Mismo parche que en `InviteEmployeePayload`: el spec deja estos campos sin tipo. */
type UntypedService = "description" | "categoryId" | "depositAmountCents" | "color"

export type CreateServicePayload = Omit<Schema["CreateServiceDto"], UntypedService> & {
  description?: string
  categoryId?: string
  depositAmountCents?: number
  color?: string
}

export type UpdateServicePayload = Omit<Schema["UpdateServiceDto"], UntypedService> & {
  description?: string | null
  categoryId?: string | null
  depositAmountCents?: number | null
  color?: string | null
}

/** Quién presta un servicio **y en qué sucursal**. El par es la unidad, no la persona. */
export type ServiceEmployee = Schema["ServiceEmployeeResponseDto"]

/** El par tal como se escribe en PUT /services/:id/employees. */
export type ServiceEmployeeInput = Schema["ServiceEmployeeDto"]

/** Recurso que un servicio necesita ocupar (una sala, una camilla). */
export type ServiceResource = Schema["ServiceResourceResponseDto"]

/** Camilla, sala o sillón. El nombre es único **por sucursal**. */
export type Resource = Schema["ResourceResponseDto"]

export type CreateResourcePayload = Omit<Schema["CreateResourceDto"], "description"> & {
  description?: string
}

export type UpdateResourcePayload = Omit<Schema["UpdateResourceDto"], "description"> & {
  description?: string | null
}

/**
 * Cliente del negocio.
 *
 * **El teléfono es lo que identifica a una persona, no el nombre.** Se guarda
 * como lo tipeó el usuario y se muestra tal cual, pero el backend lo compara
 * normalizado (los últimos 10 dígitos): `+54 9 11 5555-1234` y `(011) 5555.1234`
 * son la misma persona. **No hay que normalizar nada en el front.**
 */
export type Customer = Schema["CustomerResponseDto"]

/** Etiqueta de cliente ("VIP", "Debe seña"). `customerCount` dice a cuántos alcanza. */
export type CustomerTag = Schema["CustomerTagResponseDto"]

/** La etiqueta como viene colgada de un cliente: solo lo que hace falta para el chip. */
export type CustomerTagSummary = Schema["CustomerTagSummaryDto"]

/** `{ data, meta }`. La primera respuesta paginada de la API; se repite en turnos y pagos. */
export type PaginatedCustomers = Schema["PaginatedCustomersDto"]

/**
 * La ficha que viaja dentro del **409** de `POST /customers` y `PATCH
 * /customers/:id`, en el campo `existingCustomer`.
 *
 * Ojo con el nombre del spec: `DuplicateCustomerDto` es el **cuerpo entero del
 * error** —`statusCode`, `message`, `error` y la ficha—, no la ficha sola. Por
 * eso acá se indexa `["existingCustomer"]`.
 *
 * Está ahí para poder ofrecer "¿es esta persona?" sin ir a buscarla con otra
 * request. **No hay merge automático a propósito**: dos personas pueden
 * compartir teléfono —una madre y su hija—, y unir dos historiales es una
 * decisión de quien atiende.
 */
export type DuplicateCustomer = Schema["DuplicateCustomerDto"]["existingCustomer"]

type UntypedCustomer = "lastName" | "email" | "dateOfBirth" | "notes"

export type CreateCustomerPayload = Omit<Schema["CreateCustomerDto"], UntypedCustomer> & {
  lastName?: string
  email?: string
  dateOfBirth?: string
  notes?: string
}

export type UpdateCustomerPayload = Omit<Schema["UpdateCustomerDto"], UntypedCustomer> & {
  lastName?: string | null
  email?: string | null
  dateOfBirth?: string | null
  notes?: string | null
}

export type CreateTagPayload = Omit<Schema["CreateCustomerTagDto"], "color"> & { color?: string }

export type UpdateTagPayload = Omit<Schema["UpdateCustomerTagDto"], "color"> & {
  color?: string | null
}

/**
 * Los siete estados de un turno. **No son los cinco del mock viejo.**
 *
 * Hay dos formas de cancelar —quién canceló cambia la política de devolución— y
 * `RESCHEDULED` es el estado del turno *viejo* cuando se reprogramó: el nuevo es
 * otro registro, enlazado por `rescheduledFromId` / `rescheduledToId`.
 */
export type AppointmentStatus = Schema["AppointmentResponseDto"]["status"]

/** Uno de los servicios del turno, con el precio y la duración **congelados al reservar**. */
export type AppointmentService = Schema["AppointmentServiceDto"]

/** El turno tal como lo devuelve la API. */
export type ApiAppointment = Schema["AppointmentResponseDto"]

/**
 * El turno como lo usa el panel: el de la API **más** el día y las horas de pared.
 *
 * `startsAt` es un instante y un calendario dibuja horas de reloj, así que la
 * conversión se hace **una sola vez**, al traer los turnos (`toAppointment` en
 * `services/appointments.ts`). Los tres campos son derivados: nadie los manda de
 * vuelta al backend.
 *
 * No se pierde nada del original: `services` sigue siendo una lista —un turno
 * puede encadenar varios—, el precio sigue en `totalPriceCents` y **congelado al
 * reservar**, y los estados son los siete reales.
 */
export interface Appointment extends ApiAppointment {
  /** "YYYY-MM-DD" local. Derivado de `startsAt`. */
  day: string
  /** "HH:MM" local. Derivado de `startsAt`. */
  startTime: string
  /** "HH:MM" local. Derivado de `endsAt`. */
  endTime: string
}

/** Un hueco reservable de `GET /appointments/availability`. */
export type AvailabilitySlot = Schema["AvailabilitySlotDto"]

export type Availability = Schema["AvailabilityResponseDto"]

export type CreateAppointmentPayload = Omit<Schema["CreateAppointmentDto"], "notes"> & {
  notes?: string
}

/** Estado de la suscripción del negocio. El 402 al agendar se explica con esto. */
export type Subscription = Schema["SubscriptionDto"]
