import type { RefundType } from "@/types"

/**
 * Zonas horarias del mercado objetivo. No es la lista completa de IANA: se
 * ofrecen las usables y, si el negocio ya tiene otra, se agrega al vuelo con
 * `withCurrent` para no pisarla con un valor de la lista.
 */
export const TIMEZONES = [
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Cordoba",
  "America/Argentina/Mendoza",
  "America/Argentina/Salta",
  "America/Montevideo",
  "America/Santiago",
  "America/Asuncion",
  "America/La_Paz",
  "America/Lima",
  "America/Bogota",
  "America/Mexico_City",
  "America/Sao_Paulo",
]

export const CURRENCIES = [
  { value: "ARS", label: "ARS — Peso argentino" },
  { value: "USD", label: "USD — Dólar" },
  { value: "UYU", label: "UYU — Peso uruguayo" },
  { value: "CLP", label: "CLP — Peso chileno" },
  { value: "PYG", label: "PYG — Guaraní" },
  { value: "BOB", label: "BOB — Boliviano" },
  { value: "PEN", label: "PEN — Sol" },
  { value: "COP", label: "COP — Peso colombiano" },
  { value: "MXN", label: "MXN — Peso mexicano" },
  { value: "BRL", label: "BRL — Real" },
]

export const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
]

export const REFUND_TYPES: { value: RefundType; label: string; hint: string }[] = [
  { value: "FULL", label: "Reintegro total", hint: "Se devuelve todo lo pagado." },
  { value: "PARTIAL", label: "Reintegro parcial", hint: "Se devuelve el porcentaje que definas." },
  { value: "CREDIT", label: "Crédito a favor", hint: "Queda saldo para usar en otro turno." },
  { value: "NONE", label: "Sin reintegro", hint: "No se devuelve nada." },
]

export const SUBSCRIPTION_LABELS: Record<string, string> = {
  TRIAL: "Prueba gratuita",
  ACTIVE: "Activa",
  PAST_DUE: "Pago pendiente",
  CANCELED: "Cancelada",
  PAUSED: "Pausada",
}

/** Suma el valor actual a la lista si no estaba, para no ofrecer cambiarlo a ciegas. */
export function withCurrent(options: string[], current: string): string[] {
  return options.includes(current) ? options : [current, ...options]
}
