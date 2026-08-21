import { apiFetch } from "@/lib/api"
import type {
  CreateCustomerPayload,
  CreateTagPayload,
  Customer,
  CustomerTag,
  CustomerTagSummary,
  PaginatedCustomers,
  UpdateCustomerPayload,
  UpdateTagPayload,
} from "@/types"

export interface CustomerQuery {
  page?: number
  pageSize?: number
  /** Una sola caja: el backend cruza nombre, apellido, email y teléfono a la vez. */
  search?: string
  tagId?: string
}

/**
 * El listado paginado. Devuelve `{ data, meta }`, no un array suelto.
 *
 * `page` arranca en 1 y `pageSize` va de 1 a 100 (pedir más da 400). Una página
 * más allá del final devuelve `data: []` con el `meta` correcto, **no un 404**:
 * la pantalla no tiene que tratar eso como un error.
 */
export function listCustomersRequest(query: CustomerQuery = {}): Promise<PaginatedCustomers> {
  const params = new URLSearchParams()
  if (query.page) params.set("page", String(query.page))
  if (query.pageSize) params.set("pageSize", String(query.pageSize))
  // El backend cruza los campos por su cuenta; mandar el texto crudo alcanza.
  if (query.search?.trim()) params.set("search", query.search.trim())
  if (query.tagId) params.set("tagId", query.tagId)

  const qs = params.toString()
  return apiFetch<PaginatedCustomers>(`/customers${qs ? `?${qs}` : ""}`)
}

export function getCustomerRequest(id: string): Promise<Customer> {
  return apiFetch<Customer>(`/customers/${id}`)
}

/**
 * Alta.
 *
 * **Un 409 acá no es un fallo: es un duplicado de teléfono**, y el cuerpo trae
 * `existingCustomer` con la ficha ya cargada. La pantalla lo lee con
 * `errorDetail` y ofrece abrirla, en vez de mostrar un cartel rojo.
 */
export function createCustomerRequest(payload: CreateCustomerPayload): Promise<Customer> {
  return apiFetch<Customer>("/customers", { method: "POST", body: JSON.stringify(payload) })
}

/** Pasa por el mismo chequeo: cambiar un teléfono a uno ya usado también da 409. */
export function updateCustomerRequest(
  id: string,
  payload: UpdateCustomerPayload,
): Promise<Customer> {
  return apiFetch<Customer>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
}

/** Dar de baja **libera su teléfono** para una ficha nueva. Es OWNER / ADMINISTRATIVE. */
export function removeCustomerRequest(id: string): Promise<void> {
  return apiFetch<void>(`/customers/${id}`, { method: "DELETE" })
}

export function getCustomerTagsRequest(id: string): Promise<CustomerTagSummary[]> {
  return apiFetch<CustomerTagSummary[]>(`/customers/${id}/tags`)
}

/** Reemplaza el set completo. `[]` se las saca todas. */
export function setCustomerTagsRequest(id: string, tagIds: string[]): Promise<CustomerTagSummary[]> {
  return apiFetch<CustomerTagSummary[]>(`/customers/${id}/tags`, {
    method: "PUT",
    body: JSON.stringify({ tagIds }),
  })
}

// --- Etiquetas -------------------------------------------------------------

export function listTagsRequest(): Promise<CustomerTag[]> {
  return apiFetch<CustomerTag[]>("/customer-tags")
}

export function createTagRequest(payload: CreateTagPayload): Promise<CustomerTag> {
  return apiFetch<CustomerTag>("/customer-tags", { method: "POST", body: JSON.stringify(payload) })
}

export function updateTagRequest(id: string, payload: UpdateTagPayload): Promise<CustomerTag> {
  return apiFetch<CustomerTag>(`/customer-tags/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

/** Dar de baja una etiqueta **la saca de todos los clientes** que la tenían. */
export function removeTagRequest(id: string): Promise<void> {
  return apiFetch<void>(`/customer-tags/${id}`, { method: "DELETE" })
}
