import type { CSSProperties } from "react"
import type { AppointmentStatus } from "@/types"

/**
 * Cómo se rellena el bloque de un turno.
 *
 * **El color dice quién atiende; el relleno dice cómo viene.** Son dos datos
 * distintos y en una grilla de veinte bloques el color rinde mucho más
 * identificando a la persona: si el color dijera el estado, una semana normal
 * sería una pared verde con dos excepciones, y no se podría seguir a nadie de
 * una columna a otra.
 */
export type BlockLook =
  /** Confirmado: el bloque lleno. */
  | "solid"
  /** A confirmar: tinta clara y borde punteado, porque todavía no está cerrado. */
  | "soft"
  /** Atendido: el mismo color, apagado. Ya pasó. */
  | "muted"
  /** Cancelado o ausencia: no ocurrió, se va al gris. */
  | "off"

export function blockLook(status: AppointmentStatus): BlockLook {
  switch (status) {
    case "confirmed":
      return "solid"
    case "pending":
      return "soft"
    case "completed":
      return "muted"
    default:
      return "off"
  }
}

export interface BlockSkin {
  /** Estilos del bloque. Van inline porque el color sale del dato, no del tema. */
  box: CSSProperties
  /** Color del texto y los íconos de adentro. */
  ink: string
  /** Fondo de los chips que van sobre el bloque: la duración, el ícono. */
  veil: string
}

/**
 * El color de una persona convertido en los cuatro rellenos.
 *
 * Se deriva del hexadecimal con `color-mix` en vez de mantener una paleta de
 * tonos por persona: el color es un dato de la persona y así hay uno solo. Si
 * mañana sale de la API, esto no cambia.
 */
export function blockSkin(color: string, look: BlockLook): BlockSkin {
  switch (look) {
    case "solid":
      return {
        box: {
          background: `linear-gradient(135deg, ${color} 0%, ${sombra(color)} 100%)`,
          border: "1px solid transparent",
          boxShadow: `0 6px 16px -10px ${color}`,
        },
        ink: "#fff",
        veil: "rgba(255,255,255,0.24)",
      }

    case "muted":
      return {
        box: {
          background: `linear-gradient(135deg, ${color} 0%, ${sombra(color)} 100%)`,
          border: "1px solid transparent",
          // Apagado con opacidad y sin sombra: se lee "ya pasó" sin perder el
          // contraste del texto blanco, que a menos de esto deja de cumplir.
          opacity: 0.85,
        },
        ink: "#fff",
        veil: "rgba(255,255,255,0.24)",
      }

    case "soft":
      return {
        box: {
          background: lavado(color, 12),
          border: `1.5px dashed ${color}`,
        },
        ink: sombra(color, 82),
        veil: "rgba(0,0,0,0.06)",
      }

    case "off":
      return {
        box: {
          background: "var(--color-neutral-100)",
          border: "1px solid var(--color-neutral-200)",
        },
        ink: "var(--color-neutral-500)",
        veil: "rgba(0,0,0,0.05)",
      }
  }
}

/** El mismo color, más oscuro. El segundo tramo del degradé y la tinta legible. */
function sombra(color: string, porcentaje = 78): string {
  return `color-mix(in oklab, ${color} ${porcentaje}%, #000)`
}

/** El mismo color, lavado contra blanco. */
function lavado(color: string, porcentaje: number): string {
  return `color-mix(in oklab, ${color} ${porcentaje}%, #fff)`
}

/** Círculo de avatar del color de la persona, con la inicial en blanco. */
export function avatarStyle(color: string): CSSProperties {
  return { background: `linear-gradient(135deg, ${color} 0%, ${sombra(color)} 100%)`, color: "#fff" }
}
