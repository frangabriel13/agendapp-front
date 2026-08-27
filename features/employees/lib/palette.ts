/**
 * Color estable por persona.
 *
 * El backend no guarda un color para cada empleado, pero en cualquier vista con
 * varias filas —el calendario de ausencias, la agenda— el color es lo que deja
 * seguir a alguien de una fila a otra.
 *
 * Sale de un hash del id y no de la posición en la lista: si saliera de la
 * posición, sumar a alguien al equipo le cambiaría el color a todos los que
 * estén después, y el color dejaría de identificar a nadie.
 */
export interface PersonColor {
  /** Círculo del avatar: fondo tenue y trazo del mismo tono. */
  avatar: string
  /** Aro alrededor del avatar. Es lo que identifica a la persona en la grilla. */
  ring: string
  /**
   * El mismo tono en hexa.
   *
   * Lo necesita la agenda, que deriva sus gradientes con `color-mix` y no puede
   * hacerlo desde una clase de Tailwind. **Es el mismo color que `avatar` y
   * `ring`**: si se desalinean, la misma persona aparece de dos colores según la
   * pantalla, que es justo lo que el color viene a evitar.
   */
  hex: string
}

const PALETTE: PersonColor[] = [
  { avatar: "bg-violet-100 text-violet-700", ring: "ring-violet-400", hex: "#7c3aed" },
  { avatar: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-400", hex: "#059669" },
  { avatar: "bg-sky-100 text-sky-700", ring: "ring-sky-400", hex: "#0284c7" },
  { avatar: "bg-amber-100 text-amber-700", ring: "ring-amber-400", hex: "#d97706" },
  { avatar: "bg-rose-100 text-rose-700", ring: "ring-rose-400", hex: "#e11d48" },
  { avatar: "bg-indigo-100 text-indigo-700", ring: "ring-indigo-400", hex: "#4f46e5" },
]

export function personColor(id: string): PersonColor {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    // `| 0` mantiene el acumulador en 32 bits: sin eso, un id largo desborda a
    // punto flotante y los últimos caracteres dejan de cambiar el resultado.
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]!
}
