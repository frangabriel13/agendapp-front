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
import { AuthResult } from "@/features/auth/components/AuthResult"
import { PasswordPair } from "@/features/auth/components/PasswordPair"
import { newPasswordSchema, type NewPasswordValues } from "@/features/auth/utils/validators"
import { apiErrorMessage } from "@/lib/errors"
import { activateAccountRequest } from "@/services/employees"

export function ActivateAccountForm() {
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

  const activate = useMutation({
    mutationFn: (password: string) => activateAccountRequest({ token: token ?? "", password }),
    onSuccess: () => {
      toast.success("Cuenta activada. Ya podés ingresar.")
      router.replace("/login")
    },
  })

  // Sin token no hay nada que activar: el link llegó cortado o mal copiado.
  if (!token) {
    return (
      <AuthResult
        icon={LinkIcon}
        tone="amber"
        title="Link incompleto"
        description="Este link de activación no trae el código. Copialo de nuevo completo, o pedile a quien te invitó que te reenvíe la invitación."
      >
        <Link href="/login" className={cn(cta({ variant: "outline", block: true }), "mt-6")}>
          Ir al login
        </Link>
      </AuthResult>
    )
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900">Activá tu cuenta</h1>
        <p className="mt-1.5 text-[13px] text-neutral-500">Elegí una contraseña para entrar a tu panel.</p>
      </div>

      <form onSubmit={handleSubmit((values) => activate.mutate(values.password))} noValidate className="space-y-4">
        <PasswordPair register={register} errors={errors} />

        {activate.isError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
            <p className="text-[13px] text-red-600">
              {apiErrorMessage(activate.error, "No pudimos activar la cuenta. El link puede haber vencido.")}
            </p>
          </div>
        )}

        <button type="submit" disabled={activate.isPending} className={cta({ block: true })}>
          {activate.isPending ? "Activando…" : "Activar cuenta"}
        </button>
      </form>
    </div>
  )
}
