"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiErrorMessage } from "@/lib/errors"
import {
  createCustomerRequest,
  createTagRequest,
  listCustomersRequest,
  listTagsRequest,
  removeCustomerRequest,
  removeTagRequest,
  setCustomerTagsRequest,
  updateCustomerRequest,
  updateTagRequest,
  type CustomerQuery,
} from "@/services/customers"
import type {
  CreateCustomerPayload,
  CreateTagPayload,
  UpdateCustomerPayload,
  UpdateTagPayload,
} from "@/types"

export const CUSTOMERS_KEY = ["customers"] as const
export const TAGS_KEY = ["customer-tags"] as const

/**
 * El listado paginado.
 *
 * **`keepPreviousData` no es cosmético acá**: sin él, cambiar de página o
 * escribir en el buscador vacía la tabla y la deja en el esqueleto por un
 * instante, así que la lista salta y el scroll se va al principio en cada
 * tecla. Con él, lo viejo se queda quieto hasta que llega lo nuevo.
 */
export function useCustomers(query: CustomerQuery) {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, query],
    queryFn: () => listCustomersRequest(query),
    placeholderData: keepPreviousData,
  })
}

export function useTags() {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: listTagsRequest,
    staleTime: 5 * 60_000,
  })
}

/**
 * Invalida clientes y etiquetas juntos.
 *
 * Se pisan en las dos direcciones: etiquetar a alguien mueve el `customerCount`
 * de la etiqueta, y dar de baja una etiqueta la saca de todos los clientes.
 */
function useCustomerMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  messages: { success: string; error: string },
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
        queryClient.invalidateQueries({ queryKey: TAGS_KEY }),
      ])
      toast.success(messages.success)
    },
    onError: (error) => toast.error(apiErrorMessage(error, messages.error)),
  })
}

/**
 * Alta.
 *
 * **Sin `onError` con toast a propósito.** El 409 de teléfono repetido no es un
 * fallo: es un duplicado con una salida adentro, y el formulario lo muestra como
 * una pregunta ("¿es esta persona?"). Un toast rojo encima diría lo contrario.
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => createCustomerRequest(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY })
      toast.success("Cliente creado")
    },
  })
}

/** Mismo motivo que el alta: cambiar el teléfono a uno ya usado también da 409. */
export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCustomerPayload & { id: string }) =>
      updateCustomerRequest(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY })
      toast.success("Cliente guardado")
    },
  })
}

export function useRemoveCustomer() {
  return useCustomerMutation((id: string) => removeCustomerRequest(id), {
    success: "Cliente eliminado",
    error: "No pudimos eliminar el cliente",
  })
}

export function useSetCustomerTags() {
  return useCustomerMutation(
    ({ id, tagIds }: { id: string; tagIds: string[] }) => setCustomerTagsRequest(id, tagIds),
    { success: "Etiquetas guardadas", error: "No pudimos guardar las etiquetas" },
  )
}

export function useCreateTag() {
  return useCustomerMutation((payload: CreateTagPayload) => createTagRequest(payload), {
    success: "Etiqueta creada",
    error: "No pudimos crear la etiqueta",
  })
}

export function useUpdateTag() {
  return useCustomerMutation(
    ({ id, ...payload }: UpdateTagPayload & { id: string }) => updateTagRequest(id, payload),
    { success: "Etiqueta guardada", error: "No pudimos guardar la etiqueta" },
  )
}

export function useRemoveTag() {
  return useCustomerMutation((id: string) => removeTagRequest(id), {
    success: "Etiqueta eliminada",
    error: "No pudimos eliminar la etiqueta",
  })
}
