export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function addMinutes(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes)
}

export function dateToStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * La inversa de `dateToStr`: convierte "YYYY-MM-DD" a una fecha local.
 *
 * **No usar `new Date("2026-12-25")`**: la spec obliga a interpretar ese formato
 * como UTC, así que en una zona negativa —toda América— se corre un día para
 * atrás y el 25 se muestra como 24. Armando la fecha por partes se interpreta en
 * la zona local, que es lo que representa un día de calendario.
 */
export function parseCalendarDay(date: string): Date {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(year!, month! - 1, day!)
}
