import { formatCents } from "@/features/catalog/lib/money"
import type { Subscription, SubscriptionPayment } from "@/types"

/**
 * La cuenta que el negocio le paga a reservApp.
 *
 * **Deber no bloquea enseguida.** Hay una ventana de `graceDays` en la que
 * `daysOverdue` ya es mayor que cero pero `blocked` sigue en `false`, y ahí es
 * cuando avisar sirve: después el negocio se entera porque no puede agendar, que
 * es enterarse tarde.
 *
 * Vive en `features/tenants` y no en `features/appointments`, que es donde nació:
 * el 402 al agendar era el único lugar donde se notaba, pero la suscripción no es
 * un asunto de la agenda.
 */

/** Cuántos días de tolerancia quedan. Cero o menos = ya se acabó. */
function diasQueQuedan(subscription: Subscription): number {
  return subscription.graceDays - subscription.daysOverdue
}

/**
 * El aviso de deuda para una pantalla que **no es la de la suscripción**, o
 * `null` si no hay nada que decir.
 *
 * Devuelve `null` con la cuenta al día a propósito: **el panel es para trabajar,
 * no para recordarle a nadie que paga.** Y también con `blocked`, porque ahí el
 * 402 al intentar agendar dice más y en el momento justo.
 */
export function deudaVisible(subscription: Subscription | undefined): string | null {
  if (!subscription) return null
  if (subscription.blocked) return null
  if (subscription.daysOverdue <= 0) return null

  const quedan = diasQueQuedan(subscription)

  // Ya pasó la gracia pero el backend todavía no lo marcó bloqueado: el aviso
  // sigue sirviendo, y prometer días que no quedan sería peor que no decir nada.
  if (quedan <= 0) return "Hay un pago pendiente. Puede dejar de andar en cualquier momento."

  return quedan === 1
    ? "Hay un pago pendiente. Queda un día para regularizarlo."
    : `Hay un pago pendiente. Quedan ${quedan} días para regularizarlo.`
}

/**
 * ¿Quedó algún cobro esperando confirmación?
 *
 * **Es el único signo honesto de "todavía no terminó".** No alcanza con mirar si
 * la cuenta está al día: quien paga por adelantado ya lo estaba antes de pagar, y
 * la pantalla de vuelta le diría "listo" por un pago que todavía no entró.
 */
export function hayPagoEsperando(subscription: Subscription): boolean {
  return subscription.payments.some((payment) => payment.status === "PENDING")
}

export type TonoSuscripcion = "emerald" | "amber" | "red" | "neutral"

export interface EstadoSuscripcion {
  titulo: string
  detalle: string
  tono: TonoSuscripcion
  /** Si conviene empujar a pagar ahora. Ordena la pantalla, no la habilita. */
  urgente: boolean
}

/**
 * El estado de la cuenta, en una frase, **para la pantalla de la suscripción**.
 *
 * Es la versión larga de `deudaVisible`: acá el dueño vino a mirar esto, así que
 * corresponde decir todo —incluido "al día", que en cualquier otra pantalla sería
 * ruido.
 *
 * El orden de los casos sigue qué tan urgente es:
 *
 * 1. **Bloqueado** primero, y nombrando lo que dejó de andar. "Suscripción
 *    vencida" no dice nada; "no podés agendar turnos nuevos" sí
 * 2. **Con atraso pero dentro de la gracia**: los días que quedan son el dato
 * 3. El resto son estados que no piden nada urgente
 */
