"use client"

import { useQueries } from "@tanstack/react-query"
import { listTimeOffRequest } from "@/services/employees"
import { EMPLOYEES_KEY } from "@/features/employees/hooks/useEmployees"
import type { Employee, TimeOff } from "@/types"

export interface TeamTimeOff {
  /** Ausencias por id de empleado. Vacío mientras cargan. */
  byEmployee: Map<string, TimeOff[]>
  isPending: boolean
  isError: boolean
}

/**
 * Las ausencias de todo el equipo.
 *
 * La API las expone de a una persona (`GET /employees/:id/time-off`), así que
 * esto son N pedidos en paralelo. Alcanza de sobra para un negocio —el plan más
 * grande limita el equipo a un puñado de personas— y si algún día hay un
 * endpoint que las devuelva juntas, este hook es el único lugar a tocar.
 *
 * Las claves son exactamente las de `useTimeOff`: el diálogo de ausencias y el
 * panel leen del mismo cache, así que guardar una ausencia refresca los dos sin
 * que ninguno se entere del otro.
 */
export function useTeamTimeOff(employees: Employee[]): TeamTimeOff {
  return useQueries({
    queries: employees.map((employee) => ({
      queryKey: [...EMPLOYEES_KEY, employee.id, "ausencias"],
      queryFn: () => listTimeOffRequest(employee.id),
    })),
    combine: (results) => ({
      byEmployee: new Map(
        results.flatMap((result, index) => {
          const employee = employees[index]
          return employee && result.data ? [[employee.id, result.data] as const] : []
        }),
      ),
      // Si una sola persona falla, el resto del calendario sigue sirviendo: el
      // error se avisa sin tapar lo que sí llegó.
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
    }),
  })
}
