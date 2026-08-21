/**
 * Paginación de la API.
 *
 * `GET /customers` es el primer endpoint paginado, y **la misma forma se repite
 * en el historial de turnos y de pagos**, así que la cuenta vive acá y no en la
 * pantalla de clientes.
 */

/** El `meta` que acompaña a `data` en toda respuesta paginada. */
export interface PageMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/** Por defecto del backend. Pedir más de 100 devuelve 400. */
export const PAGE_SIZE = 20

/** Un botón de la paginación: un número, o el salto entre dos tramos. */
export type PageToken = number | "…"

/**
 * Los botones a dibujar: primera, última, un par alrededor de la actual, y "…"
 * donde se saltea.
 *
 * Sin esto, 137 clientes son 7 páginas y se dibujan las 7; con 5.000 son 250
 * botones y la barra se vuelve inusable. La ventana mantiene el ancho fijo
 * mientras el usuario navega, que es lo que evita que los botones se muevan
 * abajo del cursor.
 *
 * `alrededor` es cuántas páginas se muestran a cada lado de la actual.
 */
export function pageWindow(page: number, totalPages: number, alrededor = 1): PageToken[] {
  if (totalPages <= 1) return totalPages === 1 ? [1] : []

  const paginas = new Set<number>([1, totalPages])
  for (let p = page - alrededor; p <= page + alrededor; p++) {
    if (p >= 1 && p <= totalPages) paginas.add(p)
  }

  const ordenadas = [...paginas].sort((a, b) => a - b)
  const tokens: PageToken[] = []

  for (const [index, actual] of ordenadas.entries()) {
    const previa = ordenadas[index - 1]
    // Un solo número salteado no merece "…": ocupa lo mismo y dice menos.
    if (previa !== undefined && actual - previa > 1) {
      tokens.push(actual - previa === 2 ? actual - 1 : "…")
    }
    tokens.push(actual)
  }

  return tokens
}

/**
 * "1–20 de 137". El rango que se está viendo.
 *
 * La última página casi nunca está llena, así que el final se recorta contra el
 * total: sin eso diría "121–140 de 137".
 */
export function pageRange(meta: PageMeta): string {
  if (meta.total === 0) return "Sin resultados"

  const desde = (meta.page - 1) * meta.pageSize + 1
  const hasta = Math.min(desde + meta.pageSize - 1, meta.total)

  return `${desde}–${hasta} de ${meta.total}`
}

/**
 * La página a la que hay que ir después de borrar el último ítem de la actual.
 *
 * Sin esto, borrar el único cliente de la página 7 deja la pantalla vacía con
 * una paginación que dice que hay 6 páginas: parece que se borró todo.
 */
export function pageAfterRemoval(meta: PageMeta, borrados = 1): number {
  const quedan = Math.max(0, meta.total - borrados)
  const paginas = Math.max(1, Math.ceil(quedan / meta.pageSize))

  return Math.min(meta.page, paginas)
}
