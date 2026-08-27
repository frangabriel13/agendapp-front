import { describe, expect, it } from "vitest"
import type { RecurringResult, SkippedOccurrence } from "@/types"
import { resumenSerie } from "./recurrence"

const resultado = (creados: number, salteados: SkippedOccurrence[] = []): RecurringResult =>
  ({
    recurrenceGroupId: "g1",
    created: Array.from({ length: creados }, (_, i) => ({ id: `a${i}` })),
    skipped: salteados,
  }) as RecurringResult

const salteada = (reason: string): SkippedOccurrence => ({
  startsAt: "2026-09-14T13:00:00.000Z",
  reason,
})

describe("resumenSerie", () => {
  it("con la serie entera dice cuántos quedaron", () => {
    const resumen = resumenSerie(resultado(4))

    expect(resumen.titulo).toBe("Se agendaron 4 turnos")
    expect(resumen.hayHuecos).toBe(false)
  })

  /**
   * "Se agendaron 4 turnos" en una serie de 6 es cierto y engaña: quien lo lee da
   * por hecho que pidió 4. Los dos números tienen que estar.
   */
  it("cuando falta alguno nombra los dos números", () => {
    const resumen = resumenSerie(resultado(4, [salteada("Feriado"), salteada("Ocupado")]))

    expect(resumen.titulo).toBe("Se agendaron 4 turnos de 6")
    expect(resumen.hayHuecos).toBe(true)
  })

  it("no dice '1 turnos'", () => {
    expect(resumenSerie(resultado(1)).titulo).toBe("Se agendaron 1 turno")
  })
})
