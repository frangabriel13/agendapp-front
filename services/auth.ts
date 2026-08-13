import { apiFetch, getRefreshToken } from "@/lib/api"
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

export function getSessionRequest(): Promise<Session> {
  return apiFetch<Session>("/auth/me")
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
