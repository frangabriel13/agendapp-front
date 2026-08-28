import { describe, expect, it } from "vitest"
import { crearLimitador } from "./throttle"

describe("crearLimitador", () => {
  it("una ráfaga que entra en el cupo no espera nada", () => {
    const limitador = crearLimitador(8, 1000)

    const turnos = Array.from({ length: 8 }, () => limitador.turno(1000))

    expect(turnos).toEqual(Array(8).fill(1000))
  })

  it("el que se pasa espera a que salga el más viejo de la ventana", () => {
    const limitador = crearLimitador(8, 1000)
    for (let i = 0; i < 8; i++) limitador.turno(1000)

    // El noveno sale cuando el primero cumple el segundo, no un segundo después
    // de haber llegado.
    expect(limitador.turno(1000)).toBe(2000)
  })

  it("los 16 del dashboard salen en dos tandas, no de a uno por segundo", () => {
    const limitador = crearLimitador(8, 1000)

    const turnos = Array.from({ length: 16 }, () => limitador.turno(1000))

    expect(turnos.slice(0, 8)).toEqual(Array(8).fill(1000))
    expect(turnos.slice(8)).toEqual(Array(8).fill(2000))
  })

  it("es deslizante: lo que ya salió de la ventana devuelve el cupo", () => {
    const limitador = crearLimitador(2, 1000)
    limitador.turno(0)
    limitador.turno(0)

    // Al segundo 1 los dos primeros ya salieron de la ventana.
    expect(limitador.turno(1000)).toBe(1000)
    expect(limitador.turno(1000)).toBe(1000)
    expect(limitador.turno(1000)).toBe(2000)
  })

  it("navegar tranquilo nunca espera", () => {
    const limitador = crearLimitador(8, 1000)

    // Un pedido cada 300 ms durante un rato: nunca llega a llenar la ventana.
    for (let t = 0; t < 10_000; t += 300) {
      expect(limitador.turno(t)).toBe(t)
    }
  })

  it("una cola larga se reparte, no se apila en un solo instante", () => {
    const limitador = crearLimitador(2, 1000)

    const turnos = Array.from({ length: 6 }, () => limitador.turno(0))

    expect(turnos).toEqual([0, 0, 1000, 1000, 2000, 2000])
  })
})
