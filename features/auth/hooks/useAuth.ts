"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useCallback, useSyncExternalStore } from "react"
import { clearTokens, hasStoredToken, storeTokens, subscribeToTokens } from "@/lib/api"
import {
  getSessionRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  resendVerificationRequest,
} from "@/services/auth"
import { ApiError } from "@/lib/api"
import type { EmployeeRole, LoginCredentials, RegisterPayload } from "@/types"

export const SESSION_KEY = ["session"] as const

/**
 * El login solo devuelve tokens: los datos del usuario salen de GET /auth/me.
 * Por eso no se guarda nada del usuario en localStorage — se pide y se cachea
 * en React Query, y así no queda una copia que se desactualiza sola.
 */
export function useHasToken(): boolean {
  return useSyncExternalStore(subscribeToTokens, hasStoredToken, () => false)
}

export function useSession() {
  const hasToken = useHasToken()

  return useQuery({
    queryKey: SESSION_KEY,
    queryFn: getSessionRequest,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => loginRequest(credentials),
    onSuccess: async (tokens) => {
      storeTokens(tokens)
      await queryClient.invalidateQueries({ queryKey: SESSION_KEY })
      router.push("/dashboard")
    },
  })
}

export function useRegister() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
    onSuccess: async (tokens) => {
      storeTokens(tokens)
      await queryClient.invalidateQueries({ queryKey: SESSION_KEY })
      router.push("/dashboard")
    },
  })
}

/**
 * Vuelve a mandar el mail de confirmación.
 *
 * **El 409 se trata como éxito, no como error.** Significa que la cuenta ya
 * estaba confirmada —se confirmó en otra pestaña mientras esta miraba una sesión
 * vieja—, así que refrescar la sesión hace desaparecer el aviso solo. Mostrar
 * "error" ahí sería avisar de un problema que no existe y que además ya se
 * resolvió.
 */
export function useResendVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resendVerificationRequest,
    onSettled: (_datos, error) => {
      const yaEstaba = error instanceof ApiError && error.statusCode === 409
      if (!error || yaEstaba) {
        void queryClient.invalidateQueries({ queryKey: SESSION_KEY })
      }
    },
  })
}

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useCallback(async () => {
    await logoutRequest()
    clearTokens()
    queryClient.clear()
    router.replace("/login")
  }, [queryClient, router])
}

/** OWNER y ADMINISTRATIVE pueden escribir; PROFESSIONAL solo lee. */
export function canManage(role: EmployeeRole | undefined): boolean {
  return role === "OWNER" || role === "ADMINISTRATIVE"
}
