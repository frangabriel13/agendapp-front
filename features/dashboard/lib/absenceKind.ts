export type AbsenceKind = "vacaciones" | "medica" | "libre" | "otro"

/**
 * De qué es la ausencia.
 *
 * **Puente temporal: se adivina del texto.** La API no guarda un tipo — `TimeOff`
 * solo tiene `reason`, que es texto libre— así que esto busca palabras clave y
 * cae en `otro` cuando no reconoce nada. Falla con lo que no está en la lista:
 * "me voy a Brasil" no es vacaciones para esta función.
 *
 * **Cuando el backend agregue un campo de tipo, esta función se borra** y el
 * valor sale del dato. Es el único lugar del front que hace esta suposición, y
 * por eso vive sola en su archivo.
 */
export function absenceKind(reason: string | null): AbsenceKind {
  const texto = normalizar(reason ?? "")
  if (texto === "") return "otro"

  // El orden importa: "licencia anual" es vacaciones y "licencia médica" no,
  // así que vacaciones se pregunta primero.
  if (contiene(texto, VACACIONES)) return "vacaciones"
  if (contiene(texto, MEDICA)) return "medica"
  if (contiene(texto, LIBRE)) return "libre"
  return "otro"
}

/** Sin acentos y en minúscula: nadie escribe "médico" igual dos veces. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

function contiene(texto: string, claves: readonly string[]): boolean {
  return claves.some((clave) => texto.includes(clave))
}

const VACACIONES = ["vacacion", "vacas", "licencia anual", "receso"] as const

const MEDICA = [
  "medic",
  "salud",
  "enferm",
  "reposo",
  "dentista",
  "odontolog",
  "psicolog",
  "kinesio",
  "cirug",
  "internac",
  "guardia",
] as const

const LIBRE = ["franco", "dia libre", "personal", "tramite", "mudanza", "estudio", "examen"] as const

export const KIND_LABEL: Record<AbsenceKind, string> = {
  vacaciones: "Vacaciones",
  medica: "Licencia médica",
  libre: "Día libre",
  otro: "Ausencia",
}