export function estadoSuscripcion(subscription: Subscription): EstadoSuscripcion {
  const { status, daysOverdue, blocked } = subscription

  if (blocked) {
    return {
      titulo: "No podés agendar turnos nuevos",
      // Lo que sigue andando importa tanto como lo que se cortó: cortarle la
      // lectura a un negocio que debe castigaría a su clientela, que no tiene
      // nada que ver con la cobranza.
      detalle: `${diasDeAtraso(daysOverdue)} de atraso. Ver la agenda, cobrar, cancelar y reprogramar siguen andando.`,
      tono: "red",
      urgente: true,
    }
  }

  if (daysOverdue > 0) {
    const quedan = diasQueQuedan(subscription)
    return {
      titulo: "Hay un pago pendiente",
      detalle:
        quedan <= 0
          ? "Se puede cortar el alta de turnos en cualquier momento."
          : quedan === 1
            ? "Queda un día antes de que se corte el alta de turnos."
            : `Quedan ${quedan} días antes de que se corte el alta de turnos.`,
      tono: "amber",
      urgente: true,
    }
  }

  if (status === "CANCELED") {
    return {
      titulo: "Suscripción cancelada",
      detalle: `Estuvo paga hasta el ${fecha(subscription.currentPeriodEnd)}.`,
      tono: "neutral",
      urgente: false,
    }
  }

  if (status === "PAUSED") {
    return {
      titulo: "Suscripción pausada",
      detalle: "Mientras esté pausada no se cobra el mes.",
      tono: "neutral",
      urgente: false,
    }
  }

  if (status === "TRIAL") {
    return {
      titulo: "Estás en el período de prueba",
      detalle: `Termina el ${fecha(subscription.currentPeriodEnd)}.`,
      tono: "neutral",
      urgente: false,
    }
  }

  return {
    titulo: "Al día",
    detalle: `Paga hasta el ${fecha(subscription.currentPeriodEnd)}.`,
    tono: "emerald",
    urgente: false,
  }
}

/**
 * ¿Se puede pagar el mes desde el panel?
 *
 * **`priceMonthlyCents` en `null` no es gratis**: es un plan que se cotiza con
 * soporte (Empresa). Ese checkout devuelve **409**, así que preguntarlo antes es
 * la diferencia entre no mostrar el botón y mostrarlo para explicar el error
 * después.
 */
export function sePuedePagar(subscription: Subscription): boolean {
  return subscription.plan.priceMonthlyCents !== null
}

/**
 * Qué dice el botón de pagar.
 *
 * **Estando al día el checkout cobra el período siguiente**, no un duplicado del
 * actual, así que "Pagar el mes" a secas haría creer que se está pagando algo que
 * ya se pagó.
 *
 * Y con un cobro ya esperando, el botón **no genera otro**: devuelve el mismo link
 * (`reused: true`). Decirlo importa porque el historial de la suscripción **no
 * trae el `checkoutUrl`** —a diferencia del de un turno—, así que volver a apretar
 * es la única forma de recuperar ese link. "Pagar el próximo mes" ahí haría pensar
 * que se está por generar un segundo cobro del mismo mes.
 */
export function textoDelPago(subscription: Subscription): string {
  const precio = subscription.plan.priceMonthlyCents
  const monto = precio === null ? "" : ` — ${formatCents(precio)}`

  if (hayPagoEsperando(subscription)) return `Retomar el pago${monto}`

  return subscription.daysOverdue > 0 ? `Pagar ahora${monto}` : `Pagar el próximo mes${monto}`
}

export const PAGO_LABEL: Record<SubscriptionPayment["status"], string> = {
  PENDING: "Esperando",
  SUCCEEDED: "Pagado",
  FAILED: "Rechazado",
  REFUNDED: "Devuelto",
}

export const PAGO_BADGE: Record<SubscriptionPayment["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SUCCEEDED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-600 border-red-200",
  REFUNDED: "bg-neutral-100 text-neutral-600 border-neutral-200",
}

/** "3 de octubre de 2026". */
export function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/** El período que cubre un cobro: "3 oct – 3 nov". */
export function periodo(desde: string, hasta: string): string {
  const corto = (iso: string) =>
    new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" })

  return `${corto(desde)} – ${corto(hasta)}`
}

function diasDeAtraso(dias: number): string {
  return dias === 1 ? "Un día" : `${dias} días`
}
