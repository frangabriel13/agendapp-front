"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { LinkIcon, Loader2, MailCheck, MailWarning } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { verifyEmailRequest } from "@/services/auth"
import { SESSION_KEY, useHasToken } from "../hooks/useAuth"
import { AuthResult } from "./AuthResult"

/**
 * Confirma el email apenas se abre el link: acá no hay nada que el usuario deba
 * decidir, así que un botón "Confirmar" sería un paso de más.
 */
export function VerifyEmailCard() {
  const token = useSearchParams().get("token")
  const queryClient = useQueryClient()
  const hasToken = useHasToken()

  const verificar = useMutation({
    mutationFn: verifyEmailRequest,
    onSuccess: () => {
      // Si hay sesión abierta, `GET /auth/me` tiene cacheado el
      // `emailVerifiedAt: null` de antes. Sin esto, el panel sigue mostrando el
      // aviso de "confirmá tu email" hasta que la caché venza sola.
      void queryClient.invalidateQueries({ queryKey: SESSION_KEY })
    },
  })

  /**
   * **El token es de un solo uso, así que esto tiene que dispararse una sola
   * vez.** En desarrollo React monta dos veces con StrictMode: sin este candado,
   * la primera llamada confirma el email y la segunda recibe un 400 por token ya
   * usado, y la pantalla muestra un error después de haber funcionado. Un `ref`
   * y no un estado: cambiarlo no tiene que provocar otro render.
   */
  const disparado = useRef(false)
  const { mutate } = verificar

  useEffect(() => {
    if (disparado.current || !token) return
    disparado.current = true
    mutate(token)
  }, [token, mutate])

  const volver = hasToken
    ? { href: "/dashboard", label: "Ir al panel" }
    : { href: "/login", label: "Ir al login" }

  if (!token) {
    return (
      <AuthResult
        icon={LinkIcon}
        tone="amber"
        title="Link incompleto"
        description="Este link de confirmación no trae el código. Copialo de nuevo completo desde el mail que te mandamos."
      >
        <Link href={volver.href} className={cn(cta({ variant: "outline", block: true }), "mt-6")}>
          {volver.label}
        </Link>
      </AuthResult>
    )
  }

  if (verificar.isSuccess) {
    return (
      <AuthResult
        icon={MailCheck}
        tone="emerald"
        title="Email confirmado"
        description="Listo, tu dirección quedó verificada."
      >
        <Link href={volver.href} className={cn(cta({ block: true }), "mt-6")}>
          {volver.label}
        </Link>
      </AuthResult>
    )
  }

  if (verificar.isError) {
    return (
      <AuthResult
        icon={MailWarning}
        tone="amber"
        title="No pudimos confirmar el email"
        // El 400 viene con el motivo ya escrito en castellano desde el backend
        // —vencido, ya usado, inexistente—: decirlo tal cual es más útil que un
        // texto propio que tendría que cubrir los tres casos a la vez.
        description={apiErrorMessage(
          verificar.error,
          "El link puede haber vencido o ya haberse usado.",
        )}
      >
        <p className="mt-3 text-xs leading-relaxed text-neutral-400">
          Si ya lo habías confirmado, no hace falta hacer nada más.
        </p>
        <Link href={volver.href} className={cn(cta({ block: true }), "mt-6")}>
          {volver.label}
        </Link>
      </AuthResult>
    )
  }

  return (
    <AuthResult
      icon={Loader2}
      title="Confirmando tu email"
      description="Un segundo."
      spin
    />
  )
}
