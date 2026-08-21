import { describe, expect, it } from "vitest"
import { ApiError } from "./api"
import { apiErrorMessage, errorDetail } from "./errors"

const FALLBACK = "Algo salió mal"

describe("apiErrorMessage", () => {
  it("usa el mensaje que mandó el backend", () => {
    const error = new ApiError(401, ["Email o contraseña incorrectos"])

    expect(apiErrorMessage(error, FALLBACK)).toBe("Email o contraseña incorrectos")
  })

  it("junta los errores de validación, que vienen uno por campo", () => {
    const error = new ApiError(400, ["El email no es válido", "La contraseña es muy corta"])

    expect(apiErrorMessage(error, FALLBACK)).toBe("El email no es válido · La contraseña es muy corta")
  })

  it("cae al fallback cuando el error no vino de la API", () => {
    expect(apiErrorMessage(new TypeError("x is not a function"), FALLBACK)).toBe(FALLBACK)
    expect(apiErrorMessage("un string suelto", FALLBACK)).toBe(FALLBACK)
    expect(apiErrorMessage(null, FALLBACK)).toBe(FALLBACK)
    expect(apiErrorMessage(undefined, FALLBACK)).toBe(FALLBACK)
  })

  it("cae al fallback si el ApiError no trae mensajes", () => {
    // Pasa con un 500 de cuerpo vacío: sin esto la pantalla queda muda.
    expect(apiErrorMessage(new ApiError(500, []), FALLBACK)).toBe(FALLBACK)
  })

  it("ignora los mensajes en blanco en vez de mostrarlos", () => {
    expect(apiErrorMessage(new ApiError(500, ["", "   "]), FALLBACK)).toBe(FALLBACK)
    expect(apiErrorMessage(new ApiError(400, ["", "Falta el nombre"]), FALLBACK)).toBe("Falta el nombre")
  })
})

/**
 * El caso real: el 409 de `POST /customers` trae `existingCustomer` con la ficha
 * ya cargada, y con eso la pantalla ofrece "¿es esta persona?" en vez de un
 * cartel rojo.
 */
describe("errorDetail", () => {
  const ficha = { id: "c1", firstName: "María", lastName: "González" }
  const duplicado = new ApiError(409, ["Ya tenés un cliente con ese teléfono"], undefined, {
    statusCode: 409,
    message: "Ya tenés un cliente con ese teléfono",
    existingCustomer: ficha,
  })

  it("saca el campo extra del cuerpo", () => {
    expect(errorDetail(duplicado, 409, "existingCustomer")).toEqual(ficha)
  })

  /**
   * Pide el `statusCode` justamente para esto: sin el chequeo, un 500 con un
   * cuerpo raro se leería como un duplicado y la pantalla ofrecería abrir una
   * ficha que no existe.
   */
  it("no lee el campo si el error no es el que se esperaba", () => {
    expect(errorDetail(duplicado, 400, "existingCustomer")).toBeNull()
  })

  it("devuelve null cuando el campo no está", () => {
    expect(errorDetail(duplicado, 409, "otraCosa")).toBeNull()
    expect(errorDetail(new ApiError(409, ["Chocó"]), 409, "existingCustomer")).toBeNull()
  })

  it("no explota con un cuerpo que no es un objeto", () => {
    expect(errorDetail(new ApiError(409, ["x"], undefined, "texto suelto"), 409, "a")).toBeNull()
    expect(errorDetail(new ApiError(409, ["x"], undefined, null), 409, "a")).toBeNull()
    expect(errorDetail(new TypeError("no es de la API"), 409, "a")).toBeNull()
  })
})
