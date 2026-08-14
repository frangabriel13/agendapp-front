"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiErrorMessage } from "@/lib/errors"
import {
  getBrandingRequest,
  getSettingsRequest,
  getTenantRequest,
  updateBrandingRequest,
  updateSettingsRequest,
  updateTenantRequest,
} from "@/services/tenants"
import type { UpdateBrandingPayload, UpdateSettingsPayload } from "@/types"

export const TENANT_KEY = ["tenant"] as const
const BRANDING_KEY = [...TENANT_KEY, "marca"] as const
const SETTINGS_KEY = [...TENANT_KEY, "reservas"] as const

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
