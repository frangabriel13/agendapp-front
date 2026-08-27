import { apiFetch } from "@/lib/api"
import type {
  AppointmentPayments,
  Checkout,
  CheckoutType,
  Payment,
  RecordManualPaymentPayload,
} from "@/types"

/**
 * El saldo del turno y los movimientos que lo dejaron así.
 *
 * **`balance` viene calculado y se muestra tal cual.** Sumar `payments` en el
 * front para obtener lo mismo es donde se cuenta de más: una devolución es una
 * fila propia *y* descuenta de lo cobrado, así que restarla dos veces es el error
 * natural de quien rehace la cuenta.
 */
export function getPaymentsRequest(appointmentId: string): Promise<AppointmentPayments> {
  return apiFetch<AppointmentPayments>(`/appointments/${appointmentId}/payments`)
}

/**
 * El link de pago online. **No cobra: deja el pago pendiente.**
 *
 * Lo confirma Mercado Pago avisándole al backend, y eso tarda de segundos a
 * minutos. Después de mandar a alguien al checkout hay que **volver a consultar el
 * saldo**, nunca asumir que se pagó.
 *
 * `paymentType` se puede omitir: el backend cobra la seña si el turno tiene una
 * sin cubrir y el saldo en cualquier otro caso. `REFUND` no es una opción —una
 * devolución se registra a mano— y por eso `CheckoutType` no lo incluye.
 *
 * Errores propios: **409** si el turno está cancelado o no queda nada por cobrar,
 * y **502** si el proveedor no respondió (ahí sí conviene reintentar).
 */
export function createCheckoutRequest(
  appointmentId: string,
  paymentType?: CheckoutType,
): Promise<Checkout> {
  return apiFetch<Checkout>(`/appointments/${appointmentId}/payments/checkout`, {
    method: "POST",
    body: JSON.stringify(paymentType ? { paymentType } : {}),
  })
}

/**
 * Asienta plata que ya se movió en el mostrador: efectivo, transferencia o una
 * devolución. **Nace acreditada**, a diferencia del checkout.
 *
 * `paymentMethod` **no acepta `MERCADOPAGO`** (400): ese pago solo lo crea el
 * checkout, porque es el único que un sistema externo puede confirmar.
 */
export function recordManualPaymentRequest(
  appointmentId: string,
  payload: RecordManualPaymentPayload,
): Promise<Payment> {
  return apiFetch<Payment>(`/appointments/${appointmentId}/payments/manual`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
