import { describe, expect, it } from "vitest"
import {
  newPasswordSchema,
  validateEmail,
  validateNewPassword,
  validateNombre,
} from "./validators"

/** El primer mensaje de error del campo, o `null` si el campo pasó. */
function errorDe(values: { password: string; confirm: string }, campo: "password" | "confirm") {
  const result = newPasswordSchema.safeParse(values)
  if (result.success) return null
  return result.error.issues.find((issue) => issue.path[0] === campo)?.message ?? null
}

describe("validateEmail", () => {
  it("acepta una dirección normal", () => {
    expect(validateEmail("dueno@demo.test")).toBeNull()
  })

  it("rechaza el vacío y los espacios", () => {
    expect(validateEmail("")).toBe("El email es requerido")
    expect(validateEmail("   ")).toBe("El email es requerido")
  })

  it("rechaza lo que no tiene forma de email", () => {
    expect(validateEmail("dueno")).toBe("El email no es válido")
    expect(validateEmail("dueno@demo")).toBe("El email no es válido")
    expect(validateEmail("dueno demo@test.com")).toBe("El email no es válido")
  })
})

describe("validateNewPassword", () => {
  it("acepta 8 caracteres con letra y número", () => {
    expect(validateNewPassword("demo1234")).toBeNull()
  })

  // El backend pide mínimo 8: con 7 el front dejaría mandar algo que el servidor
  // rechaza, y el error aparecería recién después del viaje.
  it("rechaza menos de 8 caracteres", () => {
    expect(validateNewPassword("demo123")).toBe("Debe tener al menos 8 caracteres")
  })

  it("rechaza solo letras o solo números", () => {
    expect(validateNewPassword("demodemo")).toBe("Debe incluir al menos una letra y un número")
    expect(validateNewPassword("12345678")).toBe("Debe incluir al menos una letra y un número")
  })
})

describe("newPasswordSchema", () => {
  it("acepta las dos iguales y válidas", () => {
    expect(newPasswordSchema.safeParse({ password: "demo1234", confirm: "demo1234" }).success).toBe(
      true,
    )
  })

  /**
   * Es el mismo esquema para activar una cuenta y para restablecer la propia:
   * este test es lo que sostiene que las dos pantallas exijan lo mismo.
   */
  it("reusa la regla del backend en el campo de contraseña", () => {
    expect(errorDe({ password: "corta1", confirm: "corta1" }, "password")).toBe(
      "Debe tener al menos 8 caracteres",
    )
  })

  // El error va en `confirm` y no en `password`: se muestra debajo del campo que
  // el usuario tiene que corregir, no del que escribió primero.
  it("marca el desajuste en el campo de repetir", () => {
    expect(errorDe({ password: "demo1234", confirm: "demo12345" }, "confirm")).toBe(
      "Las contraseñas no coinciden",
    )
    expect(errorDe({ password: "demo1234", confirm: "demo12345" }, "password")).toBeNull()
  })

  it("no deja pasar dos iguales pero inválidas", () => {
    expect(newPasswordSchema.safeParse({ password: "abc", confirm: "abc" }).success).toBe(false)
  })
})

describe("validateNombre", () => {
  it("acepta un nombre normal", () => {
    expect(validateNombre("Ana", "El nombre")).toBeNull()
    expect(validateNombre("Peluquería Ana", "El nombre del negocio")).toBeNull()
  })

  it("pide el campo cuando está vacío, y los espacios no cuentan", () => {
    expect(validateNombre("", "El nombre")).toBe("El nombre es requerido")
    expect(validateNombre("   ", "El apellido")).toBe("El apellido es requerido")
  })

  it("espeja el mínimo de dos del backend", () => {
    // Sin esto el rebote llega en inglés: "must be longer than or equal to 2".
    expect(validateNombre("A", "El nombre")).toBe("El nombre es demasiado corto")
    expect(validateNombre("Al", "El nombre")).toBeNull()
  })

  it("mide después de recortar: dos espacios y una letra siguen siendo una", () => {
    expect(validateNombre(" A ", "El nombre")).toBe("El nombre es demasiado corto")
  })

  it("nombra el campo del que habla", () => {
    expect(validateNombre("", "El nombre del negocio")).toBe("El nombre del negocio es requerido")
  })
})
