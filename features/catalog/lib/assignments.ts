import type { Branch, Employee, ServiceEmployee, ServiceEmployeeInput } from "@/types"

/**
 * Quién presta un servicio **y en qué sucursal**.
 *
 * La unidad no es la persona: es el par. Lucía puede hacer corte en las dos
 * sucursales y color solo en Centro, y eso son tres pares, no dos personas.
 *
 * `PUT /services/:id/employees` valida cada par contra las sucursales del
 * empleado y devuelve 400 si esa persona no trabaja ahí. Por eso la grilla
 * **apaga** esas casillas en vez de dejarlas marcar: un error del servidor que
 * el front podía anticipar es un error que el usuario no debería ver.
 */

/** Clave de un par. Sirve de `key` de React y de identidad en un `Set`. */
export function pairKey(employeeId: string, branchId: string): string {
  return `${employeeId}|${branchId}`
}

export interface MatrixEmployee {
  id: string
  name: string
  /** Sucursales donde trabaja. Las demás columnas van apagadas para esta fila. */
  branchIds: string[]
}

export interface MatrixCell {
  branchId: string
  branchName: string
  /** La persona trabaja en esa sucursal: la casilla se puede tocar. */
  enabled: boolean
  checked: boolean
}

export interface MatrixRow {
  employeeId: string
  name: string
  cells: MatrixCell[]
  /** Cuántas casillas marcadas tiene la fila. Para el resumen de al lado. */
  marcadas: number
  /** No trabaja en ninguna sucursal: la fila entera está apagada. */
  sinSucursales: boolean
}

/**
 * Arma la grilla de empleados × sucursales.
 *
 * Recibe todo por parámetro en vez de pedirlo: la misma función sirve para el
 * diálogo y para un test, y así la regla de qué se puede marcar no queda
 * enterrada en un componente.
 */
export function buildMatrix(
  employees: MatrixEmployee[],
  branches: Branch[],
  selected: Set<string>,
): MatrixRow[] {
  return employees.map((employee) => {
    const trabajaEn = new Set(employee.branchIds)

    const cells = branches.map((branch) => ({
      branchId: branch.id,
      branchName: branch.name,
      enabled: trabajaEn.has(branch.id),
      checked: selected.has(pairKey(employee.id, branch.id)),
    }))

    return {
      employeeId: employee.id,
      name: employee.name,
      cells,
      marcadas: cells.filter((cell) => cell.checked).length,
      sinSucursales: employee.branchIds.length === 0,
    }
  })
}

/**
 * Marca o desmarca un par y devuelve un `Set` nuevo.
 *
 * Nuevo y no mutado: React compara por identidad y un `Set` mutado no dispara
 * el re-render.
 */
export function togglePair(selected: Set<string>, employeeId: string, branchId: string): Set<string> {
  const key = pairKey(employeeId, branchId)
  const siguiente = new Set(selected)

  if (siguiente.has(key)) siguiente.delete(key)
  else siguiente.add(key)

  return siguiente
}

/**
 * Todas las sucursales de una persona, o ninguna.
 *
 * Solo alcanza a las que puede marcar: si trabaja en una sola sucursal, "todas"
 * marca esa. Nunca genera un par que el backend fuera a rechazar.
 */
export function toggleRow(
  selected: Set<string>,
  employee: MatrixEmployee,
  branches: Branch[],
): Set<string> {
  const posibles = branches
    .filter((branch) => employee.branchIds.includes(branch.id))
    .map((branch) => pairKey(employee.id, branch.id))

  const siguiente = new Set(selected)
  const todasMarcadas = posibles.length > 0 && posibles.every((key) => siguiente.has(key))

  for (const key of posibles) {
    if (todasMarcadas) siguiente.delete(key)
    else siguiente.add(key)
  }

  return siguiente
}

/** Lo que ya está guardado, como `Set` de pares. */
export function selectionFrom(assignments: ServiceEmployee[]): Set<string> {
  return new Set(assignments.map((a) => pairKey(a.employeeId, a.branchId)))
}

/**
 * El `Set` de vuelta al cuerpo del PUT.
 *
 * Se filtra contra lo que el empleado puede de verdad: si alguien pierde una
 * sucursal mientras el diálogo está abierto, mandar el par viejo sería un 400.
 */
export function toAssignments(
  selected: Set<string>,
  employees: MatrixEmployee[],
): ServiceEmployeeInput[] {
  const permitido = new Set(
    employees.flatMap((e) => e.branchIds.map((branchId) => pairKey(e.id, branchId))),
  )

  return [...selected]
    .filter((key) => permitido.has(key))
    .map((key) => {
      const [employeeId, branchId] = key.split("|")
      return { employeeId: employeeId!, branchId: branchId! }
    })
}

/**
 * ¿Cambió algo respecto de lo guardado?
 *
 * Para no mandar un PUT que reemplaza todo por lo mismo: el endpoint reescribe
 * la lista completa, y una escritura inútil es una oportunidad de pisar lo que
 * otro acaba de cambiar.
 */
export function hasChanges(selected: Set<string>, original: Set<string>): boolean {
  if (selected.size !== original.size) return true
  for (const key of selected) if (!original.has(key)) return true
  return false
}

/** El nombre que se muestra en la grilla. */
export function employeeName(employee: Employee): string {
  return `${employee.user.firstName} ${employee.user.lastName}`.trim()
}
