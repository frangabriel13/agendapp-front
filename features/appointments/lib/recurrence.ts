import type { RecurrenceFrequency, RecurringResult } from "@/types"

/**
 * Series de turnos repetidos.
 *
 * **Lo único que hay que entender: las fechas que no entran se saltean.** No es
 * un error ni una falla parcial que haya que reintentar; es el comportamiento
 * normal, y las que quedaron afuera son trabajo pendiente para quien atiende.
 */

export const FRECUENCIAS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "WEEKLY", label: "Todas las semanas" },
  { value: "BIWEEKLY", label: "Cada 15 días" },
  // `MONTHLY` repite el mismo día del mes, no el mismo día de la semana.
  { value: "MONTHLY", label: "Una vez por mes" },
]

export interface ResumenSerie {
  titulo: string
  /** `true` cuando alguna fecha quedó afuera y hay algo que resolver a mano. */
  hayHuecos: boolean
}

/**
 * Cómo se cuenta el resultado de una serie.
 *
 * **El titular nombra los dos números cuando no coinciden.** "Se agendaron 4
 * turnos" en una serie de 6 es cierto y engaña: quien lo lee da por hecho que
 * pidió 4. La lista de salteados va aparte, con el motivo de cada uno.
 */
export function resumenSerie(resultado: RecurringResult): ResumenSerie {
  const creados = resultado.created.length
  const salteados = resultado.skipped.length

  const turnos = (n: number) => `${n} ${n === 1 ? "turno" : "turnos"}`

  if (salteados === 0) {
    return { titulo: `Se agendaron ${turnos(creados)}`, hayHuecos: false }
  }

  return {
    titulo: `Se agendaron ${turnos(creados)} de ${creados + salteados}`,
    hayHuecos: true,
  }
}
