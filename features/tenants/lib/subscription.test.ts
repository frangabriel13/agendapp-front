import { describe, expect, it } from "vitest"
import type { Subscription } from "@/types"
import { estadoSuscripcion, sePuedePagar, textoDelPago } from "./subscription"
import { deudaVisible } from "./subscription"

const suscripcion = (overrides: Partial<Subscription> = {}): Subscription =>
  ({
    status: "ACTIVE",
    blocked: false,
    daysOverdue: 0,
    graceDays: 7,
    // Con hora, como la manda la API: `currentPeriodEnd` es un **instante**, no
    // un día de calendario. A medianoche UTC estas fechas se muestran como el día
    // anterior en Buenos Aires, y ahí el que miente es el fixture, no el código.
    currentPeriodStart: "2026-09-03T21:40:58.238Z",
    currentPeriodEnd: "2026-10-03T21:40:58.238Z",
    plan: { id: "p1", name: "Avanzado", slug: "avanzado", priceMonthlyCents: 8000000 },
    payments: [],
    ...overrides,
  }) as Subscription

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

describe("estadoSuscripcion", () => {
  it("con la cuenta al día dice hasta cuándo está paga", () => {
    const estado = estadoSuscripcion(suscripcion())

    expect(estado.titulo).toBe("Al día")
    expect(estado.detalle).toContain("3 de octubre")
    expect(estado.urgente).toBe(false)
  })

  /**
   * "Suscripción vencida" no le dice nada a nadie. Lo que hay que nombrar es qué
   * dejó de funcionar, y también qué sigue: cortarle la lectura a un negocio que
   * debe castigaría a su clientela, que no tiene nada que ver con la cobranza.
   */
  it("bloqueado nombra lo que se cortó y lo que sigue andando", () => {
    const estado = estadoSuscripcion(suscripcion({ blocked: true, daysOverdue: 12 }))

    expect(estado.titulo).toBe("No podés agendar turnos nuevos")
    expect(estado.detalle).toContain("siguen andando")
    expect(estado.tono).toBe("red")
    expect(estado.urgente).toBe(true)
  })

  it("dentro de la gracia cuenta los días que quedan", () => {
    const estado = estadoSuscripcion(suscripcion({ daysOverdue: 2 }))

    expect(estado.titulo).toBe("Hay un pago pendiente")
    expect(estado.detalle).toContain("Quedan 5 días")
    expect(estado.tono).toBe("amber")
  })

  it("no dice 'Queda 1 días'", () => {
    expect(estadoSuscripcion(suscripcion({ daysOverdue: 6 })).detalle).toContain("Queda un día")
  })

  it("no promete días que ya se acabaron", () => {
    const estado = estadoSuscripcion(suscripcion({ daysOverdue: 9 }))

    expect(estado.detalle).toContain("cualquier momento")
    expect(estado.detalle).not.toMatch(/Quedan? -?\d/)
  })

  /** El atraso manda sobre el estado nominal: `PAST_DUE` con deuda es deuda. */
  it("la deuda gana sobre el estado del plan", () => {
    const estado = estadoSuscripcion(suscripcion({ status: "PAST_DUE", daysOverdue: 3 }))

    expect(estado.titulo).toBe("Hay un pago pendiente")
  })

  it("distingue prueba, pausa y cancelación", () => {
    expect(estadoSuscripcion(suscripcion({ status: "TRIAL" })).titulo).toContain("prueba")
    expect(estadoSuscripcion(suscripcion({ status: "PAUSED" })).titulo).toContain("pausada")
    expect(estadoSuscripcion(suscripcion({ status: "CANCELED" })).titulo).toContain("cancelada")
  })
})

describe("sePuedePagar", () => {
  it("dice que sí cuando el plan tiene precio de lista", () => {
    expect(sePuedePagar(suscripcion())).toBe(true)
  })

  /**
   * `priceMonthlyCents` en `null` es el plan Empresa, que se cotiza con soporte.
   * Su checkout devuelve 409: el botón no tiene que existir.
   */
  it("dice que no cuando el plan se cotiza con soporte", () => {
    const empresa = suscripcion({
      plan: { id: "p2", name: "Empresa", slug: "empresa", priceMonthlyCents: null },
    })

    expect(sePuedePagar(empresa)).toBe(false)
  })
})

describe("textoDelPago", () => {
  /**
   * Estando al día el checkout cobra el **período siguiente**, no un duplicado
   * del actual. "Pagar el mes" a secas haría creer que se paga algo ya pago.
   */
  it("al día ofrece pagar el próximo mes", () => {
    expect(textoDelPago(suscripcion())).toContain("próximo mes")
  })

  it("con deuda ofrece pagar ahora", () => {
    expect(textoDelPago(suscripcion({ daysOverdue: 3 }))).toContain("ahora")
  })

  /**
   * El historial de la suscripción no trae el `checkoutUrl`, así que apretar de
   * nuevo es la única forma de recuperar el link — y devuelve el mismo, no un
   * cobro nuevo.
   */
  it("con un cobro esperando ofrece retomarlo, no generar otro", () => {
    const conPendiente = suscripcion({
      payments: [{ id: "sp1", status: "PENDING" } as never],
    })

    expect(textoDelPago(conPendiente)).toContain("Retomar")
    expect(textoDelPago(conPendiente)).not.toContain("próximo mes")
  })

  it("lleva el precio adentro", () => {
    expect(textoDelPago(suscripcion())).toContain("80.000")
  })
})
