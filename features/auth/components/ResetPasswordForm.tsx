"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LinkIcon } from "lucide-react"
import { toast } from "sonner"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { clearTokens } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { resetPasswordRequest } from "@/services/auth"
import { newPasswordSchema, type NewPasswordValues } from "../utils/validators"
import { AuthResult } from "./AuthResult"
import { PasswordPair } from "./PasswordPair"

export function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get("token")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  })

  const restablecer = useMutation({
    mutationFn: (password: string) => resetPasswordRequest({ token: token ?? "", password }),
    onSuccess: () => {
      // El backend cierra **todas** las sesiones al restablecer, así que el par
      // de tokens guardado acá ya no sirve. Borrarlos es lo que evita que la
      // próxima pantalla intente refrescar con un refresh token muerto y termine
      // en un error raro en vez de en el login.
      clearTokens()
      toast.success("Listo. Entrá con tu contraseña nueva.")
      // `replace` y no `push`: el token es de un solo uso, y volver atrás a esta
      // pantalla solo lleva a un 400.
      router.replace("/login")
    },
  })

  if (!token) {
    return (
      <AuthResult
        icon={LinkIcon}
        tone="amber"
        title="Link incompleto"
        description="Este link para restablecer la contraseña no trae el código. Copialo de nuevo completo desde el mail, o pedí uno nuevo."
      >
        <Link href="/olvide-contrasena" className={cn(cta({ block: true }), "mt-6")}>
          Pedir un link nuevo
        </Link>
        <Link
          href="/login"
          className="mt-4 inline-block text-[13px] font-medium text-violet-600 transition-colors hover:text-violet-500"
        >
          Volver al login
        </Link>
      </AuthResult>
    )
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900">Elegí tu contraseña</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">
          Va a cerrar las sesiones que tengas abiertas en otros dispositivos.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((values) => restablecer.mutate(values.password))}
        noValidate
        className="space-y-4"
      >
        <PasswordPair register={register} errors={errors} label="Contraseña nueva" />

        {restablecer.isError && (
          // El 400 de un link vencido o ya usado viene con el texto ya escrito en
          // castellano desde el backend: se muestra tal cual en vez de inventar
          // uno que diría menos.
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
            <p className="text-[13px] text-red-600">
              {apiErrorMessage(
                restablecer.error,
                "No pudimos cambiar la contraseña. El link puede haber vencido.",
              )}
            </p>
            <Link
              href="/olvide-contrasena"
              className="mt-1.5 inline-block text-[13px] font-medium text-red-700 underline underline-offset-2"
            >
              Pedir un link nuevo
            </Link>
          </div>
        )}

        <button type="submit" disabled={restablecer.isPending} className={cta({ block: true })}>
          {restablecer.isPending ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </div>
  )
}
