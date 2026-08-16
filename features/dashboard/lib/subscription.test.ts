import { describe, expect, it } from "vitest"
import type { SessionTenant } from "@/types"
import { subscriptionNote } from "./subscription"

const tenant = (overrides: Partial<SessionTenant>): SessionTenant =>
  ({ subscriptionStatus: "ACTIVE", trialEndsAt: null, ...overrides }) as SessionTenant

describe("subscriptionNote", () => {
  it("no dice nada cuando la suscripción está activa", () => {
    expect(subscriptionNote(tenant({}))).toBeNull()
  })

  it("en prueba avisa hasta cuándo", () => {
    const nota = subscriptionNote(
      tenant({ subscriptionStatus: "TRIAL", trialEndsAt: "2026-09-20T03:00:00.000Z" }),
    )

    expect(nota).toEqual({ text: "Prueba gratis hasta el 20 de septiembre", urgent: false })
  })

  it("en prueba sin fecha avisa igual, sin inventar un día", () => {
    const nota = subscriptionNote(tenant({ subscriptionStatus: "TRIAL", trialEndsAt: null }))

    expect(nota).toEqual({ text: "Estás en el período de prueba", urgent: false })
  })

  it("marca como urgente lo que pide una acción", () => {
    for (const estado of ["PAST_DUE", "PAUSED", "CANCELED"] as const) {
      expect(subscriptionNote(tenant({ subscriptionStatus: estado }))?.urgent).toBe(true)
    }
  })
})
