/**
 * Días de la semana como los numera el backend —0 = domingo, igual que
 * `Date.getDay()`— pero listados arrancando en lunes, que es como se lee una
 * semana laboral.
 *
 * **El orden del array no coincide con el valor**, y esa es justamente la razón
 * de que exista: ordenar por el número crudo pone el domingo primero.
 */
export const WEEK_DAYS = [
  { value: 1, label: "Lunes", short: "Lun" },
  { value: 2, label: "Martes", short: "Mar" },
  { value: 3, label: "Miércoles", short: "Mié" },
  { value: 4, label: "Jueves", short: "Jue" },
  { value: 5, label: "Viernes", short: "Vie" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 0, label: "Domingo", short: "Dom" },
] as const

/** Posición del día en la semana de lectura. -1 si el número no es válido. */
export function dayOrder(dayOfWeek: number): number {
  return WEEK_DAYS.findIndex((day) => day.value === dayOfWeek)
}
