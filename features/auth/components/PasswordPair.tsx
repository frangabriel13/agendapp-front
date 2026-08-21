"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import type { FieldErrors, UseFormRegister } from "react-hook-form"
import { control } from "@/components/form"
import { cn } from "@/lib/utils"
import type { NewPasswordValues } from "../utils/validators"

interface Props {
  register: UseFormRegister<NewPasswordValues>
  errors: FieldErrors<NewPasswordValues>
  /** Texto del label de arriba. "Contraseña" no sirve para las dos pantallas. */
  label?: string
}

/**
 * El par contraseña + repetir, con el ojo para mostrarla.
 *
 * Lo comparten activar una cuenta y restablecer la propia. **El ojo controla los
 * dos campos a la vez**: mostrar uno y ocultar el otro obliga a escribir a ciegas
 * justo donde se está verificando lo que se escribió.
 *
 * No es genérico a propósito: las dos pantallas usan exactamente
 * `{ password, confirm }`, así que tipar contra esa forma evita los genéricos de
 * react-hook-form sin perder nada.
 */
export function PasswordPair({ register, errors, label = "Contraseña" }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          {label}
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
    </>
  )
}
