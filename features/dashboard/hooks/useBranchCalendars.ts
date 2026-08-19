"use client"

import { useQueries } from "@tanstack/react-query"
import { getBusinessHoursRequest, listSpecialDaysRequest } from "@/services/branches"
import { BRANCHES_KEY } from "@/features/branches/hooks/useBranches"
import type { Branch, BusinessHour, SpecialDay } from "@/types"

export interface BranchCalendars {
  /** Semana comercial por id de sucursal. */
  hours: Map<string, BusinessHour[]>
  /** Feriados y horarios especiales por id de sucursal. */
  special: Map<string, SpecialDay[]>
  isPending: boolean
}

/**
 * Cuándo abre el negocio: la semana comercial y los días especiales de cada
 * sucursal.
 *
 * Son dos pedidos por sucursal porque la API los expone separados y no hay un
 * endpoint por tenant. Un negocio tiene dos o tres sucursales, así que alcanza;
 * si algún día hay uno solo, este hook es el único lugar a cambiar.
 *
 * Un error no se propaga: si no se pueden leer los horarios, el calendario
 * muestra la quincena sin rayar en vez de romperse. Rayar de más sería peor —
 * diría "cerrado" sobre días en los que el negocio abre.
 */
export function useBranchCalendars(branches: Branch[]): BranchCalendars {
  return useQueries({
    queries: branches.flatMap((branch) => [
      {
        queryKey: [...BRANCHES_KEY, branch.id, "horarios"],
        queryFn: () => getBusinessHoursRequest(branch.id),
      },
      {
        queryKey: [...BRANCHES_KEY, branch.id, "dias-especiales"],
        queryFn: () => listSpecialDaysRequest(branch.id),
      },
    ]),
    combine: (results) => {
      const hours = new Map<string, BusinessHour[]>()
      const special = new Map<string, SpecialDay[]>()

      branches.forEach((branch, index) => {
        // Cada sucursal aporta dos consultas, en el orden en que se armaron.
        const semana = results[index * 2]
        const especiales = results[index * 2 + 1]
        if (semana?.data) hours.set(branch.id, semana.data as BusinessHour[])
        if (especiales?.data) special.set(branch.id, especiales.data as SpecialDay[])
      })

      return { hours, special, isPending: results.some((result) => result.isPending) }
    },
  })
}
