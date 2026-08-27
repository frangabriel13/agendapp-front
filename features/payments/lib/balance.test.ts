import { describe, expect, it } from "vitest"
import type { AppointmentBalance, Payment } from "@/types"
import { formatCents } from "@/features/catalog/lib/money"
import { cobroSugerido, linkPendiente, resumenSaldo, sePuedeCobrar, signo } from "./balance"

// Los importes se arman con `formatCents` y no se escriben a mano: lo que se
// prueba acá es qué frase sale, no cómo separa los miles el locale —que además
// mete un espacio duro entre el signo y el número, indistinguible en el diff.

/** Un saldo cualquiera. Los tests escriben solo los campos que están probando. */
const saldo = (overrides: Partial<AppointmentBalance> = {}): AppointmentBalance => ({
  totalPriceCents: 1500000,
  depositAmountCents: null,
  paidCents: 0,
  refundedCents: 0,
  dueCents: 1500000,
  depositCovered: true,
  fullyPaid: false,
  ...overrides,
})

const pago = (overrides: Partial<Payment> = {}): Payment =>
  ({
    id: "p1",
    amountCents: 500000,
    currency: "ARS",
    paymentType: "DEPOSIT",
    paymentMethod: "CASH",
    status: "SUCCEEDED",
    notes: null,
    failureReason: null,
    checkoutUrl: null,
    paidAt: null,
    createdAt: "2026-09-01T12:00:00.000Z",
    recordedBy: null,
    ...overrides,
  }) as Payment

describe("resumenSaldo", () => {
  it("dice 'Pagado' cuando no queda nada", () => {
    const resumen = resumenSaldo(
      saldo({ paidCents: 1500000, dueCents: 0, fullyPaid: true }),
      "ATTENDED",
    )

    expect(resumen.titulo).toBe("Pagado")
    expect(resumen.tono).toBe("emerald")
  })

  it("dice cuánto debe cuando no entró nada", () => {
    expect(resumenSaldo(saldo(), "CONFIRMED").titulo).toBe(`Debe ${formatCents(1500000)}`)
  })

  it("nombra la seña aparte del saldo", () => {
    // Decir solo "debe $ 15.000" esconde cuánto alcanza para confirmar el turno.
    const resumen = resumenSaldo(
      saldo({ depositAmountCents: 500000, depositCovered: false }),
      "PENDING_PAYMENT",
    )

    expect(resumen.titulo).toBe(`Falta la seña: ${formatCents(500000)}`)
    expect(resumen.tono).toBe("amber")
  })

  it("descuenta lo ya pagado de la seña que falta", () => {
    const resumen = resumenSaldo(
      saldo({ depositAmountCents: 500000, depositCovered: false, paidCents: 200000, dueCents: 1300000 }),
      "PENDING_PAYMENT",
    )

    expect(resumen.titulo).toBe(`Falta la seña: ${formatCents(300000)}`)
    expect(resumen.detalle).toContain(`pagó ${formatCents(200000)}`)
  })

  /**
   * La caja quedó en rojo por este turno. Es una anomalía y va primero: detrás de
   * "debe $X" pasaría desapercibida.
   */
  it("canta la devolución de más antes que cualquier otra cosa", () => {
    const resumen = resumenSaldo(
      saldo({ paidCents: -100000, refundedCents: 600000, dueCents: 1600000 }),
      "CANCELED_BY_BUSINESS",
    )

    expect(resumen.titulo).toBe(`Se devolvió ${formatCents(100000)} de más`)
    expect(resumen.detalle).toBe(`Entró ${formatCents(500000)} y se devolvió ${formatCents(600000)}`)
    expect(resumen.tono).toBe("red")
  })

  /**
   * `Debe ${formatCents(1500000)}` en un turno cancelado es una frase falsa: nadie va a cobrar
   * eso. Lo que corresponde contar es qué entró y qué se devolvió.
   */
  it("no dice que un turno cancelado debe plata", () => {
    const resumen = resumenSaldo(saldo(), "CANCELED_BY_CUSTOMER")

    expect(resumen.titulo).toBe("Sin cobrar")
    expect(resumen.titulo).not.toContain("Debe")
  })

  it("tampoco dice que un reprogramado debe plata", () => {
    const resumen = resumenSaldo(saldo(), "RESCHEDULED")

    expect(resumen.titulo).toBe("Sin cobrar")
  })

  it("de un cancelado con plata adentro dice cuánta quedó", () => {
    const resumen = resumenSaldo(
      saldo({ paidCents: 500000, dueCents: 1000000 }),
      "CANCELED_BY_BUSINESS",
    )

    expect(resumen.titulo).toBe(`Quedaron ${formatCents(500000)} cobrados`)
    expect(resumen.detalle).toContain("por fuera")
  })

  it("distingue el cancelado sin plata del cancelado ya devuelto", () => {
    const resumen = resumenSaldo(
      saldo({ paidCents: 0, refundedCents: 500000, dueCents: 1500000 }),
      "CANCELED_BY_CUSTOMER",
    )

    expect(resumen.titulo).toBe("Devuelto")
  })

  /**
   * Con `depositCovered` en false y la seña ya superada por los pagos, lo que
   * falta da negativo. No se puede nombrar: "Falta la seña: -$3.000" es peor que
   * cualquier otra cosa que se pueda decir.
   */
  it("no nombra una seña en negativo", () => {
    const resumen = resumenSaldo(
      saldo({ depositAmountCents: 500000, depositCovered: false, paidCents: 800000, dueCents: 700000 }),
      "CONFIRMED",
    )

    expect(resumen.titulo).toBe(`Debe ${formatCents(700000)}`)
  })

  // NO_SHOW no es una cancelación: esa hora estuvo tomada y se cobra igual.
  it("un ausente sigue debiendo", () => {
    expect(resumenSaldo(saldo(), "NO_SHOW").titulo).toBe(`Debe ${formatCents(1500000)}`)
  })
})

