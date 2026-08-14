import type { Appointment } from "@/types"
import { timeToMinutes } from "./time"

/** Lunes a domingo de la semana que contiene a `referenceDate`. */
export function getWeekDates(referenceDate: Date): Date[] {
  const day = referenceDate.getDay()
  const monday = new Date(referenceDate)
  monday.setDate(referenceDate.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

/** Lo único que `layoutDay` necesita de un turno. */
export type Placeable = Pick<Appointment, "id" | "startTime" | "endTime">

export interface Lane {
  /** Columna que ocupa, de 0 a `lanes - 1`. */
  lane: number
  /** Cuántas columnas tiene el grupo de turnos superpuestos al que pertenece. */
  lanes: number
}

/**
 * Ubica los turnos que se superponen en columnas paralelas dentro del día.
 *
 * Agrupa en "clusters" de turnos encadenados por superposición y resuelve cada
 * uno por separado, así un choque a la mañana no angosta los turnos de la tarde.
 * Dentro del cluster, una columna se reutiliza apenas queda libre.
 *
 * Tocarse no es superponerse: un turno que termina 10:00 y otro que empieza
 * 10:00 van los dos a la columna 0.
 */
export function layoutDay(appts: Placeable[]): Map<string, Lane> {
  const sorted = [...appts].sort(
    (a, b) =>
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime) ||
      timeToMinutes(a.endTime) - timeToMinutes(b.endTime),
  )
  const result = new Map<string, Lane>()
  let cluster: Placeable[] = []
  let clusterEnd = -1

  const flush = () => {
    const laneEnds: number[] = []
    const laneOf = new Map<string, number>()
    for (const ap of cluster) {
      const s = timeToMinutes(ap.startTime)
      let placed = laneEnds.findIndex((end) => end <= s)
      if (placed === -1) {
        laneEnds.push(timeToMinutes(ap.endTime))
        placed = laneEnds.length - 1
      } else {
        laneEnds[placed] = timeToMinutes(ap.endTime)
      }
      laneOf.set(ap.id, placed)
    }
    // `laneOf` tiene una entrada por cada turno del cluster: se llenó recién arriba.
    for (const ap of cluster) result.set(ap.id, { lane: laneOf.get(ap.id)!, lanes: laneEnds.length })
    cluster = []
    clusterEnd = -1
  }

  for (const ap of sorted) {
    const s = timeToMinutes(ap.startTime)
    if (cluster.length && s >= clusterEnd) flush()
    cluster.push(ap)
    clusterEnd = Math.max(clusterEnd, timeToMinutes(ap.endTime))
  }
  if (cluster.length) flush()
  return result
}
