import { describe, expect, it } from "vitest"
import {
  buildMatrix,
  hasChanges,
  pairKey,
  selectionFrom,
  toAssignments,
  toggleRow,
  togglePair,
  type MatrixEmployee,
} from "./assignments"
import type { Branch, ServiceEmployee } from "@/types"

const CENTRO = { id: "b-centro", name: "Sucursal Centro" } as Branch
const PALERMO = { id: "b-palermo", name: "Sucursal Palermo" } as Branch
const SUCURSALES = [CENTRO, PALERMO]

// Como en el seed: Lucía trabaja en las dos, Ana solo en Centro.
const LUCIA: MatrixEmployee = { id: "e-lucia", name: "Lucía", branchIds: [CENTRO.id, PALERMO.id] }
const ANA: MatrixEmployee = { id: "e-ana", name: "Ana", branchIds: [CENTRO.id] }
const NUEVO: MatrixEmployee = { id: "e-nuevo", name: "Sin asignar", branchIds: [] }

describe("buildMatrix", () => {
  /**
   * Es la regla central de la pantalla: el backend devuelve 400 si el par
   * (empleado, sucursal) no existe, así que la casilla tiene que estar apagada
   * antes de que alguien pueda tocarla.
   */
  it("apaga las sucursales donde la persona no trabaja", () => {
    const [lucia, ana] = buildMatrix([LUCIA, ANA], SUCURSALES, new Set())

    expect(lucia!.cells.map((c) => c.enabled)).toEqual([true, true])
    expect(ana!.cells.map((c) => c.enabled)).toEqual([true, false])
  })

  it("marca lo que ya estaba guardado", () => {
    const selected = new Set([pairKey(LUCIA.id, CENTRO.id)])
    const [lucia] = buildMatrix([LUCIA], SUCURSALES, selected)

    expect(lucia!.cells.map((c) => c.checked)).toEqual([true, false])
    expect(lucia!.marcadas).toBe(1)
  })

  // Un empleado recién invitado no tiene sucursales: la fila se muestra apagada
  // con una explicación, en vez de desaparecer sin decir por qué.
  it("señala a quien no trabaja en ninguna sucursal", () => {
    const [nuevo] = buildMatrix([NUEVO], SUCURSALES, new Set())

    expect(nuevo!.sinSucursales).toBe(true)
    expect(nuevo!.cells.every((c) => !c.enabled)).toBe(true)
  })
})

describe("togglePair", () => {
  it("marca y desmarca", () => {
    const vacio = new Set<string>()
    const conLucia = togglePair(vacio, LUCIA.id, CENTRO.id)

    expect(conLucia.has(pairKey(LUCIA.id, CENTRO.id))).toBe(true)
    expect(togglePair(conLucia, LUCIA.id, CENTRO.id).size).toBe(0)
  })

  // React compara por identidad: un Set mutado no dispara el re-render.
  it("devuelve un Set nuevo sin tocar el anterior", () => {
    const original = new Set<string>()
    const siguiente = togglePair(original, LUCIA.id, CENTRO.id)

    expect(siguiente).not.toBe(original)
    expect(original.size).toBe(0)
  })
})

describe("toggleRow", () => {
  it("marca todas las sucursales de la persona", () => {
    const result = toggleRow(new Set(), LUCIA, SUCURSALES)

    expect(result.size).toBe(2)
  })

  it("desmarca cuando ya estaban todas", () => {
    const todas = toggleRow(new Set(), LUCIA, SUCURSALES)

    expect(toggleRow(todas, LUCIA, SUCURSALES).size).toBe(0)
  })

  /** "Todas" nunca puede generar un par que el backend fuera a rechazar. */
  it("solo alcanza las sucursales donde la persona trabaja", () => {
    const result = toggleRow(new Set(), ANA, SUCURSALES)

    expect([...result]).toEqual([pairKey(ANA.id, CENTRO.id)])
  })

  it("no hace nada con quien no trabaja en ninguna", () => {
    expect(toggleRow(new Set(), NUEVO, SUCURSALES).size).toBe(0)
  })
})

describe("selectionFrom", () => {
  it("lee lo guardado como pares", () => {
    const guardado = [
      { employeeId: LUCIA.id, employeeName: "Lucía", branchId: CENTRO.id, branchName: "Centro" },
    ] as ServiceEmployee[]

    expect(selectionFrom(guardado)).toEqual(new Set([pairKey(LUCIA.id, CENTRO.id)]))
  })
})

describe("toAssignments", () => {
  it("arma el cuerpo del PUT", () => {
    const selected = new Set([pairKey(LUCIA.id, PALERMO.id)])

    expect(toAssignments(selected, [LUCIA, ANA])).toEqual([
      { employeeId: LUCIA.id, branchId: PALERMO.id },
    ])
  })

  /**
   * Si alguien pierde una sucursal mientras el diálogo está abierto, el par
   * viejo sigue en el `Set` y mandarlo sería un 400. El filtro es la red.
   */
  it("descarta los pares que dejaron de ser posibles", () => {
    const selected = new Set([pairKey(ANA.id, PALERMO.id), pairKey(ANA.id, CENTRO.id)])

    expect(toAssignments(selected, [ANA])).toEqual([{ employeeId: ANA.id, branchId: CENTRO.id }])
  })
})

describe("hasChanges", () => {
  it("no ve cambios cuando es lo mismo en otro orden", () => {
    const a = new Set([pairKey(LUCIA.id, CENTRO.id), pairKey(ANA.id, CENTRO.id)])
    const b = new Set([pairKey(ANA.id, CENTRO.id), pairKey(LUCIA.id, CENTRO.id)])

    expect(hasChanges(a, b)).toBe(false)
  })

  it("ve el alta y la baja", () => {
    const original = new Set([pairKey(LUCIA.id, CENTRO.id)])

    expect(hasChanges(new Set([pairKey(LUCIA.id, PALERMO.id)]), original)).toBe(true)
    expect(hasChanges(new Set(), original)).toBe(true)
  })
})
