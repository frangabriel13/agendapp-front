import { WEEK_DAYS } from "@/lib/days"
import { dateToStr } from "@/lib/time"

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
