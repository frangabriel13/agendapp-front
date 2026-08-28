import { apiFetch, getRefreshToken } from "@/lib/api"
import { setBusinessTimezone } from "@/lib/time"
import { setBusinessCurrency } from "@/features/catalog/lib/money"
import type { AuthTokens, LoginCredentials, RegisterPayload, Session } from "@/types"

export function loginRequest(credentials: LoginCredentials): Promise<AuthTokens> {
  return apiFetch<AuthTokens>(
    "/auth/login",
    { method: "POST", body: JSON.stringify(credentials) },
    { auth: false },
  )
}

/** Registra al dueño y crea el negocio en una sola llamada. */
export function registerRequest(payload: RegisterPayload): Promise<AuthTokens> {
  return apiFetch<AuthTokens>(
    "/auth/register",
    { method: "POST", body: JSON.stringify(payload) },
    { auth: false },
  )
}

/**
 * Quién sos, en qué negocio y con qué rol.
 *
 * **Acá se fijan la zona horaria y la moneda del negocio**, y no en un efecto de
 * React: la conversión de instantes a horas de pared ocurre dentro de `queryFn`s
 * (`toAppointment`) y el formateo de plata dentro de funciones puras, las dos
 * fuera de todo componente. Poniéndolas al traer la sesión, cualquiera que vea
 * `session` ya las tiene fijadas; hacerlo en un `useEffect` dejaría el primer
 * render dibujando con la zona y la moneda equivocadas.
 */
export function getSessionRequest(): Promise<Session> {
  return apiFetch<Session>("/auth/me").then((session) => {
    setBusinessTimezone(session.tenant.timezone)
    setBusinessCurrency(session.tenant.currency)
    return session
  })
}

/**
 * Revoca el refresh token en el servidor. Es público: alcanza con el refresh
 * token, así se puede cerrar sesión aunque el access token ya haya vencido.
 */
export async function logoutRequest(): Promise<void> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return
  await apiFetch<void>(
    "/auth/logout",
    { method: "POST", body: JSON.stringify({ refreshToken }) },
    { auth: false },
  ).catch(() => undefined)
}

export function changePasswordRequest(input: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  return apiFetch<void>("/auth/password", { method: "PATCH", body: JSON.stringify(input) })
}

/**
 * Pide por mail el link para elegir una contraseña nueva.
 *
 * **Devuelve 204 exista la cuenta o no**, y eso manda sobre la pantalla: si
 * contestara distinto en cada caso, cualquiera podría averiguar qué direcciones
 * tienen cuenta sin necesidad de credenciales. La UI **no puede** decir "ese
 * email no está registrado" — el único mensaje honesto empieza con "si".
 *
 * Pedirlo de nuevo invalida el link anterior: vale el del mail más nuevo.
 */
export function forgotPasswordRequest(email: string): Promise<void> {
  return apiFetch<void>(
    "/auth/forgot-password",
    { method: "POST", body: JSON.stringify({ email }) },
    { auth: false },
  )
}

/**
 * Define la contraseña nueva con el token del mail.
 *
 * El token vale **una sola vez**: reintentar con el mismo da 400. Y el reset
 * **cierra todas las sesiones abiertas** —a propósito: si alguien más había
 * entrado, dejarle la sesión viva volvería inútil el cambio—, así que el refresh
 * token guardado deja de servir y hay que ir al login, no refrescar.
 */
export function resetPasswordRequest(input: { token: string; password: string }): Promise<void> {
  return apiFetch<void>(
    "/auth/reset-password",
    { method: "POST", body: JSON.stringify(input) },
    { auth: false },
  )
}

/**
 * Confirma la dirección de mail con el token del link.
 *
 * También es de un solo uso, así que la pantalla que lo llama tiene que hacerlo
 * **exactamente una vez**: dos llamadas seguidas dejan la segunda en 400 con la
 * cuenta ya confirmada, que se lee como un fallo y no lo es.
 */
export function verifyEmailRequest(token: string): Promise<void> {
  return apiFetch<void>(
    "/auth/verify-email",
    { method: "POST", body: JSON.stringify({ token }) },
    { auth: false },
  )
}
