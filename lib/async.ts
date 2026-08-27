/**
 * Recorre una lista llamando a `fn`, con un tope de llamadas en vuelo.
 *
 * **Existe por el throttle del backend**, que es de 10 pedidos por segundo y 100
 * cada ~50 s para *todo*, no solo escrituras. Un `Promise.all` sobre los turnos de
 * un día ocupado dispara treinta pedidos en el mismo tick y se come un 429: no
 * porque el front esté haciendo algo raro, sino porque nadie le puso freno.
 *
 * Devuelve los resultados **en el orden de entrada**, no en el de llegada: quien
 * llama empareja por índice y un orden distinto haría que el saldo de una persona
 * apareciera al lado del nombre de otra.
 *
 * No reordena ni reintenta: si una llamada falla, la promesa falla. Reintentar es
 * decisión de quien llama —React Query ya lo hace— y esconderlo acá haría que un
 * error puntual se viera como una lista incompleta.
 */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const resultados = new Array<R>(items.length)
  let siguiente = 0

  async function obrero(): Promise<void> {
    while (siguiente < items.length) {
      // Se toma el índice **antes** del await: sin eso, dos obreros que despiertan
      // a la vez leen el mismo `siguiente` y hacen dos veces el mismo pedido.
      const indice = siguiente++
      resultados[indice] = await fn(items[indice]!, indice)
    }
  }

  const obreros = Array.from({ length: Math.min(limit, items.length) }, obrero)
  await Promise.all(obreros)

  return resultados
}
