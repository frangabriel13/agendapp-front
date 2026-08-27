"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiErrorMessage } from "@/lib/errors"
import { dateToStr } from "@/lib/time"
import {
  changeStatusRequest,
  createAppointmentRequest,
  getAvailabilityRequest,
  getSubscriptionRequest,
  listAppointmentsRequest,
  rescheduleRequest,
  updateNotesRequest,
  type AppointmentRange,
} from "@/services/appointments"
import type { AppointmentStatus, CreateAppointmentPayload } from "@/types"

export const APPOINTMENTS_KEY = ["appointments"] as const

/**
 * Los turnos de un rango de días.
 *
 * **Se pide de a rangos anchos y se filtra en memoria.** Un mes entero son unos
 * cientos de turnos, y traerlos de una permite que moverse entre semanas dentro
 * de ese mes no dispare una request por paso. El backend acepta hasta 92 días.
 */
export function useAppointments(range: AppointmentRange) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, range],
    queryFn: () => listAppointmentsRequest(range),
  })
}

/**
 * Los turnos de un mes con **una semana de colchón de cada lado**.
 *
 * La grilla del mes muestra los días de los meses vecinos que completan la
 * primera y la última semana; sin el colchón esos días saldrían siempre vacíos y
 * parecería que no hay nada agendado.
 */
export function useMonthAppointments(reference: Date) {
  const desde = new Date(reference.getFullYear(), reference.getMonth(), 1)
  desde.setDate(desde.getDate() - 7)
  const hasta = new Date(reference.getFullYear(), reference.getMonth() + 1, 0)
  hasta.setDate(hasta.getDate() + 7)

  return useAppointments({ from: dateToStr(desde), to: dateToStr(hasta) })
}

export function useAvailability(query: {
  branchId: string | null
  serviceId: string | null
  date: string
  employeeId?: string
}) {
  const listo = query.branchId !== null && query.serviceId !== null

  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, "disponibilidad", query],
    queryFn: () =>
      getAvailabilityRequest({
        branchId: query.branchId!,
        serviceId: query.serviceId!,
        date: query.date,
        ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      }),
    enabled: listo,
    // Los huecos se los lleva cualquiera: no conviene servirlos de la caché.
    staleTime: 0,
  })
}

/** Estado de la suscripción. Es lo que le da un texto útil al 402 al agendar. */
export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: getSubscriptionRequest,
    staleTime: 5 * 60_000,
  })
}

/**
 * Agenda un turno.
 *
 * **Sin toast de error a propósito.** Los dos errores que importan acá no son
 * fallas: el 409 es "alguien te ganó el hueco" —hay que refrescar y ofrecer otro
 * horario, no reintentar— y el 402 es "el negocio debe la suscripción". Los dos
 * se explican dentro del formulario, con una salida.
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => createAppointmentRequest(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY })
      toast.success("Turno agendado")
    },
  })
}

function useAppointmentMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  messages: { success: string; error: string },
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY })
      toast.success(messages.success)
    },
    onError: (error) => toast.error(apiErrorMessage(error, messages.error)),
  })
}

/**
 * Mueve el estado.
 *
 * Una transición inválida da **409, no 400**, y el mensaje viene redactado por el
 * backend: se muestra tal cual. La pantalla igual ofrece solo las transiciones
 * posibles (ver `TRANSICIONES` en `lib/status.ts`), así que ese 409 solo debería
 * aparecer si alguien más movió el turno mientras tanto.
 */
export function useChangeStatus() {
  return useAppointmentMutation(
    ({ id, status, reason }: { id: string; status: AppointmentStatus; reason?: string }) =>
      changeStatusRequest(id, status, reason),
    { success: "Turno actualizado", error: "No pudimos cambiar el estado" },
  )
}

export function useUpdateNotes() {
  return useAppointmentMutation(
    ({ id, notes }: { id: string; notes: string | null }) => updateNotesRequest(id, notes),
    { success: "Nota guardada", error: "No pudimos guardar la nota" },
  )
}

export function useReschedule() {
  return useAppointmentMutation(
    ({ id, startsAt }: { id: string; startsAt: string }) => rescheduleRequest(id, startsAt),
    { success: "Turno reprogramado", error: "No pudimos reprogramar el turno" },
  )
}
