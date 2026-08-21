import { describe, expect, it } from "vitest"
import { pageAfterRemoval, pageRange, pageWindow, type PageMeta } from "./pagination"

const meta = (overrides: Partial<PageMeta> = {}): PageMeta => ({
  page: 1,
  pageSize: 20,
  total: 137,
  totalPages: 7,
  ...overrides,
})

describe("pageWindow", () => {
  it("no dibuja nada con una sola página o ninguna", () => {
    expect(pageWindow(1, 1)).toEqual([1])
    expect(pageWindow(1, 0)).toEqual([])
  })

  it("dibuja todas cuando entran", () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3])
    expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4])
  })

  /**
   * El caso que justifica la función: 5.000 clientes son 250 páginas, y
   * dibujarlas todas vuelve la barra inusable.
   */
  it("saltea el medio en un total grande", () => {
    expect(pageWindow(125, 250)).toEqual([1, "…", 124, 125, 126, "…", 250])
  })

  it("no deja huérfana la primera ni la última", () => {
    expect(pageWindow(1, 250)).toEqual([1, 2, "…", 250])
    expect(pageWindow(250, 250)).toEqual([1, "…", 249, 250])
  })

  // "…" para saltear un solo número ocupa lo mismo y dice menos.
  it("muestra el número en vez de '…' cuando se saltea uno solo", () => {
    expect(pageWindow(4, 6)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it("respeta cuántas se piden alrededor", () => {
    expect(pageWindow(10, 20, 2)).toEqual([1, "…", 8, 9, 10, 11, 12, "…", 20])
  })
})

describe("pageRange", () => {
  it("cuenta desde 1, no desde 0", () => {
    expect(pageRange(meta())).toBe("1–20 de 137")
    expect(pageRange(meta({ page: 2 }))).toBe("21–40 de 137")
  })

  /** Sin recortar contra el total diría "121–140 de 137". */
  it("recorta el final en la última página, que casi nunca está llena", () => {
    expect(pageRange(meta({ page: 7 }))).toBe("121–137 de 137")
  })

  it("dice que no hay nada en vez de '1–0 de 0'", () => {
    expect(pageRange(meta({ total: 0, totalPages: 0 }))).toBe("Sin resultados")
  })
})

describe("pageAfterRemoval", () => {
  it("se queda donde está mientras la página siga existiendo", () => {
    expect(pageAfterRemoval(meta({ page: 3 }))).toBe(3)
  })

  /**
   * Borrar el único cliente de la última página dejaba la pantalla vacía con una
   * paginación que decía que había páginas: parecía que se había borrado todo.
   */
  it("retrocede cuando la página se queda sin nada", () => {
    expect(pageAfterRemoval(meta({ page: 7, total: 121, totalPages: 7 }))).toBe(6)
  })

  it("nunca baja de 1, ni vaciando todo", () => {
    expect(pageAfterRemoval(meta({ page: 1, total: 1, totalPages: 1 }))).toBe(1)
  })
})
