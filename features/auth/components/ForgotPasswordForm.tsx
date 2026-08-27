"use client"

import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { MailCheck } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { control } from "@/components/form"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { forgotPasswordRequest } from "@/services/auth"
import { validateEmail } from "../utils/validators"
import { ResultCard } from "@/components/ResultCard"

/**
 * La regla del email no se reescribe acá: se reusa `validateEmail`, la misma que
 * usa el login. Un `.email()` de zod al lado sería una segunda definición con
 * otro texto de error.
 */
const schema = z.object({
  email: z.string().superRefine((value, ctx) => {
    const error = validateEmail(value)
    if (error) ctx.addIssue({ code: "custom", message: error })
  }),
})

type Values = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } })

  const pedir = useMutation({ mutationFn: forgotPasswordRequest })

  // El backend contesta 204 exista la cuenta o no, así que esta pantalla es la
  // misma para las dos. **No es un mensaje vago por comodidad**: decir "ese email
  // no está registrado" dejaría averiguar qué direcciones tienen cuenta probando
  // una por una, sin credenciales. Por eso el texto arranca con "si".
  if (pedir.isSuccess) {
    return (
      <ResultCard
        icon={MailCheck}
        title="Revisá tu correo"
        description={
          <>
            <p>
              Si <span className="font-medium text-neutral-700">{getValues("email")}</span> tiene una
              cuenta, te mandamos un link para elegir una contraseña nueva.
            </p>
            <p className="mt-3 text-xs text-neutral-400">
              Puede tardar un par de minutos. Si no aparece, mirá en correo no deseado.
            </p>
          </>
        }
      >
        <Link href="/login" className={cn(cta({ block: true }), "mt-6")}>
          Volver al login
        </Link>
        <button
          type="button"
          onClick={() => pedir.reset()}
          className="mt-4 text-[13px] font-medium text-violet-600 transition-colors hover:text-violet-500"
        >
          Probar con otro email
        </button>
      </ResultCard>
    )
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
          Recuperar contraseña
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">
          Poné tu email y te mandamos un link para crear una contraseña nueva.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((values) => pedir.mutate(values.email))}
        noValidate
        className="space-y-4"
      >
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="hola@ejemplo.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={control(errors.email)}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-xs text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        {pedir.isError && (
          // Lo único que puede fallar acá es el transporte o el límite de
          // intentos: la respuesta no distingue si la cuenta existe.
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
            <p className="text-[13px] text-red-600">
              {apiErrorMessage(pedir.error, "No pudimos enviar el mail. Probá de nuevo en un rato.")}
            </p>
          </div>
        )}

        <button type="submit" disabled={pedir.isPending} className={cta({ block: true })}>
          {pedir.isPending ? "Enviando…" : "Enviarme el link"}
        </button>
      </form>
    </div>
  )
}
