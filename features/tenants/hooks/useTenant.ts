"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiErrorMessage } from "@/lib/errors"
import { ApiError } from "@/lib/api"
import { canManage, useSession } from "@/features/auth/hooks/useAuth"
import { hayPagoEsperando } from "../lib/subscription"
import {
  createSubscriptionCheckoutRequest,
  getBrandingRequest,
  getSettingsRequest,
  getSubscriptionRequest,
  getTenantRequest,
  updateBrandingRequest,
  updateSettingsRequest,
  updateTenantRequest,
} from "@/services/tenants"
import type { UpdateBrandingPayload, UpdateSettingsPayload } from "@/types"

export const TENANT_KEY = ["tenant"] as const
const BRANDING_KEY = [...TENANT_KEY, "marca"] as const
const SETTINGS_KEY = [...TENANT_KEY, "reservas"] as const
export const SUBSCRIPTION_KEY = [...TENANT_KEY, "suscripcion"] as const

/** Cada cuánto se repregunta mientras hay un cobro esperando confirmación. */
const CONFIRMANDO_MS = 6_000

export function useTenant() {
  return useQuery({ queryKey: TENANT_KEY, queryFn: getTenantRequest })
}

export function useBranding() {
  return useQuery({ queryKey: BRANDING_KEY, queryFn: getBrandingRequest })
}

export function useSettings() {
  return useQuery({ queryKey: SETTINGS_KEY, queryFn: getSettingsRequest })
}

/**
 * La cuenta que el negocio le paga a reservApp.
 *
 * **Solo pregunta si el rol puede verla.** `GET /tenants/me/subscription` pide
 * `OWNER` o `ADMINISTRATIVE` y a un `PROFESSIONAL` le contesta 403; sin el
 * `enabled`, cada profesional que abría el formulario de agendar disparaba cuatro
 * pedidos condenados —el original más los tres reintentos de React Query— cada
 * cinco minutos. No rompía nada visible, que es lo peor que puede tener un error.
 *
 * Y por si el rol llega tarde o cambia, **un 403 no se reintenta**: es una
 * respuesta definitiva, no una falla pasajera.
 */
export function useSubscription(options: { esperandoPago?: boolean } = {}) {
  const { data: session } = useSession()
  const esperando = options.esperandoPago ?? false

  return useQuery({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: getSubscriptionRequest,
    enabled: canManage(session?.employee.role),
    // Volviendo del checkout no se puede servir de caché: la respuesta guardada
    // es de antes de pagar, que es justo lo que se vino a ver cambiar.
    staleTime: esperando ? 0 : 5 * 60_000,
    refetchInterval: (query) =>
      esperando && query.state.data && hayPagoEsperando(query.state.data) ? CONFIRMANDO_MS : false,
    retry: (intentos, error) =>
      error instanceof ApiError && error.statusCode === 403 ? false : intentos < 3,
  })
}

/**
 * Pide el link para pagar el mes.
 *
 * **Sin toast de éxito**: no se pagó nada todavía. Igual que el cobro de un turno,
 * esto crea el pago pendiente y lo confirma el proveedor después. Lo que hay que
 * mostrar es el link y qué período cubre, y de eso se encarga la pantalla.
 */
export function useSubscriptionCheckout() {
  return useMutation({ mutationFn: createSubscriptionCheckoutRequest })
}

/**
 * Cada sección guarda por su cuenta e invalida solo su propia clave, así una
 * sección que falla no revierte lo que otra acaba de guardar.
 */
function useSectionMutation<TPayload, TResult>(
  key: readonly unknown[],
  mutationFn: (payload: TPayload) => Promise<TResult>,
  errorMessage: string,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key })
      toast.success("Cambios guardados")
    },
    onError: (error) => toast.error(apiErrorMessage(error, errorMessage)),
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTenantRequest,
    onSuccess: async () => {
      // El nombre del negocio también viaja en `GET /auth/me`, que alimenta el
      // sidebar: sin invalidar la sesión queda el nombre viejo hasta recargar.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: TENANT_KEY }),
        queryClient.invalidateQueries({ queryKey: ["session"] }),
      ])
      toast.success("Cambios guardados")
    },
    onError: (error) => toast.error(apiErrorMessage(error, "No pudimos guardar los datos del negocio")),
  })
}

export function useUpdateBranding() {
  return useSectionMutation<UpdateBrandingPayload, unknown>(
    BRANDING_KEY,
    updateBrandingRequest,
    "No pudimos guardar la marca",
  )
}

export function useUpdateSettings() {
  return useSectionMutation<UpdateSettingsPayload, unknown>(
    SETTINGS_KEY,
    updateSettingsRequest,
    "No pudimos guardar la política de reservas",
  )
}
