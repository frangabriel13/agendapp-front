import type { Subscription } from "@/types"

/**
 * El aviso de que el negocio debe la suscripción, o `null` si no hay nada que decir.
 *
 * **El aviso va en la ventana entre que se atrasa y que lo bloquean.** Después de
 * `graceDays` sin pagar, `POST /appointments` devuelve **402** y no se puede
 * agendar; avisar recién ahí es tarde, porque el dueño se entera cuando ya no
 * puede trabajar. Y avisar cuando ya está bloqueado tampoco sirve: para eso
 * está el error mismo.
 *
 * Devuelve `null` con la suscripción al día a propósito: **el panel es para
 * trabajar, no para recordarle a nadie que paga.**
 */
export function deudaVisible(subscription: Subscription | undefined): string | null {
  if (!subscription) return null
  if (subscription.blocked) return null
  if (subscription.daysOverdue <= 0) return null

  const quedan = subscription.graceDays - subscription.daysOverdue

  // Ya pasó la gracia pero el backend todavía no lo marcó bloqueado: el aviso
  // sigue sirviendo, y prometer días que no quedan sería peor que no decir nada.
  if (quedan <= 0) return "Hay un pago pendiente. Puede dejar de andar en cualquier momento."

  return quedan === 1
    ? "Hay un pago pendiente. Queda un día para regularizarlo."
    : `Hay un pago pendiente. Quedan ${quedan} días para regularizarlo.`
}
