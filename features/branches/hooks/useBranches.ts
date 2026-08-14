"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiErrorMessage } from "@/lib/errors"
import {
  createBranchRequest,
  createSpecialDayRequest,
  getBranchRequest,
  getBusinessHoursRequest,
  listBranchesRequest,
  listSpecialDaysRequest,
  removeBranchRequest,
  removeSpecialDayRequest,
  setBusinessHoursRequest,
  updateBranchRequest,
} from "@/services/branches"
import type {
  BusinessHourInput,
  CreateBranchPayload,
  CreateSpecialDayPayload,
  UpdateBranchPayload,
} from "@/types"

export const BRANCHES_KEY = ["branches"] as const

export function useBranches() {
  return useQuery({
    queryKey: BRANCHES_KEY,
    queryFn: listBranchesRequest,
    // Cambian poquísimo y varias pantallas las piden.
    staleTime: 5 * 60_000,
  })
}

export function useBranch(id: string | null) {
  return useQuery({
    queryKey: [...BRANCHES_KEY, id, "detalle"],
    queryFn: () => getBranchRequest(id!),
    enabled: id !== null,
  })
}

export function useBusinessHours(id: string | null) {
  return useQuery({
    queryKey: [...BRANCHES_KEY, id, "horarios"],
    queryFn: () => getBusinessHoursRequest(id!),
    enabled: id !== null,
  })
}

export function useSpecialDays(id: string | null) {
  return useQuery({
    queryKey: [...BRANCHES_KEY, id, "dias-especiales"],
    queryFn: () => listSpecialDaysRequest(id!),
    enabled: id !== null,
  })
}

/**
 * Invalida toda la rama de sucursales, no solo la lista: el detalle, los
 * horarios y los días especiales cuelgan de la misma clave, y una sucursal que
 * se desactiva o se borra los deja obsoletos a todos.
 */
function useBranchMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  messages: { success: string; error: string },
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BRANCHES_KEY })
      toast.success(messages.success)
    },
    onError: (error) => toast.error(apiErrorMessage(error, messages.error)),
  })
}

export function useCreateBranch() {
  return useBranchMutation((payload: CreateBranchPayload) => createBranchRequest(payload), {
    success: "Sucursal creada",
    error: "No pudimos crear la sucursal",
  })
}

export function useRemoveBranch() {
  return useBranchMutation((id: string) => removeBranchRequest(id), {
    success: "Sucursal eliminada",
    error: "No pudimos eliminar la sucursal",
  })
}

/**
 * Guarda los datos de la sucursal y su semana comercial en una sola acción.
 * Son dos endpoints distintos, pero para quien edita es un solo formulario.
 */
export function useSaveBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; branch: UpdateBranchPayload; days: BusinessHourInput[] }) => {
      await updateBranchRequest(input.id, input.branch)
      return setBusinessHoursRequest(input.id, input.days)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BRANCHES_KEY })
      toast.success("Sucursal guardada")
    },
    onError: (error) => toast.error(apiErrorMessage(error, "No pudimos guardar la sucursal")),
  })
}

/** Activar o desactivar sin abrir el formulario entero. */
export function useToggleBranch() {
  return useBranchMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) => updateBranchRequest(id, { isActive }),
    { success: "Cambios guardados", error: "No pudimos cambiar el estado" },
  )
}

export function useCreateSpecialDay() {
  return useBranchMutation(
    ({ id, ...payload }: CreateSpecialDayPayload & { id: string }) => createSpecialDayRequest(id, payload),
    { success: "Día especial agregado", error: "No pudimos agregar el día" },
  )
}

export function useRemoveSpecialDay() {
  return useBranchMutation(
    ({ id, specialDayId }: { id: string; specialDayId: string }) => removeSpecialDayRequest(id, specialDayId),
    { success: "Día especial eliminado", error: "No pudimos eliminar el día" },
  )
}
