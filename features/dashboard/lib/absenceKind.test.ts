import { describe, expect, it } from "vitest"
import { absenceKind } from "./absenceKind"

describe("absenceKind", () => {
  it("reconoce vacaciones, incluso escritas de otra forma", () => {
    for (const texto of ["Vacaciones", "vacaciones de invierno", "Me tomo unas vacas", "Receso"]) {
      expect(absenceKind(texto)).toBe("vacaciones")
    }
  })

  it("reconoce lo médico sin importar los acentos", () => {
    for (const texto of ["Turno médico", "turno medico", "Licencia por enfermedad", "Reposo"]) {
      expect(absenceKind(texto)).toBe("medica")
    }
  })

  it("reconoce el día libre", () => {
    for (const texto of ["Franco", "Día libre", "Trámite personal", "Mudanza"]) {
      expect(absenceKind(texto)).toBe("libre")
    }
  })

  it("'licencia anual' es vacaciones y 'licencia médica' no", () => {
    // Las dos dicen "licencia": si se preguntara por lo médico primero, las
    // vacaciones anuales caerían del lado equivocado.
    expect(absenceKind("Licencia anual")).toBe("vacaciones")
    expect(absenceKind("Licencia médica")).toBe("medica")
  })

  it("sin motivo, o con uno que no reconoce, cae en 'otro'", () => {
    expect(absenceKind(null)).toBe("otro")
    expect(absenceKind("")).toBe("otro")
    expect(absenceKind("   ")).toBe("otro")
    // El límite de adivinar del texto libre, y está bien que se note.
    expect(absenceKind("Me voy a Brasil")).toBe("otro")
  })

  it("no se marea con mayúsculas ni espacios de más", () => {
    expect(absenceKind("  VACACIONES  ")).toBe("vacaciones")
  })
})
