"use client"

import { useQueries, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiErrorMessage } from "@/lib/errors"
import { getEmployeeRequest } from "@/services/employees"
import {
  createCategoryRequest,
  createResourceRequest,
  createServiceRequest,
  getServiceEmployeesRequest,
  getServiceResourcesRequest,
  listCategoriesRequest,
  listResourcesRequest,
  listServicesRequest,
  removeCategoryRequest,
  removeResourceRequest,
  removeServiceRequest,
  setServiceEmployeesRequest,
  setServiceResourcesRequest,
  updateCategoryRequest,
  updateResourceRequest,
  updateServiceRequest,
} from "@/services/catalog"
import type {
  CreateCategoryPayload,
  CreateResourcePayload,
  CreateServicePayload,
  Employee,
  ServiceEmployeeInput,
  UpdateCategoryPayload,
  UpdateResourcePayload,
  UpdateServicePayload,
} from "@/types"
import { EMPLOYEES_KEY } from "@/features/employees/hooks/useEmployees"
import { employeeName, type MatrixEmployee } from "../lib/assignments"

/**
 * Una sola raíz para todo el catálogo.
 *
 * Servicios, categorías y recursos se pisan entre sí —dar de baja una categoría
 * deja sus servicios con `category: null`, y un recurso borrado desaparece de los
 * servicios que lo pedían—, así que cualquier escritura invalida la rama entera.
 * Separarlas en tres claves obligaría a acordarse de cuál toca cuál.
 */
export const CATALOG_KEY = ["catalog"] as const

export function useServices() {
  return useQuery({ queryKey: [...CATALOG_KEY, "servicios"], queryFn: listServicesRequest })
}

export function useCategories() {
  return useQuery({
    queryKey: [...CATALOG_KEY, "categorias"],
    queryFn: listCategoriesRequest,
    // Cambian poquísimo y el diálogo de servicio las necesita para el selector.
    staleTime: 5 * 60_000,
  })
}

export function useResources() {
  return useQuery({ queryKey: [...CATALOG_KEY, "recursos"], queryFn: listResourcesRequest })
}

export function useServiceEmployees(serviceId: string | null) {
  return useQuery({
    queryKey: [...CATALOG_KEY, "servicios", serviceId, "empleados"],
    queryFn: () => getServiceEmployeesRequest(serviceId!),
    enabled: serviceId !== null,
  })
}

export function useServiceResources(serviceId: string | null) {
  return useQuery({
    queryKey: [...CATALOG_KEY, "servicios", serviceId, "recursos"],
    queryFn: () => getServiceResourcesRequest(serviceId!),
    enabled: serviceId !== null,
  })
}

/**
 * Los empleados con las sucursales donde trabaja cada uno.
 *
 * **Es un pedido por empleado, y no hay forma de evitarlo**: `GET /employees`
 * devuelve el listado sin `branchIds` y solo el detalle los trae. Es la misma
 * deuda que arrastra `useTeamTimeOff`, y alcanza igual: son los empleados de un
 * negocio, no una lista abierta.
 *
 * Sin esto no se puede dibujar la grilla de quién presta qué y dónde: haría
 * falta dejar marcar cualquier casilla y esperar el 400 del backend.
 */
export function useAssignableEmployees(employees: Employee[] | undefined, enabled: boolean) {
  const activos = (employees ?? []).filter((employee) => employee.isActive)

  const detalles = useQueries({
    queries: activos.map((employee) => ({
      // La misma clave que `useEmployeeDetail`, a propósito: si `/equipo` ya pidió
      // ese empleado, esto sale de la caché sin volver a viajar.
      queryKey: [...EMPLOYEES_KEY, employee.id, "detalle"],
      queryFn: () => getEmployeeRequest(employee.id),
      enabled,
      staleTime: 5 * 60_000,
    })),
  })

  const cargando = detalles.some((query) => query.isPending)

  const data: MatrixEmployee[] = activos.map((employee, index) => ({
    id: employee.id,
    name: employeeName(employee),
    branchIds: detalles[index]?.data?.branchIds ?? [],
  }))

  return { data, isPending: enabled && cargando }
}

