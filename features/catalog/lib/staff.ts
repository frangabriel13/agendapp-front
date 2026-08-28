import type { ServiceEmployee } from "@/types"

/**
 * Quiénes pueden atender **todos** los servicios de un turno en una sucursal.
 *
 * **Es una intersección, no una unión**, porque el turno lo atiende una sola
 * persona: si Lucía hace corte y Ana hace color pero ninguna las dos, para
 * corte+color no hay nadie. Ofrecer la unión sería ofrecer profesionales que
 * después rebotan, y encima contra una disponibilidad que ya viene vacía —el
 * backend hace la misma cuenta y contesta `noEmployeeForServices`—.
 *
 * **El par es la unidad, no la persona.** Alguien puede prestar el servicio en
 * el centro y no en la otra sede, así que se compara empleado *y* sucursal.
 *
 * Sin servicios devuelve vacío: todavía no hay a quién pedirle nada.
 */
export function quienesPrestanTodos(
  porServicio: ServiceEmployee[][],
  branchId: string | null,
): ServiceEmployee[] {
  const [primero, ...resto] = porServicio
  if (!primero) return []

  return primero
    .filter((par) => par.branchId === branchId)
    .filter((par) =>
      resto.every((lista) =>
        lista.some((otro) => otro.employeeId === par.employeeId && otro.branchId === par.branchId),
      ),
    )
}
