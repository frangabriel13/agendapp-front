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
  /** Barra sólida sobre el calendario. Lleva el texto en blanco. */
  bar: string
  /** Chip dentro de la barra. */
  chip: string
  /** Círculo con las iniciales. */
  avatar: string
}

const PALETTE: PersonColor[] = [
  {
    bar: "bg-gradient-to-r from-violet-500 to-violet-600",
    chip: "bg-white/20 text-white",
    avatar: "bg-violet-100 text-violet-700",
  },
  {
    bar: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    chip: "bg-white/20 text-white",
    avatar: "bg-emerald-100 text-emerald-700",
  },
  {
    bar: "bg-gradient-to-r from-sky-500 to-sky-600",
    chip: "bg-white/20 text-white",
    avatar: "bg-sky-100 text-sky-700",
  },
  {
    bar: "bg-gradient-to-r from-amber-500 to-amber-600",
    chip: "bg-white/20 text-white",
    avatar: "bg-amber-100 text-amber-700",
  },
  {
    bar: "bg-gradient-to-r from-rose-500 to-rose-600",
    chip: "bg-white/20 text-white",
    avatar: "bg-rose-100 text-rose-700",
  },
  {
    bar: "bg-gradient-to-r from-indigo-500 to-indigo-600",
    chip: "bg-white/20 text-white",
    avatar: "bg-indigo-100 text-indigo-700",
  },
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
