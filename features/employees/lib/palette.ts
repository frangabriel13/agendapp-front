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
}

const PALETTE: PersonColor[] = [
  { avatar: "bg-violet-100 text-violet-700", ring: "ring-violet-400" },
  { avatar: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-400" },
  { avatar: "bg-sky-100 text-sky-700", ring: "ring-sky-400" },
  { avatar: "bg-amber-100 text-amber-700", ring: "ring-amber-400" },
  { avatar: "bg-rose-100 text-rose-700", ring: "ring-rose-400" },
  { avatar: "bg-indigo-100 text-indigo-700", ring: "ring-indigo-400" },
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
