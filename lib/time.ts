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

/**
 * Un instante ISO de la API, partido en día de calendario y hora de reloj.
 *
 * **La API manda instantes (`"2026-09-07T12:00:00.000Z"`) y el calendario dibuja
 * horas de pared.** Son dos cosas distintas: las 12:00 UTC son las 9 de la mañana
 * acá. La conversión pasa por acá y por ningún otro lado, así que si mañana el
 * negocio opera en otra zona hay un solo lugar que cambiar.
 *
 * **Se usa la zona del navegador**, que es la del negocio en la práctica: el
 * panel lo abre gente que trabaja ahí. Cuando haga falta atender un negocio en
 * otra zona, `GET /appointments/availability` ya devuelve su `timezone` y esta
 * función es donde entra.
 */
export function splitInstant(iso: string): { day: string; time: string } {
  const fecha = new Date(iso)
  return { day: dateToStr(fecha), time: clockTime(fecha) }
}

/** La hora de pared de una fecha, "HH:MM". */
export function clockTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

/**
 * El camino inverso: un día de calendario y una hora de reloj, como instante ISO.
 *
 * Lo necesita `POST /appointments`, que recibe `startsAt`. Construir la fecha por
 * partes —y no con `new Date("2026-09-07T09:00")`— la interpreta en la zona
 * local, que es donde el usuario eligió esa hora.
 */
export function toInstant(day: string, time: string): string {
  const [year, month, date] = day.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)

  return new Date(year!, month! - 1, date!, hours!, minutes!).toISOString()
}
