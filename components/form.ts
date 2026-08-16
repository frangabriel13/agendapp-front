import { cn } from "@/lib/utils"

/** Estilos base de inputs, selects y textareas. */
export const controlClasses = cn(
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-neutral-900",
  "placeholder:text-neutral-400 transition-colors",
  "focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40",
  "disabled:cursor-not-allowed disabled:opacity-50",
)

/**
 * Igual que `controlClasses` pero pintando el borde según haya error o no.
 *
 * Vive acá y no en cada formulario porque el color del borde de error es parte
 * del sistema: si cambia, tiene que cambiar en todos lados a la vez.
 */
export function control(error?: unknown): string {
  return cn(controlClasses, error ? "border-red-400" : "border-black/10")
}

/**
 * Igual que un input, pero apagando la flecha nativa del `<select>` y dibujando
 * una propia. Sin esto el desplegable es el único control que cambia de aspecto
 * según el sistema operativo.
 */
export const selectClasses = cn(controlClasses, "select-chevron")

export function selectControl(error?: unknown): string {
  return cn(control(error), "select-chevron")
}
