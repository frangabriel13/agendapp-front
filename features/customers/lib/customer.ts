import type { Customer } from "@/types"

/** El apellido es opcional: "María" sola tiene que leerse bien, sin espacio colgando. */
export function fullName(customer: Pick<Customer, "firstName" | "lastName">): string {
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim()
}

/**
 * Iniciales para el avatar.
 *
 * Toma la del nombre y la del apellido; si no hay apellido, una sola. **No dos
 * del nombre**: "MA" para María se lee como un apellido que no existe.
 */
export function initials(customer: Pick<Customer, "firstName" | "lastName">): string {
  const nombre = customer.firstName.trim().charAt(0)
  const apellido = customer.lastName?.trim().charAt(0) ?? ""

  return (nombre + apellido).toUpperCase()
}

/**
 * Edad cumplida a partir de `"YYYY-MM-DD"`.
 *
 * **Se compara por partes de fecha, sin construir un `Date` desde la cadena.**
 * `new Date("1995-11-02")` la interpreta como medianoche **UTC**, que en
 * Argentina es el 1 de noviembre a las 21:00: la edad daba un año de más durante
 * todo el día del cumpleaños. Es la misma trampa que ya está documentada para
 * los feriados.
 */
export function age(dateOfBirth: string | null | undefined, today: Date): number | null {
  if (!dateOfBirth) return null

  const [year, month, day] = dateOfBirth.split("-").map(Number)
  if (!year || !month || !day) return null

  let años = today.getFullYear() - year
  const mesActual = today.getMonth() + 1

  // Todavía no llegó el cumpleaños de este año.
  if (mesActual < month || (mesActual === month && today.getDate() < day)) años--

  return años < 0 ? null : años
}

/**
 * ¿Cumple años hoy?
 *
 * Para una estética es un dato accionable —saludar, ofrecer algo— y sale gratis
 * de una fecha que ya está cargada.
 */
export function birthdayToday(dateOfBirth: string | null | undefined, today: Date): boolean {
  if (!dateOfBirth) return false

  const [, month, day] = dateOfBirth.split("-").map(Number)

  return month === today.getMonth() + 1 && day === today.getDate()
}