/**
 * Invalida el catálogo entero después de escribir y avisa con un toast.
 *
 * El mensaje de error sale de `apiErrorMessage`: el backend redacta los suyos en
 * castellano —el 403 del plan al crear un recurso, el 409 del nombre repetido— y
 * son más precisos que cualquier texto genérico de acá.
 */
function useCatalogMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  messages: { success: string; error: string },
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CATALOG_KEY })
      toast.success(messages.success)
    },
    onError: (error) => toast.error(apiErrorMessage(error, messages.error)),
  })
}

// --- Servicios -------------------------------------------------------------

export function useCreateService() {
  return useCatalogMutation((payload: CreateServicePayload) => createServiceRequest(payload), {
    success: "Servicio creado",
    error: "No pudimos crear el servicio",
  })
}

export function useUpdateService() {
  return useCatalogMutation(
    ({ id, ...payload }: UpdateServicePayload & { id: string }) => updateServiceRequest(id, payload),
    { success: "Servicio guardado", error: "No pudimos guardar el servicio" },
  )
}

export function useRemoveService() {
  return useCatalogMutation((id: string) => removeServiceRequest(id), {
    success: "Servicio eliminado",
    error: "No pudimos eliminar el servicio",
  })
}

export function useToggleService() {
  return useCatalogMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) => updateServiceRequest(id, { isActive }),
    { success: "Cambios guardados", error: "No pudimos cambiar el estado" },
  )
}

/**
 * Guarda quién presta el servicio y qué recursos ocupa, en una sola acción.
 *
 * Son dos endpoints, pero para quien edita es un solo formulario. Los dos
 * **reemplazan la lista completa**: no hay alta ni baja individual.
 */
export function useSaveServiceStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: string
      assignments: ServiceEmployeeInput[]
      resourceIds: string[]
    }) => {
      await setServiceEmployeesRequest(input.id, input.assignments)
      return setServiceResourcesRequest(input.id, input.resourceIds)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CATALOG_KEY })
      toast.success("Cambios guardados")
    },
    onError: (error) => toast.error(apiErrorMessage(error, "No pudimos guardar los cambios")),
  })
}

// --- Categorías ------------------------------------------------------------

export function useCreateCategory() {
  return useCatalogMutation((payload: CreateCategoryPayload) => createCategoryRequest(payload), {
    success: "Categoría creada",
    error: "No pudimos crear la categoría",
  })
}

export function useUpdateCategory() {
  return useCatalogMutation(
    ({ id, ...payload }: UpdateCategoryPayload & { id: string }) =>
      updateCategoryRequest(id, payload),
    { success: "Categoría guardada", error: "No pudimos guardar la categoría" },
  )
}

export function useRemoveCategory() {
  return useCatalogMutation((id: string) => removeCategoryRequest(id), {
    success: "Categoría eliminada",
    error: "No pudimos eliminar la categoría",
  })
}

// --- Recursos --------------------------------------------------------------

export function useCreateResource() {
  return useCatalogMutation((payload: CreateResourcePayload) => createResourceRequest(payload), {
    success: "Recurso creado",
    error: "No pudimos crear el recurso",
  })
}

export function useUpdateResource() {
  return useCatalogMutation(
    ({ id, ...payload }: UpdateResourcePayload & { id: string }) =>
      updateResourceRequest(id, payload),
    { success: "Recurso guardado", error: "No pudimos guardar el recurso" },
  )
}

export function useRemoveResource() {
  return useCatalogMutation((id: string) => removeResourceRequest(id), {
    success: "Recurso eliminado",
    error: "No pudimos eliminar el recurso",
  })
}
