import { WEEK_DAYS } from "@/lib/days"
import { dateToStr, parseCalendarDay } from "@/lib/time"
import { isAllDay, toDateInput, toTimeInput } from "@/features/employees/lib/timeOff"
import type { TimeOff } from "@/types"

/** Una columna del calendario. */
export interface TimelineDay {
  /** "YYYY-MM-DD". Es la clave con la que se ubican las ausencias. */
  key: string
  date: Date
  /** "Lun" */
  short: string
  /** "1" */
  number: string
  /** 0 = domingo, como `Date.getDay()`. Lo usan los horarios del empleado. */
  dayOfWeek: number
  isToday: boolean
  /**
   * Sábado o domingo. **No dice que el negocio esté cerrado** —eso depende de
   * los horarios de cada sucursal—: es la franja gris con la que cualquier
   * calendario separa la semana de la que no lo es.
   */
  isWeekend: boolean
}

/** `count` días a partir del lunes de la semana de `today`. */
export function buildDays(today: Date, count: number): TimelineDay[] {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // `getDay()` numera 0 = domingo, así que el lunes está a `(día + 6) % 7` atrás.
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))

  const todayKey = dateToStr(today)

  return Array.from({ length: count }, (_, index) => {
    // Sumar sobre el día del mes y dejar que `Date` normalice: cruza fin de mes
    // y cambios de horario de verano sin cuentas de milisegundos.
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)
    const dayOfWeek = date.getDay()
    const key = dateToStr(date)

    return {
      key,
      date,
      dayOfWeek,
      short: WEEK_DAYS.find((day) => day.value === dayOfWeek)!.short,
      number: String(date.getDate()),
      isToday: key === todayKey,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    }
  })
}

/** "1 al 14 de septiembre", o con los dos meses cuando la ventana los cruza. */
export function rangeLabel(days: TimelineDay[]): string {
  const first = days[0]
  const last = days[days.length - 1]
  if (!first || !last) return ""

  const withMonth = (date: Date) =>
    date.toLocaleDateString("es-AR", { day: "numeric", month: "long" })

  return first.date.getMonth() === last.date.getMonth()
    ? `${first.date.getDate()} al ${withMonth(last.date)}`
    : `${withMonth(first.date)} al ${withMonth(last.date)}`
}

/** Una ausencia ya ubicada en la grilla. */
export interface AbsenceSpan {
  timeOff: TimeOff
  /** Primera y última columna que ocupa, ya recortadas a la ventana. */
  start: number
  end: number
  /** La ausencia empieza antes / termina después de lo que se ve. */
  continuesBefore: boolean
  continuesAfter: boolean
  /** Fila dentro de la persona. Dos ausencias superpuestas no comparten fila. */
  lane: number
}

/**
 * Ubica las ausencias de una persona en la ventana visible.
 *
 * Trabaja sobre días de calendario y no sobre instantes: una ausencia de dos
 * horas ocupa la columna de su día igual que una de dos semanas ocupa catorce.
 * Las que caen fuera de la ventana se descartan, y las que la cruzan se recortan
 * marcando por dónde siguen, para poder dibujarles el borde recto de ese lado.
 */
export function layoutAbsences(
  items: TimeOff[],
  days: TimelineDay[],
): { spans: AbsenceSpan[]; lanes: number } {
  const first = days[0]?.key
  const last = days[days.length - 1]?.key
  if (first === undefined || last === undefined) return { spans: [], lanes: 1 }

  const visible = items
    .map((timeOff) => {
      const from = toDateInput(timeOff.startsAt)
      const to = toDateInput(timeOff.endsAt)
      // "YYYY-MM-DD" ordena igual como texto que como fecha, así que alcanza
      // con comparar las cadenas.
      if (to < first || from > last) return null

      const startIndex = days.findIndex((day) => day.key === from)
      const endIndex = days.findIndex((day) => day.key === to)

      return {
        timeOff,
        start: startIndex === -1 ? 0 : startIndex,
        end: endIndex === -1 ? days.length - 1 : endIndex,
        continuesBefore: from < first,
        continuesAfter: to > last,
      }
    })
    .filter((span) => span !== null)
    .sort((a, b) => a.start - b.start || a.end - b.end)

  // Reparto codicioso: cada ausencia va a la primera fila que ya se liberó.
  // Ordenadas por inicio, alcanza con recordar dónde termina cada fila.
  const laneEnds: number[] = []
  const spans = visible.map((span) => {
    let lane = laneEnds.findIndex((end) => end < span.start)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = span.end
    return { ...span, lane }
  })

  return { spans, lanes: Math.max(1, laneEnds.length) }
}

/** Qué dice la barra: el motivo y cuánto dura. */
export function describeAbsence(timeOff: TimeOff): { title: string; detail: string } {
  const title = timeOff.reason?.trim() || "Ausencia"
  const from = toDateInput(timeOff.startsAt)
  const to = toDateInput(timeOff.endsAt)

  if (from !== to) {
    const millis = parseCalendarDay(to).getTime() - parseCalendarDay(from).getTime()
    // `Math.round` y no una división exacta: el día del cambio de horario de
    // verano dura 23 o 25 horas y truncaría mal.
    const days = Math.round(millis / 86_400_000) + 1
    return { title, detail: `${days} días` }
  }

  return {
    title,
    detail: isAllDay(timeOff.startsAt, timeOff.endsAt)
      ? "Todo el día"
      : `${toTimeInput(timeOff.startsAt)}–${toTimeInput(timeOff.endsAt)}`,
  }
}
