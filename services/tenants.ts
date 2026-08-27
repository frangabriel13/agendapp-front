import { apiFetch } from "@/lib/api"
import type {
  Tenant,
  TenantBranding,
  TenantSettings,
  UpdateBrandingPayload,
  UpdateSettingsPayload,
  UpdateTenantPayload,
  Subscription,
  SubscriptionCheckout,
} from "@/types"

/**
 * Los tres recursos son del mismo negocio pero se piden y se guardan por
 * separado: el backend los expone así, y de paso cada sección de la pantalla
 * guarda sola sin arrastrar a las otras.
 *
 * Todos los PATCH mandan solo lo que cambió: `forbidNonWhitelisted` rechaza
 * cualquier campo de más con un 400.
 */

export function getTenantRequest(): Promise<Tenant> {
  return apiFetch<Tenant>("/tenants/me")
}

export function updateTenantRequest(payload: UpdateTenantPayload): Promise<Tenant> {
  return apiFetch<Tenant>("/tenants/me", { method: "PATCH", body: JSON.stringify(payload) })
}

export function getBrandingRequest(): Promise<TenantBranding> {
  return apiFetch<TenantBranding>("/tenants/me/branding")
}

export function updateBrandingRequest(payload: UpdateBrandingPayload): Promise<TenantBranding> {
  return apiFetch<TenantBranding>("/tenants/me/branding", { method: "PATCH", body: JSON.stringify(payload) })
}

export function getSettingsRequest(): Promise<TenantSettings> {
  return apiFetch<TenantSettings>("/tenants/me/settings")
}

export function updateSettingsRequest(payload: UpdateSettingsPayload): Promise<TenantSettings> {
  return apiFetch<TenantSettings>("/tenants/me/settings", { method: "PATCH", body: JSON.stringify(payload) })
}

/**
 * La cuenta que el negocio le paga a reservApp.
 *
 * **Pide `OWNER` o `ADMINISTRATIVE`**: a un `PROFESSIONAL` le devuelve 403, y con
 * razón —no tiene por qué ver cuánto paga su empleador—. Quien la consulte tiene
 * que preguntar el rol antes, o se come un 403 con reintentos.
 *
 * Vive acá y no en `services/appointments.ts`, que es donde nació: la ruta es de
 * `/tenants` y ahora son dos llamadas, no una suelta arrimada al 402 de agendar.
 */
export function getSubscriptionRequest(): Promise<Subscription> {
  return apiFetch<Subscription>("/tenants/me/subscription")
}

/**
 * El link para pagar el mes. Mismo cobro en dos tiempos que el de un turno: crea
 * el pago **pendiente** y la suscripción se reactiva cuando avisa el proveedor.
 *
 * Dos cosas que sorprenden:
 * - **Estando al día genera el cobro del período siguiente**, no un duplicado del
 *   actual. Por eso la respuesta trae `periodStart`/`periodEnd`: hay que decir qué
 *   mes se está pagando
 * - **409 si el plan no tiene precio de lista** (Empresa, que se cotiza con
 *   soporte). Se pregunta antes con `sePuedePagar`, así el botón no existe en vez
 *   de existir para fallar
 */
export function createSubscriptionCheckoutRequest(): Promise<SubscriptionCheckout> {
  return apiFetch<SubscriptionCheckout>("/tenants/me/subscription/checkout", {
    method: "POST",
    body: JSON.stringify({}),
  })
}
