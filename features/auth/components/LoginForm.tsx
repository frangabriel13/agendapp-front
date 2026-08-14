"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import { useLogin } from "../hooks/useAuth"
import { validateEmail, validatePassword } from "../utils/validators"

const controlClasses = cn(
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-neutral-900",
  "placeholder:text-neutral-400 transition-colors",
  "focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40",
)

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const login = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    if (emailError || passwordError) {
      setErrors({ email: emailError ?? undefined, password: passwordError ?? undefined })
      return
    }
    setErrors({})
    login.mutate({ email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setErrors((p) => ({ ...p, email: undefined }))
          }}
          autoComplete="email"
          placeholder="hola@ejemplo.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={cn(controlClasses, errors.email ? "border-red-400" : "border-black/10")}
        />
        {errors.email && (
          <p id="email-error" className="mt-1.5 text-xs text-red-500">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label htmlFor="password" className="block text-[13px] font-medium text-neutral-700">
            Contraseña
          </label>
          <Link
            href="/olvide-contrasena"
            className="text-xs text-violet-600 transition-colors hover:text-violet-500"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrors((p) => ({ ...p, password: undefined }))
            }}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={cn(controlClasses, "pr-11", errors.password ? "border-red-400" : "border-black/10")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-400 transition-colors hover:text-neutral-700"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="mt-1.5 text-xs text-red-500">
            {errors.password}
          </p>
        )}
      </div>

      {login.isError && (
        // `role="alert"` para que un lector de pantalla anuncie el fallo: el
        // texto aparece sin que el foco se mueva, así que si no se avisa, pasa
        // desapercibido para quien no está mirando la pantalla.
        <div role="alert" className="space-y-1 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          {(login.error instanceof ApiError ? login.error.messages : ["Email o contraseña incorrectos"]).map(
            (message) => (
              <p key={message} className="text-[13px] text-red-600">
                {message}
              </p>
            ),
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={login.isPending}
        className="w-full rounded-full bg-neutral-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
      >
        {login.isPending ? "Ingresando..." : "Ingresar"}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-black/[0.08]" />
        <span className="text-[11px] text-neutral-400">o</span>
        <div className="h-px flex-1 bg-black/[0.08]" />
      </div>

      <button
        type="button"
        disabled
        title="Próximamente"
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border border-black/10 bg-neutral-50 py-2.5 text-sm font-medium text-neutral-400"
      >
        <svg width="16" height="16" viewBox="0 0 48 48" fill="none" aria-hidden>
          <path
            d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z"
            fill="#ccc"
          />
        </svg>
        Continuar con Google
        <span className="text-[11px]">(próximamente)</span>
      </button>

      <p className="text-center text-[13px] text-neutral-500">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-medium text-violet-600 transition-colors hover:text-violet-500">
          Registrate
        </Link>
      </p>
    </form>
  )
}
