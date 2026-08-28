/**
 * El freno de mano del cliente contra el rate limiting del backend.
 *
 * **El servidor permite 10 pedidos por segundo para todo junto** (`X-RateLimit-*`)
 * y contesta 429 al que se pasa. El panel no llega a eso navegando, pero sí en
 * ráfaga: el dashboard con tres empleados dispara **16 pedidos en un segundo**
 * —las ausencias y los horarios de cada uno, que la API expone de a una persona—
 * y con un equipo grande son treinta. Ahí el 429 no es culpa de nadie: es abrir
 * una pantalla.
 *
 * Esperar el turno es infinitamente mejor que el error, porque el error lo paga
 * el usuario: un cartel de "demasiados intentos" en una pantalla que solo abrió.
 *
 * **Es una ventana deslizante, no un espaciado fijo.** Una ráfaga chica —lo
 * normal— pasa entera sin agregar un milisegundo; solo espera lo que excede el
 * cupo, y espera exactamente hasta que el turno más viejo salga de la ventana.
 */
export interface Limitador {
  /**
   * Cuándo puede salir el pedido que llega en `ahora`. Devuelve `ahora` mismo si
   * hay cupo. **Toma el turno al preguntar**: cada llamada consume uno.
   */
  turno(ahora: number): number
}

export function crearLimitador(limite: number, ventanaMs: number): Limitador {
  /** Los instantes en que salen los últimos `limite` turnos dados. Ordenados. */
  const dados: number[] = []

  return {
    turno(ahora: number): number {
      // Con la ventana llena hay que esperar a que el más viejo salga de ella;
      // con lugar, sale ya. **La longitud es la que decide**, no un centinela:
      // con un instante 0 —el arranque de un reloj de test— "todavía no hay
      // ninguno" y "el más viejo salió en 0" serían el mismo número.
      const cuando =
        dados.length < limite ? ahora : Math.max(ahora, dados[0]! + ventanaMs)

      dados.push(cuando)
      if (dados.length > limite) dados.shift()

      return cuando
    },
  }
}

/**
 * 8 y no 10: el margen es para lo que no controlamos —otra pestaña abierta del
 * mismo panel, un reintento del navegador—. Pasarse cuesta un 429; ir dos por
 * debajo no cuesta nada que se note.
 *
 * **Y la ventana del cliente es más larga que la del servidor (1,1 s contra 1 s)**
 * para no depender de que los dos relojes empiecen a contar en el mismo instante.
 * Con 1000 exactos, dos tandas separadas por un segundo entran en la misma
 * ventana del servidor apenas su corte esté unos milisegundos corrido, y ahí la
 * cuenta da dieciséis. Los 100 ms de más lo vuelven imposible.
 *
 * **La ventana larga (100 cada 50 s) no se frena acá a propósito.** Este ritmo
 * sostenido daría más de 300, así que en teoría la larga se puede tocar igual;
 * en la práctica la toca una ráfaga, no un uso sostenido, y frenar de más
 * dejaría la app lenta sin decir por qué. Si algún día aparecen 429 sin ráfaga,
 * este es el lugar.
 */
const limitador = crearLimitador(8, 1100)

/** Espera el turno, si hay que esperarlo. En el caso normal no espera nada. */
export function esperarTurno(): Promise<void> {
  const ahora = Date.now()
  const cuando = limitador.turno(ahora)

  if (cuando <= ahora) return Promise.resolve()
  return new Promise((listo) => setTimeout(listo, cuando - ahora))
}
