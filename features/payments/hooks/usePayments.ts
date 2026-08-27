"use client"

import { useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiErrorMessage } from "@/lib/errors"
import { APPOINTMENTS_KEY } from "@/features/appointments/hooks/useAppointments"
import { mapLimit } from "@/lib/async"
import {
  createCheckoutRequest,
  getPaymentsRequest,
  recordManualPaymentRequest,
} from "@/services/payments"
import type { Appointment, CheckoutType, RecordManualPaymentPayload } from "@/types"
import { cobrosDelDia, linkPendiente, type CobrosDelDia } from "../lib/balance"

export const PAYMENTS_KEY = ["payments"] as const

/** Cada cuánto se vuelve a preguntar mientras hay un cobro online sin resolver. */
const ESPERANDO_MS = 10_000

/**
 * El saldo del turno y sus movimientos.
 *
 * **Sin caché (`staleTime: 0`) y con reintento mientras haya un cobro online
 * esperando.** Los dos son por lo mismo: el cobro online es en dos tiempos y
 * quien confirma es Mercado Pago avisándole al backend, que puede tardar de
 * segundos a minutos. Sin volver a preguntar, el panel muestra "Esperando" para
 * siempre y quien atiende no tiene forma de enterarse de que la plata entró
 * salvo recargando la página.
 *
 * El reintento **se apaga solo** cuando no queda ningún pendiente: no es un
 * `setInterval` corriendo por ahí, es una consulta que deja de repetirse cuando
 * ya no hay nada que esperar.
 */
export function usePayments(appointmentId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [...PAYMENTS_KEY, appointmentId],
    queryFn: () => getPaymentsRequest(appointmentId!),
    enabled: appointmentId !== null,
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data && linkPendiente(query.state.data.payments) ? ESPERANDO_MS : false,
  })

  /**
   * Cuando el cobro online se acredita, **el turno también cambió**.
   *
   * Cubrir la seña lo saca de `PENDING_PAYMENT` y lo deja `CONFIRMED`, y eso pasa
   * del lado del backend cuando Mercado Pago avisa: acá nadie mutó nada. Sin
   * esto, la consulta de arriba actualiza el saldo pero el turno sigue diciendo
   * "Falta la seña" —en el encabezado del modal, en la agenda y en el tablero del
   * día— hasta que algo más lo invalide.
   *
   * El `ref` es lo que lo limita a la transición: sin él, cada vuelta sin
   * pendientes invalidaría los turnos de nuevo, que es la mayoría de las vueltas.
   */
  const esperaba = useRef(false)
  const hayPendiente = query.data !== undefined && linkPendiente(query.data.payments) !== null

  useEffect(() => {
    if (hayPendiente) {
      esperaba.current = true
      return
    }
    if (!esperaba.current) return

    esperaba.current = false
    void queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY })
  }, [hayPendiente, queryClient])

  return query
}

/**
 * Pide el link de pago online.
 *
 * **Sin toast de éxito**: no se cobró nada todavía, y decir "listo" sería
 * exactamente la confusión que el cobro en dos tiempos invita. Lo que hay que
 * mostrar es el link, y de eso se encarga la pantalla.
 *
 * **Sin toast de error tampoco.** Los dos que importan tienen salida propia: el
 * 409 es "no queda nada por cobrar" o "el turno está cancelado", y el 502 es que
 * el proveedor no respondió —el único de todos donde reintentar es lo correcto.
 */
export function useCreateCheckout(appointmentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentType?: CheckoutType) => createCheckoutRequest(appointmentId, paymentType),
    onSuccess: async () => {
      // La fila del cobro pendiente ya existe: sin esto, el link recién generado
      // no aparece en el historial hasta la próxima vuelta.
      await queryClient.invalidateQueries({ queryKey: [...PAYMENTS_KEY, appointmentId] })
    },
  })
}

/**
 * Asienta un cobro de mostrador o una devolución.
 *
 * **Invalida también los turnos**, no solo los pagos: cubrir la seña saca al
 * turno de `PENDING_PAYMENT`, así que el estado que muestran la agenda y el
 * tablero del día quedó viejo en el mismo movimiento.
 */
export function useRecordManualPayment(appointmentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RecordManualPaymentPayload) =>
      recordManualPaymentRequest(appointmentId, payload),
    onSuccess: async (payment) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...PAYMENTS_KEY, appointmentId] }),
        queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY }),
      ])
      toast.success(payment.paymentType === "REFUND" ? "Devolución registrada" : "Cobro registrado")
    },
    onError: (error) => toast.error(apiErrorMessage(error, "No pudimos registrar el movimiento")),
  })
}

/**
 * Cuántos saldos se piden a la vez.
 *
 * El backend permite 10 pedidos por segundo. Cuatro deja lugar para lo que el
 * resto de la pantalla esté haciendo: llenar el balde con esto solo conseguiría
 * que la consulta de al lado se coma el 429.
 */
const SALDOS_A_LA_VEZ = 4

/**
 * Los cobros de un día, turno por turno.
 *
 * **Cuesta un pedido por turno**, porque la API no expone los pagos de varios
 * turnos juntos: `GET /appointments/:id/payments` es de a uno. Por eso arranca
 * apagado (`enabled`) y lo enciende la pantalla cuando alguien lo pide, en vez de
 * salir a hacer treinta pedidos apenas se abre `/reportes`.
 *
 * Y por eso mismo **es de un día y no de un mes**: un mes de un local con
 * movimiento son cientos de pedidos, que además chocarían contra el límite de 100
 * cada 50 s. Un mes de facturación cobrada necesita un endpoint que hoy no existe.
 */
export function useDayCollections(day: string, appointments: Appointment[], enabled: boolean) {
  const ids = appointments.map((appointment) => appointment.id)

  return useQuery<CobrosDelDia>({
    // Los ids en la clave y no solo el día: si se agenda o se cancela algo, la
    // lista cambia y el resultado guardado dejó de corresponder.
    queryKey: [...PAYMENTS_KEY, "dia", day, ids],
    queryFn: async () => {
      const saldos = await mapLimit(appointments, SALDOS_A_LA_VEZ, (appointment) =>
        getPaymentsRequest(appointment.id).then((datos) => ({
          appointment,
          balance: datos.balance,
        })),
      )
      return cobrosDelDia(saldos)
    },
    enabled: enabled && appointments.length > 0,
    staleTime: 60_000,
  })
}
