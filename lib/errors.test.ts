import { describe, expect, it } from "vitest"
import { ApiError } from "./api"
import { apiErrorMessage } from "./errors"

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
