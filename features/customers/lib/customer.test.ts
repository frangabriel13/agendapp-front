import { describe, expect, it } from "vitest"
import { age, birthdayToday, fullName, initials } from "./customer"

describe("fullName", () => {
  it("junta nombre y apellido", () => {
    expect(fullName({ firstName: "María", lastName: "González" })).toBe("María González")
  })

  // El apellido es opcional en el backend: sin esto queda un espacio colgando.
  it("no deja espacio cuando no hay apellido", () => {
    expect(fullName({ firstName: "María", lastName: null })).toBe("María")
    expect(fullName({ firstName: "María", lastName: "" })).toBe("María")
  })
})

describe("initials", () => {
  it("toma la del nombre y la del apellido", () => {
    expect(initials({ firstName: "María", lastName: "González" })).toBe("MG")
  })

  // "MA" para María se lee como un apellido que no existe.
  it("devuelve una sola cuando no hay apellido", () => {
    expect(initials({ firstName: "María", lastName: null })).toBe("M")
  })
})

describe("age", () => {
  it("cuenta los años cumplidos", () => {
    expect(age("1995-11-02", new Date(2026, 10, 3))).toBe(31)
  })

  it("todavía no suma el año si no llegó el cumpleaños", () => {
    expect(age("1995-11-02", new Date(2026, 10, 1))).toBe(30)
    expect(age("1995-11-02", new Date(2026, 9, 30))).toBe(30)
  })

  /**
   * La trampa: `new Date("1995-11-02")` es medianoche **UTC**, o sea el 1 de
   * noviembre a las 21:00 en Argentina. Construyendo la fecha desde la cadena, la
   * edad daba un año de más durante todo el día del cumpleaños.
   */
  it("suma el año el mismo día del cumpleaños, no el anterior", () => {
    expect(age("1995-11-02", new Date(2026, 10, 2))).toBe(31)
  })

  it("devuelve null sin fecha cargada", () => {
    expect(age(null, new Date(2026, 10, 2))).toBeNull()
    expect(age(undefined, new Date(2026, 10, 2))).toBeNull()
    expect(age("", new Date(2026, 10, 2))).toBeNull()
  })
})

describe("birthdayToday", () => {
  it("reconoce el día, sin importar el año", () => {
    expect(birthdayToday("1995-11-02", new Date(2026, 10, 2))).toBe(true)
    expect(birthdayToday("1988-11-02", new Date(2026, 10, 2))).toBe(true)
  })

  it("no confunde el día con el mes", () => {
    // 2 de noviembre contra 11 de febrero: los mismos números al revés.
    expect(birthdayToday("1995-11-02", new Date(2026, 1, 11))).toBe(false)
  })

  it("es false sin fecha cargada", () => {
    expect(birthdayToday(null, new Date(2026, 10, 2))).toBe(false)
  })
})
