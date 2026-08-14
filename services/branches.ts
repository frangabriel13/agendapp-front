import { apiFetch } from "@/lib/api"
import type {
  Branch,
  BranchDetail,
  BusinessHour,
  BusinessHourInput,
  CreateBranchPayload,
  CreateSpecialDayPayload,
  SpecialDay,
  UpdateBranchPayload,
} from "@/types"

export function listBranchesRequest(): Promise<Branch[]> {
  return apiFetch<Branch[]>("/branches")
}

/** El detalle agrega la semana comercial, que el listado no trae. */
export function getBranchRequest(id: string): Promise<BranchDetail> {
  return apiFetch<BranchDetail>(`/branches/${id}`)
}

export function createBranchRequest(payload: CreateBranchPayload): Promise<Branch> {
  return apiFetch<Branch>("/branches", { method: "POST", body: JSON.stringify(payload) })
}

export function updateBranchRequest(id: string, payload: UpdateBranchPayload): Promise<Branch> {
  return apiFetch<Branch>(`/branches/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
}

export function removeBranchRequest(id: string): Promise<void> {
  return apiFetch<void>(`/branches/${id}`, { method: "DELETE" })
}

export function getBusinessHoursRequest(id: string): Promise<BusinessHour[]> {
  return apiFetch<BusinessHour[]>(`/branches/${id}/business-hours`)
}

/**
 * Reemplaza la semana comercial completa. El backend espera **los 7 días, sin
 * repetir ninguno**, envueltos en `{ days }`.
 *
 * Ojo con los días cerrados: en la lectura vienen con `opensAt: null`, pero al
 * escribir hay que **omitir** el campo. Mandar `null` es un 400. Lo resuelve
 * `toPayload` en `features/branches/lib/businessHours.ts`.
 */
export function setBusinessHoursRequest(id: string, days: BusinessHourInput[]): Promise<BusinessHour[]> {
  return apiFetch<BusinessHour[]>(`/branches/${id}/business-hours`, {
    method: "PUT",
    body: JSON.stringify({ days }),
  })
}

export function listSpecialDaysRequest(id: string): Promise<SpecialDay[]> {
  return apiFetch<SpecialDay[]>(`/branches/${id}/special-days`)
}

export function createSpecialDayRequest(id: string, payload: CreateSpecialDayPayload): Promise<SpecialDay> {
  return apiFetch<SpecialDay>(`/branches/${id}/special-days`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function removeSpecialDayRequest(id: string, specialDayId: string): Promise<void> {
  return apiFetch<void>(`/branches/${id}/special-days/${specialDayId}`, { method: "DELETE" })
}
