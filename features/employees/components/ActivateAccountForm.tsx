"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, LinkIcon } from "lucide-react"
import { toast } from "sonner"
import { cta } from "@/components/CtaLink"
import { control } from "@/components/form"
import { cn } from "@/lib/utils"
import { validateNewPassword } from "@/features/auth/utils/validators"
import { apiErrorMessage } from "@/lib/errors"
import { activateAccountRequest } from "@/services/employees"

/**
 * La regla de la contraseña no se reescribe acá: se reusa `validateNewPassword`,
 * que ya espeja la del backend. Duplicarla en un `.regex()` sería una segunda
 * definición que se desincroniza en silencio.
 */
const schema = z
  .object({
    password: z.string().superRefine((value, ctx) => {
      const error = validateNewPassword(value)
      if (error) ctx.addIssue({ code: "custom", message: error })
    }),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  })

type Values = z.infer<typeof schema>

export function ActivateAccountForm() {
  const router = useRouter()
  const token = useSearchParams().get("token")
  const [visible, setVisible] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
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
      <div className="text-center">
        <div
          aria-hidden
          className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-amber-100 bg-amber-50"
        >
          <LinkIcon size={20} className="text-amber-600" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900">Link incompleto</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Este link de activación no trae el código. Copialo de nuevo completo, o pedile a quien te invitó que te
          reenvíe la invitación.
        </p>
        <Link href="/login" className={cn(cta({ variant: "outline", block: true }), "mt-6")}>
          Ir al login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900">Activá tu cuenta</h1>
        <p className="mt-1.5 text-[13px] text-neutral-500">Elegí una contraseña para entrar a tu panel.</p>
      </div>

      <form onSubmit={handleSubmit((values) => activate.mutate(values.password))} noValidate className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : "password-hint"}
              className={cn(control(errors.password), "pr-11")}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={visible}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg p-2 text-neutral-400 transition-colors hover:text-neutral-700"
            >
              {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password ? (
            <p id="password-error" className="mt-1.5 text-xs text-red-500">
              {errors.password.message}
            </p>
          ) : (
            <p id="password-hint" className="mt-1.5 text-xs text-neutral-400">
              Al menos 8 caracteres, con una letra y un número.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Repetí la contraseña
          </label>
          <input
            id="confirm"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirm)}
            aria-describedby={errors.confirm ? "confirm-error" : undefined}
            className={control(errors.confirm)}
            {...register("confirm")}
          />
          {errors.confirm && (
            <p id="confirm-error" className="mt-1.5 text-xs text-red-500">
              {errors.confirm.message}
            </p>
          )}
        </div>

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
