import { formatCents } from "@/features/catalog/lib/money"
import type { RefundDecision } from "@/types"

/**
 * Cómo se cuenta la devolución que el backend calculó al cancelar.
 *
 * **Es la única forma que tiene el panel de saber cuánto devolver.** La política
 * —cuántas horas de aviso, y si eso da reintegro total, parcial, crédito o nada—
 * vive en `TenantSettings`, y rehacer esa cuenta en el front sería tener dos
 * verdades sobre plata.
 */

export interface AvisoDevolucion {
  titulo: string
  /** El motivo lo redacta el backend en castellano; se muestra tal cual. */
  detalle: string
  /** `true` cuando hay plata que devolver y alguien tiene que hacerlo. */
  hayQueDevolver: boolean
}

const TIPO: Record<RefundDecision["type"], string> = {
  FULL: "Corresponde devolver todo",
  PARTIAL: "Corresponde devolver una parte",
  CREDIT: "Corresponde dejar un crédito a favor",
  // "No corresponde devolución" a secas se contradecía con el saldo de al lado:
  // la política puede decir que no hay que devolver nada **y** haber plata
  // cobrada. Nombrar a la política como sujeto deja de negar el otro dato.
  NONE: "La política no obliga a devolver nada",
}

/**
 * El aviso, o `null` si no hay nada que decir.
 *
 * **`NONE` con plata cobrada también se dice**, y es el caso delicado: quien
 * acaba de cancelar un turno con plata adentro necesita saber que la política no
 * lo obliga a devolver, tanto como necesitaría saber lo contrario. Lo que no se
 * dice es un `NONE` de un turno donde nunca hubo plata: ahí no hay ninguna
 * pregunta abierta.
 *
 * **La decisión del backend mira la seña, no todo lo cobrado.** Un turno sin seña
 * configurada al que alguien le pagó $5.000 en el mostrador vuelve como `NONE`
 * con el motivo "no había seña pagada" — y al lado el saldo dice que hay $5.000
 * en caja. Las dos cosas son ciertas y contarlas juntas es lo único honesto:
 * esconder la segunda haría que la plata se pierda de vista, y esconder la
 * primera inventaría una obligación que la política no impone.
 */
export function avisoDevolucion(
  refund: RefundDecision | null | undefined,
  cobradoCents: number,
): AvisoDevolucion | null {
  if (!refund) return null
  if (refund.type === "NONE" && cobradoCents <= 0) return null

  const monto = refund.amountCents > 0 ? `: ${formatCents(refund.amountCents)}` : ""
  const sobrante =
    refund.type === "NONE" && cobradoCents > 0
      ? ` Igual quedaron ${formatCents(cobradoCents)} cobrados por este turno: qué hacer con eso lo decide el negocio.`
      : ""

  return {
    titulo: `${TIPO[refund.type]}${monto}`,
    detalle: `${refund.reason}${sobrante}`,
    hayQueDevolver: refund.type !== "NONE" && refund.amountCents > 0,
  }
}