describe("cobroSugerido", () => {
  it("no propone nada cuando no queda saldo", () => {
    expect(cobroSugerido(saldo({ dueCents: 0, fullyPaid: true }))).toBeNull()
  })

  it("propone la seña cuando falta, igual que el checkout online", () => {
    expect(cobroSugerido(saldo({ depositAmountCents: 500000, depositCovered: false }))).toEqual({
      paymentType: "DEPOSIT",
      amountCents: 500000,
    })
  })

  it("propone el total cuando no entró nada y no hay seña", () => {
    expect(cobroSugerido(saldo())).toEqual({ paymentType: "FULL", amountCents: 1500000 })
  })

  /** Los dos cobran lo mismo; el historial queda diciendo cuál de los dos fue. */
  it("propone el saldo, no el total, cuando ya entró algo", () => {
    expect(cobroSugerido(saldo({ paidCents: 500000, dueCents: 1000000 }))).toEqual({
      paymentType: "REMAINDER",
      amountCents: 1000000,
    })
  })

  /**
   * El saldo de este caso es incoherente a propósito: una seña de $5.000 con
   * $3.000 por cobrar no la puede producir el backend, que no deja cargar una
   * seña mayor que el precio. Se prueba igual porque el invariante es del otro
   * lado del cable y su modo de fallar es cobrarle de más a alguien.
   */
  it("nunca propone cobrar más de lo que falta", () => {
    const propuesta = cobroSugerido(
      saldo({ depositAmountCents: 500000, depositCovered: false, dueCents: 300000 }),
    )

    expect(propuesta?.amountCents).toBe(300000)
  })

  it("pasa al saldo cuando lo pagado ya cubrió la seña", () => {
    // `depositCovered` en false con la seña superada tampoco debería llegar, y
    // si llega no se puede nombrar una seña en negativo.
    const propuesta = cobroSugerido(
      saldo({ depositAmountCents: 500000, depositCovered: false, paidCents: 800000, dueCents: 700000 }),
    )

    expect(propuesta).toEqual({ paymentType: "REMAINDER", amountCents: 700000 })
  })
})

describe("sePuedeCobrar", () => {
  // El backend devuelve 409 en las dos rutas de cobro si el turno está cancelado.
  it("dice que no en las dos formas de cancelar", () => {
    expect(sePuedeCobrar("CANCELED_BY_CUSTOMER")).toBe(false)
    expect(sePuedeCobrar("CANCELED_BY_BUSINESS")).toBe(false)
  })

  /**
   * El 409 dice "está cancelado **o fue reprogramado**". Un turno reprogramado
   * no está cancelado —existe, movido de hora— pero para la plata sí lo está: el
   * registro vivo pasó a ser el nuevo.
   */
  it("dice que no en un reprogramado, que no es una cancelación", () => {
    expect(sePuedeCobrar("RESCHEDULED")).toBe(false)
  })

  it("dice que sí en un ausente: esa hora se cobra igual", () => {
    expect(sePuedeCobrar("NO_SHOW")).toBe(true)
    expect(sePuedeCobrar("CONFIRMED")).toBe(true)
  })
})

describe("linkPendiente", () => {
  it("encuentra el cobro online que todavía espera", () => {
    const vivo = pago({ id: "p2", status: "PENDING", checkoutUrl: "https://mp/1" })

    expect(linkPendiente([pago(), vivo])?.id).toBe("p2")
  })

  it("ignora un pendiente sin link: no hay a dónde mandar a nadie", () => {
    expect(linkPendiente([pago({ status: "PENDING", checkoutUrl: null })])).toBeNull()
  })

  it("ignora los que ya se acreditaron", () => {
    expect(linkPendiente([pago({ status: "SUCCEEDED", checkoutUrl: "https://mp/1" })])).toBeNull()
  })
})

describe("signo", () => {
  /** Una devolución llega con el importe en positivo: sin esto se leería como un ingreso. */
  it("da vuelta la devolución", () => {
    expect(signo(pago({ paymentType: "REFUND" }))).toBe(-1)
    expect(signo(pago({ paymentType: "DEPOSIT" }))).toBe(1)
  })
})
