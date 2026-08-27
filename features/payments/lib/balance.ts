import { formatCents } from "@/features/catalog/lib/money"
import { estaCancelado } from "@/features/appointments/lib/status"
import type {
  AppointmentBalance,
  AppointmentStatus,
  CheckoutType,
  ManualPaymentMethod,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from "@/types"

/**
 * Cómo se lee la plata de un turno.
 *
 * **El saldo lo calcula el backend y acá no se recalcula.** `dueCents` viene
 * hecho; rehacerlo sumando `payments` es donde se cuenta de más, porque una
 * devolución es una fila propia *y* ya está descontada de `paidCents`.
 *
 * Lo que sí decide el front es **qué decir** con esos números, que no es lo
 * mismo según el turno: "debe $15.000" en un turno cancelado es una frase falsa
 * —nadie va a cobrar eso— y ahí lo que corresponde contar es qué entró y qué se
 * devolvió.
 */

export type Tono = "emerald" | "amber" | "neutral" | "red"

export interface ResumenSaldo {
  /** El titular: lo único que se lee de un vistazo. */
  titulo: string
  /** La línea chica de abajo. Vacía cuando no hay nada que agregar. */
  detalle: string
  tono: Tono
}

/**
 * El saldo en una frase.
 *
 * El orden de los casos no es casual:
 *
 * 1. **Devuelto de más** va primero porque es una anomalía —la caja quedó en
 *    rojo por este turno— y quedaría escondida detrás de cualquier otra frase
 * 2. **Cancelado (y reprogramado)** manda sobre "debe": lo pendiente de un turno
 *    que no va a ocurrir no es una deuda de nadie. Encima el backend ya no acepta
 *    movimientos ahí, así que ofrecer cobrarlo mandaría a alguien contra un 409
 * 3. **La seña sin cubrir** se nombra aparte del saldo. Es lo que mantiene al
 *    turno en `PENDING_PAYMENT`, así que decir solo "debe $15.000" esconde
 *    cuánto alcanza para confirmarlo
 */
export function resumenSaldo(
  balance: AppointmentBalance,
  status: AppointmentStatus,
): ResumenSaldo {
  const { paidCents, dueCents, refundedCents, totalPriceCents } = balance

  if (paidCents < 0) {
    return {
      titulo: `Se devolvió ${formatCents(-paidCents)} de más`,
      detalle: `Entró ${formatCents(refundedCents + paidCents)} y se devolvió ${formatCents(refundedCents)}`,
      tono: "red",
    }
  }

  if (!sePuedeCobrar(status)) {
    if (paidCents === 0) {
      return {
        titulo: refundedCents > 0 ? "Devuelto" : "Sin cobrar",
        detalle: refundedCents > 0 ? `Se devolvieron ${formatCents(refundedCents)}` : "",
        tono: "neutral",
      }
    }
    return {
      titulo: `Quedaron ${formatCents(paidCents)} cobrados`,
      detalle: estaCancelado(status)
        // No es un matiz: un turno cancelado **tampoco acepta la devolución**.
        // El backend rechaza cualquier movimiento con 409, `REFUND` incluido, así
        // que decir "se registra a mano" mandaría a alguien a buscar un botón que
        // no existe.
        ? "Un turno cancelado ya no acepta movimientos: la devolución se hace por fuera."
        : "El turno se reprogramó. La plata quedó asentada acá.",
      tono: "amber",
    }
  }

  if (balance.fullyPaid) {
    return {
      titulo: "Pagado",
      detalle:
        refundedCents > 0
          ? `${formatCents(paidCents)} en caja · se devolvieron ${formatCents(refundedCents)}`
          : formatCents(totalPriceCents),
      tono: "emerald",
    }
  }

  const seña = faltaSeña(balance)
  if (seña > 0) {
    return {
      titulo: `Falta la seña: ${formatCents(seña)}`,
      detalle: `De ${formatCents(totalPriceCents)} en total${paidCents > 0 ? ` · pagó ${formatCents(paidCents)}` : ""}`,
      tono: "amber",
    }
  }

  return {
    titulo: `Debe ${formatCents(dueCents)}`,
    detalle: `De ${formatCents(totalPriceCents)} en total${paidCents > 0 ? ` · pagó ${formatCents(paidCents)}` : ""}`,
    tono: paidCents > 0 ? "amber" : "neutral",
  }
}

/**
 * Cuánto falta para cubrir la seña. **Puede dar cero o negativo**, y quien llama
 * lo chequea con `> 0` antes de nombrarlo: sin ese chequeo, la pantalla ofrecía
 * "Falta la seña: -$9.000" y el formulario proponía cobrar en negativo.
 *
 * **El tope en `dueCents` es lo que impide pedir de más.** Hoy no debería
 * dispararse —el backend no deja cargar una seña mayor que el precio, así que lo
 * que falta de seña nunca supera lo que falta de saldo—, pero es un invariante
 * del *otro* lado: si algún día se rompe, el modo de fallar es cobrarle de más a
 * alguien.
 */
function faltaSeña(balance: AppointmentBalance): number {
  const seña = balance.depositAmountCents
  if (seña === null || balance.depositCovered) return 0

  return Math.min(seña - balance.paidCents, balance.dueCents)
}

export interface CobroSugerido {
  paymentType: Exclude<CheckoutType, undefined>
  amountCents: number
}

/**
 * Qué cobrar si nadie toca nada, o `null` si no queda nada por cobrar.
 *
 * Sigue la misma regla que el backend usa cuando el checkout va sin
 * `paymentType`: **la seña si falta, el saldo en cualquier otro caso**. Tenerla
 * escrita acá no la duplica al pedo — el formulario de efectivo **sí está
 * obligado** a mandar tipo e importe, así que alguien tiene que decidirlos, y que
 * la pantalla proponga algo distinto de lo que el link online cobraría sería la
 * peor forma de descubrirlo.
 *
 * `REMAINDER` y no `FULL` cuando ya entró algo: los dos cobran lo mismo, pero el
 * historial queda diciendo si fue el pago completo o lo que faltaba.
 */
export function cobroSugerido(balance: AppointmentBalance): CobroSugerido | null {
  if (balance.dueCents <= 0) return null

  const seña = faltaSeña(balance)
  if (seña > 0) return { paymentType: "DEPOSIT", amountCents: seña }

  return {
    paymentType: balance.paidCents > 0 ? "REMAINDER" : "FULL",
    amountCents: balance.dueCents,
  }
}

/**
 * ¿Se le puede mover plata a este turno?
 *
 * **Cancelado *o reprogramado*** devuelve 409 en las dos rutas de cobro. Lo
 * segundo es fácil de pasar por alto: `RESCHEDULED` no es una cancelación —el
 * turno existe, movido de hora— pero para la plata sí lo es, porque el registro
 * vivo pasó a ser el nuevo.
 *
 * No alcanza con `noOcurrio`, que además junta `NO_SHOW`: esa hora estuvo tomada
 * y se cobra igual.
 */
export function sePuedeCobrar(status: AppointmentStatus): boolean {
  return !estaCancelado(status) && status !== "RESCHEDULED"
}

/**
 * El link de pago que sigue vivo, si hay uno.
 *
 * **Un cobro online pendiente ya trae su `checkoutUrl`**, así que volver a pedir
 * el checkout para recuperarlo es un viaje al pedo: el backend devolvería el
 * mismo link con `reused: true`. Se lee de la lista y listo.
 */
export function linkPendiente(payments: Payment[]): Payment | null {
  return payments.find((p) => p.status === "PENDING" && p.checkoutUrl !== null) ?? null
}

/**
 * El signo con el que entra al historial.
 *
 * Una devolución llega con `amountCents` **positivo** —es cuánto se devolvió—,
 * así que mostrarla tal cual la haría leer como un ingreso más.
 */
export function signo(payment: Payment): 1 | -1 {
  return payment.paymentType === "REFUND" ? -1 : 1
}

export const TIPO_LABEL: Record<PaymentType, string> = {
  DEPOSIT: "Seña",
  FULL: "Pago total",
  REMAINDER: "Saldo",
  REFUND: "Devolución",
}

export const METODO_LABEL: Record<PaymentMethod, string> = {
  MERCADOPAGO: "Mercado Pago",
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
}

export const ESTADO_LABEL: Record<PaymentStatus, string> = {
  // "Esperando" y no "Pendiente": el cobro no está trabado esperando algo del
  // negocio, está esperando que el cliente pague.
  PENDING: "Esperando",
  SUCCEEDED: "Acreditado",
  FAILED: "Rechazado",
  REFUNDED: "Devuelto",
}

export const ESTADO_BADGE: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SUCCEEDED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-600 border-red-200",
  REFUNDED: "bg-neutral-100 text-neutral-600 border-neutral-200",
}

/**
 * Los métodos que se pueden cargar a mano.
 *
 * El tipo es lo que sostiene la regla: `ManualPaymentMethod` sale del spec y no
 * incluye `MERCADOPAGO`, así que sumarlo acá no compila. Es un 400 del backend
 * convertido en error de `tsc`.
 */
export const METODOS_MANUALES: ManualPaymentMethod[] = ["CASH", "TRANSFER", "OTHER"]
