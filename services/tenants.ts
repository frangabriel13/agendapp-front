import { apiFetch } from "@/lib/api"
import type {
  Tenant,
  TenantBranding,
  TenantSettings,
  UpdateBrandingPayload,
  UpdateSettingsPayload,
  UpdateTenantPayload,
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
