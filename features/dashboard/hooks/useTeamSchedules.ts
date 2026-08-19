"use client"

import { useQueries } from "@tanstack/react-query"
import { listSchedulesRequest } from "@/services/employees"
import { EMPLOYEES_KEY } from "@/features/employees/hooks/useEmployees"
import type { Employee, EmployeeShift } from "@/types"

export interface TeamSchedules {
  /** Tramos de trabajo por id de empleado. Vacío mientras cargan. */
  byEmployee: Map<string, EmployeeShift[]>
  isPending: boolean
  isError: boolean
}

/**
 * Los horarios de todo el equipo.
 *
 * Mismo trato que `useTeamTimeOff`: la API los expone de a una persona
 * (`GET /employees/:id/schedules`), así que son N pedidos en paralelo. Las
 * claves son las de `useEmployeeSchedules`, así que el diálogo de horarios y el
 * panel comparten cache y guardar un horario refresca los dos.
 */
export function useTeamSchedules(employees: Employee[]): TeamSchedules {
  return useQueries({
    queries: employees.map((employee) => ({
      queryKey: [...EMPLOYEES_KEY, employee.id, "horarios"],
      queryFn: () => listSchedulesRequest(employee.id),
    })),
    combine: (results) => ({
      byEmployee: new Map(
        results.flatMap((result, index) => {
          const employee = employees[index]
          return employee && result.data ? [[employee.id, result.data] as const] : []
        }),
      ),
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
    }),
  })
}
