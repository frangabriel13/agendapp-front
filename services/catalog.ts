import { apiFetch } from "@/lib/api"
import type {
  CreateCategoryPayload,
  CreateResourcePayload,
  CreateServicePayload,
  Resource,
  Service,
  ServiceCategory,
  ServiceEmployee,
  ServiceEmployeeInput,
  ServiceResource,
  UpdateCategoryPayload,
  UpdateResourcePayload,
  UpdateServicePayload,
} from "@/types"

// --- Categorías ------------------------------------------------------------

export function listCategoriesRequest(): Promise<ServiceCategory[]> {
  return apiFetch<ServiceCategory[]>("/service-categories")
}

export function createCategoryRequest(payload: CreateCategoryPayload): Promise<ServiceCategory> {
  return apiFetch<ServiceCategory>("/service-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateCategoryRequest(
  id: string,
  payload: UpdateCategoryPayload,
): Promise<ServiceCategory> {
  return apiFetch<ServiceCategory>(`/service-categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

/**
 * Da de baja la categoría. **No borra sus servicios**: quedan con
 * `category: null`, y por eso la pantalla tiene que poder listar los sueltos.
 */
export function removeCategoryRequest(id: string): Promise<void> {
  return apiFetch<void>(`/service-categories/${id}`, { method: "DELETE" })
}

// --- Servicios -------------------------------------------------------------

export function listServicesRequest(): Promise<Service[]> {
  return apiFetch<Service[]>("/services")
}

export function createServiceRequest(payload: CreateServicePayload): Promise<Service> {
  return apiFetch<Service>("/services", { method: "POST", body: JSON.stringify(payload) })
}

export function updateServiceRequest(id: string, payload: UpdateServicePayload): Promise<Service> {
  return apiFetch<Service>(`/services/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
}

export function removeServiceRequest(id: string): Promise<void> {
  return apiFetch<void>(`/services/${id}`, { method: "DELETE" })
}

// --- Quién presta qué, y dónde ---------------------------------------------

export function getServiceEmployeesRequest(id: string): Promise<ServiceEmployee[]> {
  return apiFetch<ServiceEmployee[]>(`/services/${id}/employees`)
}

/**
 * Reemplaza la lista completa de pares (empleado, sucursal). Mandar `[]` deja el
 * servicio sin nadie que lo preste.
 *
 * **Cada par se valida contra las sucursales del empleado**: si esa persona no
 * trabaja ahí, el backend responde 400. Por eso la pantalla apaga esas casillas
 * en vez de dejar mandar la combinación y explicar el error después.
 */
export function setServiceEmployeesRequest(
  id: string,
  assignments: ServiceEmployeeInput[],
): Promise<ServiceEmployee[]> {
  return apiFetch<ServiceEmployee[]>(`/services/${id}/employees`, {
    method: "PUT",
    body: JSON.stringify({ assignments }),
  })
}

export function getServiceResourcesRequest(id: string): Promise<ServiceResource[]> {
  return apiFetch<ServiceResource[]>(`/services/${id}/resources`)
}

/** También reemplaza todo, igual que las asignaciones y las sucursales del empleado. */
export function setServiceResourcesRequest(
  id: string,
  resourceIds: string[],
): Promise<ServiceResource[]> {
  return apiFetch<ServiceResource[]>(`/services/${id}/resources`, {
    method: "PUT",
    body: JSON.stringify({ resourceIds }),
  })
}

// --- Recursos --------------------------------------------------------------

export function listResourcesRequest(): Promise<Resource[]> {
  return apiFetch<Resource[]>("/resources")
}

/**
 * Alta de un recurso. **Es feature de plan**: con el plan Básico devuelve 403 con
 * el mensaje ya redactado por el backend, que se muestra tal cual. El gate corre
 * solo acá — un negocio que baja de plan sigue editando lo que ya tenía.
 *
 * El nombre es único **por sucursal**, así que "Camilla 1" puede existir en dos
 * sucursales pero no dos veces en la misma: eso es 409.
 */
export function createResourceRequest(payload: CreateResourcePayload): Promise<Resource> {
  return apiFetch<Resource>("/resources", { method: "POST", body: JSON.stringify(payload) })
}

export function updateResourceRequest(
  id: string,
  payload: UpdateResourcePayload,
): Promise<Resource> {
  return apiFetch<Resource>(`/resources/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
}

export function removeResourceRequest(id: string): Promise<void> {
  return apiFetch<void>(`/resources/${id}`, { method: "DELETE" })
}
