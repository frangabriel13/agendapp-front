import { describe, expect, it } from "vitest"
import { formatCents } from "@/features/catalog/lib/money"
import type { RefundDecision } from "@/types"
import { avisoDevolucion } from "./refund"

const decision = (overrides: Partial<RefundDecision> = {}): RefundDecision => ({
  type: "FULL",
  amountCents: 1500000,
  withinPolicy: true,
  reason: "Canceló con más de 24 h de anticipación.",
  ...overrides,
})

describe("avisoDevolucion", () => {
  it("no dice nada cuando el backend no mandó decisión", () => {
    // Los cambios de estado que no son cancelaciones traen `refund: null`.
    expect(avisoDevolucion(null, 1500000)).toBeNull()
    expect(avisoDevolucion(undefined, 0)).toBeNull()
  })

  it("nombra el monto y repite el motivo del backend tal cual", () => {
    const aviso = avisoDevolucion(decision(), 1500000)

    expect(aviso?.titulo).toBe(`Corresponde devolver todo: ${formatCents(1500000)}`)
    expect(aviso?.detalle).toBe("Canceló con más de 24 h de anticipación.")
    expect(aviso?.hayQueDevolver).toBe(true)
  })

  it("distingue los cuatro tipos", () => {
    expect(avisoDevolucion(decision({ type: "PARTIAL" }), 1)?.titulo).toContain("una parte")
    expect(avisoDevolucion(decision({ type: "CREDIT" }), 1)?.titulo).toContain("crédito")
    expect(avisoDevolucion(decision({ type: "NONE", amountCents: 0 }), 1)?.titulo).toContain(
      "La política no obliga",
    )
  })

  /**
   * Quien canceló un turno con plata adentro necesita saber que no tiene que
   * devolver nada, tanto como necesitaría saber lo contrario.
   */
  /**
   * El caso que rompía la pantalla: la decisión del backend mira **la seña**, no
   * todo lo cobrado. Un turno sin seña configurada al que le pagaron $5.000 en el
   * mostrador vuelve `NONE` con "no había seña pagada", y el saldo de al lado
   * decía "quedaron $5.000 cobrados". Las dos son ciertas; el texto no puede
   * negar una para afirmar la otra.
   */
  it("no niega la plata que sí está cobrada", () => {
    const aviso = avisoDevolucion(
      decision({ type: "NONE", amountCents: 0, reason: "No había seña pagada." }),
      500000,
    )

    expect(aviso?.titulo).not.toContain("No corresponde devolución")
    expect(aviso?.detalle).toContain("No había seña pagada.")
    expect(aviso?.detalle).toContain(formatCents(500000))
    expect(aviso?.hayQueDevolver).toBe(false)
  })

  it("no habla de plata sobrante cuando sí corresponde devolver", () => {
    expect(avisoDevolucion(decision(), 1500000)?.detalle).not.toContain("Igual quedaron")
  })

  /** Sin plata de por medio, un "no corresponde devolver nada" es ruido. */
  it("se calla el 'no corresponde' de un turno sin plata", () => {
    expect(avisoDevolucion(decision({ type: "NONE", amountCents: 0 }), 0)).toBeNull()
  })

  it("no cuelga un monto vacío cuando la decisión es de cero", () => {
    const aviso = avisoDevolucion(decision({ type: "NONE", amountCents: 0 }), 500000)

    expect(aviso?.titulo).not.toContain(":")
  })
})
