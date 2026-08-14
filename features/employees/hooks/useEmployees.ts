"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiErrorMessage } from "@/lib/errors"
import {
  createTimeOffRequest,
  getEmployeeRequest,
  inviteEmployeeRequest,
  listEmployeesRequest,
  listSchedulesRequest,
  listTimeOffRequest,
  removeTimeOffRequest,
  removeEmployeeRequest,
  resendInvitationRequest,
  setBranchesRequest,
  setSchedulesRequest,
  updateEmployeeRequest,
} from "@/services/employees"
import type {
  CreateTimeOffPayload,
  EmployeeShiftInput,
  InviteEmployeePayload,
  UpdateEmployeePayload,
} from "@/types"

export const EMPLOYEES_KEY = ["employees"] as const

export function useEmployees() {
  return useQuery({
    queryKey: EMPLOYEES_KEY,
    queryFn: listEmployeesRequest,
  })
}

/**
 * Las mutaciones no tocan el cache a mano: invalidan y dejan que React Query
 * vuelva a pedir. El backend deriva campos que el front no puede calcular
 * —`status` sale de si ya se activó, y borrar puede desactivar en vez de borrar
 * cuando el empleado tiene historial—, así que reconstruir la lista localmente
 * es adivinar.
 */
function useEmployeeMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  messages: { success: (result: TResult, args: TArgs) => string; error: string },
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async (result, args) => {
      await queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY })
      toast.success(messages.success(result, args))
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, messages.error))
    },
  })
}

export function useInviteEmployee() {
  return useEmployeeMutation((payload: InviteEmployeePayload) => inviteEmployeeRequest(payload), {
    success: (invitation) => `Invitamos a ${invitation.employee.user.firstName}`,
    error: "No pudimos enviar la invitación",
  })
}

export function useUpdateEmployee() {
  return useEmployeeMutation(
    ({ id, ...payload }: UpdateEmployeePayload & { id: string }) => updateEmployeeRequest(id, payload),
    {
      success: () => "Cambios guardados",
      error: "No pudimos guardar los cambios",
    },
  )
}

export function useRemoveEmployee() {
  return useEmployeeMutation((id: string) => removeEmployeeRequest(id), {
    success: () => "Empleado eliminado",
    error: "No pudimos eliminar al empleado",
  })
}

/** Detalle de un empleado. `null` cuando no hay ninguno abierto. */
export function useEmployeeDetail(id: string | null) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, id, "detalle"],
    queryFn: () => getEmployeeRequest(id!),
    enabled: id !== null,
  })
}

export function useEmployeeSchedules(id: string | null) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, id, "horarios"],
    queryFn: () => listSchedulesRequest(id!),
    enabled: id !== null,
  })
}

/**
 * Guarda sucursales y horarios en una sola acción.
 *
 * **Las sucursales van primero, y el orden no es opcional:** un tramo apunta a
 * una `branchId`, y si esa sucursal todavía no está asignada al empleado el
 * backend rechaza el PUT de horarios. Al revés —desasignar una sucursal que
 * tiene tramos— lo frena la validación del editor antes de llegar acá.
 */
export function useSaveSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; branchIds: string[]; shifts: EmployeeShiftInput[] }) => {
      await setBranchesRequest(input.id, input.branchIds)
      return setSchedulesRequest(input.id, input.shifts)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY })
      toast.success("Horarios guardados")
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "No pudimos guardar los horarios"))
    },
  })
}

export function useTimeOff(id: string | null) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, id, "ausencias"],
    queryFn: () => listTimeOffRequest(id!),
    enabled: id !== null,
  })
}

export function useCreateTimeOff() {
  return useEmployeeMutation(
    ({ id, ...payload }: CreateTimeOffPayload & { id: string }) => createTimeOffRequest(id, payload),
    { success: () => "Ausencia agregada", error: "No pudimos agregar la ausencia" },
  )
}

export function useRemoveTimeOff() {
  return useEmployeeMutation(
    ({ id, timeOffId }: { id: string; timeOffId: string }) => removeTimeOffRequest(id, timeOffId),
    { success: () => "Ausencia eliminada", error: "No pudimos eliminar la ausencia" },
  )
}

export function useResendInvitation() {
  return useEmployeeMutation((id: string) => resendInvitationRequest(id), {
    success: () => "Generamos un link de activación nuevo",
    error: "No pudimos reenviar la invitación",
  })
}
