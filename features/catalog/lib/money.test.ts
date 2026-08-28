import { afterEach, describe, expect, it } from "vitest"
import {
  businessCurrency,
  centsToInput,
  checkDeposit,
  formatCents,
  formatDuration,
  inputToCents,
  setBusinessCurrency,
} from "./money"

// La moneda es estado de módulo, como la zona en `lib/time.ts`: si un bloque la
// deja puesta, el siguiente formatea con la de otro negocio.
afterEach(() => {
  setBusinessCurrency(null)
})

describe("centsToInput", () => {
  it("pasa centavos a pesos", () => {
    // $15.000 en el seed del backend.
    expect(centsToInput(1500000)).toBe("15000")
    expect(centsToInput(4500000)).toBe("45000")
  })

  // `null` es "no pide seña", que no es lo mismo que cero.
  it("deja el campo vacío cuando no hay monto", () => {
    expect(centsToInput(null)).toBe("")
    expect(centsToInput(undefined)).toBe("")
    expect(centsToInput(0)).toBe("0")
  })

  it("escribe el decimal con coma, no con el punto de String()", () => {
    expect(centsToInput(250050)).toBe("2500,5")
    expect(centsToInput(1999)).toBe("19,99")
  })
})

/**
 * El bug que esto atrapa: `centsToInput` devolvía `"2500.5"` y `inputToCents`
 * leía el punto como separador de miles, así que abrir un servicio con seña de
 * $2.500,50 y guardarlo **sin tocar nada** la dejaba en $25.005.
 *
 * Es la prueba que importa de todo el archivo: las dos funciones pueden estar
 * bien por separado y el par estar roto.
 */
describe("el ida y vuelta cierra", () => {
  it.each([0, 1999, 150050, 250050, 1200000, 4500000, 100])(
    "%i centavos sobreviven la vuelta por el input",
    (cents) => {
      expect(inputToCents(centsToInput(cents))).toBe(cents)
    },
  )
})

describe("inputToCents", () => {
  it("pasa pesos a centavos", () => {
    expect(inputToCents("15000")).toBe(1500000)
    expect(inputToCents("0")).toBe(0)
  })

  it("acepta la coma decimal, que es como se escribe un precio acá", () => {
    expect(inputToCents("1500,50")).toBe(150050)
    expect(inputToCents("19,99")).toBe(1999)
  })

  it("ignora el punto de miles", () => {
    expect(inputToCents("15.000")).toBe(1500000)
    expect(inputToCents("1.500.000")).toBe(150000000)
  })

  /**
   * Nadie escribe un separador de miles que deje menos de tres cifras atrás, así
   * que "2.5" solo puede ser un decimal tipeado con punto —costumbre de teclado
   * numérico—. Sin esta regla se cargaban cien veces el monto.
   */
  it("lee el punto como decimal cuando no deja tres cifras", () => {
    expect(inputToCents("2500.5")).toBe(250050)
    expect(inputToCents("19.99")).toBe(1999)
    expect(inputToCents("0.5")).toBe(50)
  })

  it("con coma presente, el punto siempre es de miles", () => {
    expect(inputToCents("15.000,50")).toBe(1500050)
  })

  /**
   * `19.99 * 100` da 1998.9999999999998 en punto flotante. Sin el `Math.round`
   * se guardaría un centavo de menos, y nadie lo vería hasta la factura.
   */
  it("redondea en vez de perder un centavo por punto flotante", () => {
    expect(inputToCents("19,99")).toBe(1999)
    expect(inputToCents("8,29")).toBe(829)
    expect(inputToCents("1,15")).toBe(115)
  })

  it("devuelve null cuando no hay un número atrás", () => {
    expect(inputToCents("")).toBeNull()
    expect(inputToCents("   ")).toBeNull()
    expect(inputToCents("gratis")).toBeNull()
    expect(inputToCents("-500")).toBeNull()
  })
})

describe("formatCents", () => {
  it("muestra el monto redondo sin decimales", () => {
    expect(formatCents(1500000)).toContain("15.000")
    expect(formatCents(1500000)).not.toContain(",00")
  })

  it("muestra los decimales cuando de verdad los hay", () => {
    expect(formatCents(150050)).toContain("1.500,5")
  })

  it("respeta la moneda que le pasan en vez de fijar ARS", () => {
    expect(formatCents(1500000, "USD")).toContain("US$")
  })

  it("usa la del negocio sin que nadie se la pase", () => {
    setBusinessCurrency("UYU")

    // La gracia es esta: 45 llamadas en la app no pasan moneda y todas cambian.
    expect(formatCents(1500000)).not.toBe(formatCents(1500000, "ARS"))
    expect(formatCents(1500000)).toBe(formatCents(1500000, "UYU"))
  })

  it("el parámetro le gana a la del negocio: un cobro trae la suya", () => {
    setBusinessCurrency("UYU")

    expect(formatCents(1500000, "ARS")).toBe(formatCents(1500000, "ARS"))
    expect(formatCents(1500000, "ARS")).not.toBe(formatCents(1500000))
  })
})

describe("setBusinessCurrency", () => {
  it("sin sesión todavía, pesos argentinos", () => {
    expect(businessCurrency()).toBe("ARS")
  })

  it("la fija cuando llega la sesión", () => {
    setBusinessCurrency("CLP")

    expect(businessCurrency()).toBe("CLP")
  })

  it("cerrar sesión la devuelve al default", () => {
    setBusinessCurrency("CLP")
    setBusinessCurrency(null)

    expect(businessCurrency()).toBe("ARS")
  })

  it("un código que Intl no conoce se ignora en vez de romper la app", () => {
    setBusinessCurrency("PESOS")

    expect(businessCurrency()).toBe("ARS")
    // Lo que importa no es el valor: es que siga pudiendo dibujar un monto.
    expect(() => formatCents(1500000)).not.toThrow()
  })

  it("una cadena vacía tampoco pisa nada", () => {
    setBusinessCurrency("")

    expect(businessCurrency()).toBe("ARS")
  })
})

describe("formatDuration", () => {
  it("deja los minutos sueltos abajo de una hora", () => {
    expect(formatDuration(45)).toBe("45 min")
    expect(formatDuration(59)).toBe("59 min")
  })

  it("pasa a horas cuando llega a 60", () => {
    expect(formatDuration(60)).toBe("1 h")
    expect(formatDuration(120)).toBe("2 h")
    expect(formatDuration(90)).toBe("1 h 30 min")
    expect(formatDuration(135)).toBe("2 h 15 min")
  })
})

describe("checkDeposit", () => {
  it("acepta una seña menor que el precio", () => {
    expect(checkDeposit(4500000, 1500000).ok).toBe(true)
  })

  it("acepta que no haya seña", () => {
    expect(checkDeposit(1500000, null).ok).toBe(true)
  })

  it("acepta la seña igual al precio: es pagar todo por adelantado", () => {
    expect(checkDeposit(1500000, 1500000).ok).toBe(true)
  })

  /**
   * El backend rechaza este caso incluso indirectamente —bajar el precio por
   * debajo de una seña ya cargada da 400 sin tocar la seña—, y ese error no
   * señala ningún campo. Atajarlo acá es lo que hace que el usuario sepa
   * cuál de los dos corregir.
   */
  it("rechaza la seña mayor que el precio y dice cuál es el tope", () => {
    const check = checkDeposit(1500000, 2000000)

    expect(check.ok).toBe(false)
    expect(check.error).toContain("15.000")
  })
})
