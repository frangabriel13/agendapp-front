import type { SessionTenant } from "@/types"

export interface SubscriptionNote {
  text: string
  /** `true` cuando pide una acción y no solo informa. */
  urgent: boolean
}

/**
 * El pie del panel: en qué estado está la suscripción.
 *
 * Devuelve `null` cuando está todo en orden. Una suscripción activa no merece
 * un cartel: el panel es para trabajar, no para recordarle a nadie que paga.
 */
export function subscriptionNote(tenant: SessionTenant): SubscriptionNote | null {
  if (tenant.subscriptionStatus === "TRIAL") {
    if (!tenant.trialEndsAt) return { text: "Estás en el período de prueba", urgent: false }
    const hasta = new Date(tenant.trialEndsAt).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
    })
    return { text: `Prueba gratis hasta el ${hasta}`, urgent: false }
  }

  if (tenant.subscriptionStatus === "PAST_DUE") {
    return { text: "Hay un pago pendiente", urgent: true }
  }

  if (tenant.subscriptionStatus === "PAUSED" || tenant.subscriptionStatus === "CANCELED") {
    return { text: "La suscripción no está activa", urgent: true }
  }

  return null
}
