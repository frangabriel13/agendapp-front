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

/**
 * Un campo extra del cuerpo de un error, cuando el error es el que se esperaba.
 *
 * Existe porque **algunos errores del backend traen una salida adentro**: el 409
 * de `POST /customers` manda `existingCustomer` con la ficha ya cargada, y con
 * eso la pantalla ofrece "¿es esta persona?" en vez de un cartel rojo.
 *
 * Pide el `statusCode` a propósito: leer `existingCustomer` de cualquier error
 * que pase por acá haría que un 500 con un cuerpo raro se interpretara como un
 * duplicado. El tipo de vuelta es responsabilidad de quien llama —el cuerpo es
 * JSON sin verificar—, así que conviene usarlo solo con formas que el contrato
 * documenta.
 */
export function errorDetail<T>(error: unknown, statusCode: number, field: string): T | null {
  if (!(error instanceof ApiError) || error.statusCode !== statusCode) return null

  const body = error.body
  if (typeof body !== "object" || body === null) return null

  const value = (body as Record<string, unknown>)[field]
  return value === undefined ? null : (value as T)
}
