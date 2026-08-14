import type { AuthTokens } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

const ACCESS_TOKEN_KEY = "accessToken"
const REFRESH_TOKEN_KEY = "refreshToken"

/** Cuerpo de error del backend (AllExceptionsFilter). `message` puede ser string o array. */
interface ApiErrorBody {
  statusCode: number
  message: string | string[]
  error: string
  requestId?: string
}

export class ApiError extends Error {
  readonly statusCode: number
  /** Los errores de validación traen un mensaje por campo. */
  readonly messages: string[]
  readonly requestId?: string

  constructor(statusCode: number, messages: string[], requestId?: string) {
    super(messages[0] ?? "Ocurrió un error inesperado")
    this.name = "ApiError"
    this.statusCode = statusCode
    this.messages = messages
    this.requestId = requestId
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * El evento `storage` solo avisa a las *otras* pestañas, así que los cambios de
 * la propia se notifican a mano. Permite leer el estado de sesión con
 * `useSyncExternalStore` en vez de duplicarlo en un `useState`.
 */
const listeners = new Set<() => void>()

export function subscribeToTokens(listener: () => void): () => void {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

export function hasStoredToken(): boolean {
  return getAccessToken() !== null
}

export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  listeners.forEach((listener) => listener())
}

export function clearTokens(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  listeners.forEach((listener) => listener())
}

function statusFallback(status: number): string {
  if (status === 401) return "Necesitás iniciar sesión"
  if (status === 403) return "No tenés permiso para hacer esto"
  if (status === 404) return "No encontramos lo que buscabas"
  if (status === 429) return "Demasiados intentos. Esperá un momento"
  return "Ocurrió un error inesperado"
}

function toApiError(status: number, body: unknown): ApiError {
  const parsed = body as Partial<ApiErrorBody> | null
  const raw = parsed?.message
  const messages = Array.isArray(raw)
    ? raw
    : typeof raw === "string" && raw.length > 0
      ? [raw]
      : [statusFallback(status)]
  return new ApiError(parsed?.statusCode ?? status, messages, parsed?.requestId)
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => null)
  if (!res.ok) throw toApiError(res.status, body)
  return body as T
}

/** Sin esto, un backend colgado deja la promesa sin resolver y el spinner girando para siempre. */
const REQUEST_TIMEOUT_MS = 15_000

async function send(
  path: string,
  init: RequestInit,
  token: string | null,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const headers = new Headers(init.headers)
  if (init.body !== undefined) headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const timeout = AbortSignal.timeout(timeoutMs)
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout

  try {
    return await fetch(`${API_URL}${path}`, { ...init, headers, signal })
  } catch (error) {
    if (timeout.aborted) throw new ApiError(0, ["El servidor tardó demasiado en responder"])
    // Cancelación del llamador (React Query al desmontar): se propaga tal cual
    // para que la distinga de un fallo.
    if (init.signal?.aborted) throw error
    throw new ApiError(0, ["No pudimos conectarnos con el servidor"])
  }
}

/**
 * El backend rota el refresh token en cada uso y trata la reutilización de uno
 * viejo como robo de credenciales: revoca la sesión entera. Si dos requests se
 * topan con un 401 a la vez y cada una refresca por su cuenta, la segunda
 * desloguea al usuario.
 *
 * Esto lo evita en dos niveles:
 *
 * 1. `refreshInFlight` agrupa los pedidos de **esta** pestaña en una sola llamada
 * 2. `REFRESH_LOCK` serializa las **distintas pestañas**, que no comparten memoria
 *    pero sí el `localStorage` donde vive el refresh token
 */
const REFRESH_LOCK = "reservapp-auth-refresh"

let refreshInFlight: Promise<string> | null = null

async function runRefresh(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new ApiError(401, ["No hay sesión activa"])

  const res = await send("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) }, null)
  const tokens = await parse<AuthTokens>(res)
  storeTokens(tokens)
  return tokens.accessToken
}

/**
 * Toma el lock entre pestañas y recién ahí decide si hace falta refrescar.
 *
 * **El chequeo de adentro es lo que evita el segundo refresh**, no el lock solo:
 * mientras esta pestaña esperaba su turno, la otra pudo haber rotado el token y
 * dejado uno nuevo en `localStorage`. Si el guardado ya no es el que falló, se
 * usa ese; refrescar de nuevo presentaría un refresh token quemado y el backend
 * revocaría la familia entera.
 *
 * `navigator.locks` no existe fuera de un contexto seguro —servir el front por
 * http en una IP de la red local, por ejemplo—, así que ahí se sigue sin lock:
 * queda la protección por pestaña, que es lo que había antes.
 */
async function refreshWithLock(staleToken: string | null): Promise<string> {
  const claim = async (): Promise<string> => {
    const current = getAccessToken()
    if (current !== null && current !== staleToken) return current
    return runRefresh()
  }

  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined
  return locks ? locks.request(REFRESH_LOCK, claim) : claim()
}

function refreshAccessToken(staleToken: string | null): Promise<string> {
  refreshInFlight ??= refreshWithLock(staleToken).finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; timeoutMs?: number } = {},
): Promise<T> {
  const auth = options.auth ?? true
  const tokenUsed = auth ? getAccessToken() : null
  const res = await send(path, init, tokenUsed, options.timeoutMs)

  if (res.status !== 401 || !auth) return parse<T>(res)

  let accessToken: string
  try {
    // `refreshInFlight` solo agrupa los 401 que caen mientras el refresh está en
    // vuelo. Los que llegan justo después arrancarían uno nuevo, cuando ya hay
    // token fresco: si el guardado no es el que falló, alcanza con reintentar.
    const stored = getAccessToken()
    accessToken = stored && stored !== tokenUsed ? stored : await refreshAccessToken(tokenUsed)
  } catch {
    clearTokens()
    throw new ApiError(401, ["Tu sesión expiró. Ingresá de nuevo."])
  }

  // Un 401 con un token recién emitido significa que la sesión ya no vale
  // (revocada desde otra pestaña, empleado desactivado). Sin limpiar acá,
  // hasStoredToken() sigue en true y la app queda creyendo que hay sesión.
  const retry = await send(path, init, accessToken, options.timeoutMs)
  if (retry.status === 401) {
    clearTokens()
    throw new ApiError(401, ["Tu sesión expiró. Ingresá de nuevo."])
  }

  return parse<T>(retry)
}
