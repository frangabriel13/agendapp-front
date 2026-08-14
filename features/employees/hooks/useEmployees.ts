"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import {
  inviteEmployeeRequest,
  listEmployeesRequest,
  removeEmployeeRequest,
  resendInvitationRequest,
  updateEmployeeRequest,
} from "@/services/employees"
import type { InviteEmployeePayload, UpdateEmployeePayload } from "@/types"

export const EMPLOYEES_KEY = ["employees"] as const

/**
 * Texto de error para mostrarle a la persona.
 *
 * El backend manda un array de mensajes ya en castellano —típico de la
 * validación de NestJS—, así que se usan tal cual. El `fallback` cubre lo que no
 * es un `ApiError`: un bug del front, o un fallo de red que no pasó por el cliente.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.messages.length > 0) return error.messages.join(" · ")
  return fallback
}

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

export function useResendInvitation() {
  return useEmployeeMutation((id: string) => resendInvitationRequest(id), {
    success: () => "Generamos un link de activación nuevo",
    error: "No pudimos reenviar la invitación",
  })
}
