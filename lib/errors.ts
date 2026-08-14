import { ApiError } from "./api"

/**
 * Texto de error para mostrarle a una persona.
 *
 * El backend manda un array de mensajes ya en castellano —uno por campo cuando
 * falla la validación de NestJS—, así que se usan tal cual. El `fallback` cubre
 * todo lo que no es un `ApiError`: un bug del front, o algo que no pasó por
 * `apiFetch`.
 *
 * No vive en `lib/api.ts` a propósito: eso es transporte y esto es presentación.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback

  // Un `ApiError` sin mensajes es posible (un 500 con cuerpo vacío, por ejemplo)
  // y "" en pantalla es peor que el fallback.
  const messages = error.messages.filter((message) => message.trim() !== "")
  return messages.length > 0 ? messages.join(" · ") : fallback
}
