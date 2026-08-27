import { describe, expect, it } from "vitest"
import type { Subscription } from "@/types"
import { deudaVisible } from "./subscription"

const suscripcion = (overrides: Partial<Subscription> = {}): Subscription =>
  ({ blocked: false, daysOverdue: 0, graceDays: 7, ...overrides }) as Subscription

describe("deudaVisible", () => {
  // El panel es para trabajar, no para recordarle a nadie que paga.
  it("no dice nada con la suscripción al día", () => {
    expect(deudaVisible(suscripcion())).toBeNull()
  })

  it("no dice nada mientras no llegó la respuesta", () => {
    expect(deudaVisible(undefined)).toBeNull()
  })

  /**
   * El aviso vive en la ventana entre atrasarse y ser bloqueado. Con `blocked`
   * ya en true, el 402 al intentar agendar dice más y en el momento justo.
   */
  it("no dice nada cuando ya está bloqueado: para eso está el 402", () => {
    expect(deudaVisible(suscripcion({ blocked: true, daysOverdue: 12 }))).toBeNull()
  })

  it("avisa cuántos días quedan de gracia", () => {
    expect(deudaVisible(suscripcion({ daysOverdue: 2 }))).toContain("Quedan 5 días")
  })

  it("no dice 'Quedan 1 días'", () => {
    expect(deudaVisible(suscripcion({ daysOverdue: 6 }))).toContain("Queda un día")
  })

  /**
   * Entre que se acaba la gracia y que el backend marca `blocked` puede pasar un
   * rato. Prometer días que ya no quedan es peor que no decir nada.
   */
  it("no promete días que ya se acabaron", () => {
    const aviso = deudaVisible(suscripcion({ daysOverdue: 9, graceDays: 7 }))

    expect(aviso).toContain("cualquier momento")
    expect(aviso).not.toContain("-2")
  })
})
