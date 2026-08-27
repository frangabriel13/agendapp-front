import { describe, expect, it } from "vitest"
import { mapLimit } from "./async"

/** Una promesa que se resuelve cuando alguien la libera desde afuera. */
function diferida<T>() {
  let resolver!: (valor: T) => void
  const promesa = new Promise<T>((r) => (resolver = r))
  return { promesa, resolver }
}

describe("mapLimit", () => {
  it("devuelve los resultados en el orden de entrada, no en el de llegada", async () => {
    // El primero tarda más que el segundo a propósito: sin cuidar el orden, el
    // saldo de una persona terminaría al lado del nombre de otra.
    const resultado = await mapLimit([30, 0, 10], 3, async (ms, i) => {
      await new Promise((r) => setTimeout(r, ms))
      return `${i}:${ms}`
    })

    expect(resultado).toEqual(["0:30", "1:0", "2:10"])
  })

  it("nunca tiene más de `limit` llamadas en vuelo", async () => {
    let enVuelo = 0
    let pico = 0

    await mapLimit(Array.from({ length: 12 }, (_, i) => i), 3, async () => {
      enVuelo++
      pico = Math.max(pico, enVuelo)
      await new Promise((r) => setTimeout(r, 5))
      enVuelo--
    })

    expect(pico).toBe(3)
  })

  /**
   * El índice se toma antes del `await`. Sin eso, dos obreros que despiertan a la
   * vez leen el mismo contador y piden dos veces lo mismo —y una fila queda sin
   * pedir.
   */
  it("no repite ni saltea un elemento", async () => {
    const vistos: number[] = []

    await mapLimit(Array.from({ length: 20 }, (_, i) => i), 5, async (n) => {
      await new Promise((r) => setTimeout(r, 1))
      vistos.push(n)
    })

    expect(vistos.sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i))
  })

  it("con la lista vacía no llama a nadie", async () => {
    let llamadas = 0
    const resultado = await mapLimit([], 4, async () => llamadas++)

    expect(resultado).toEqual([])
    expect(llamadas).toBe(0)
  })

  it("un fallo se propaga: una lista incompleta sería peor", async () => {
    const pendiente = diferida<number>()

    await expect(
      mapLimit([1, 2], 2, async (n) => {
        if (n === 1) throw new Error("no anduvo")
        return pendiente.promesa
      }),
    ).rejects.toThrow("no anduvo")

    pendiente.resolver(0)
  })
})
