"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { ApiError } from "@/lib/api"
import { useLogin } from "../hooks/useAuth"
import { validateEmail, validatePassword } from "../utils/validators"

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
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })) }}
          autoComplete="email"
          className={`w-full px-3 py-2 rounded-md border bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors ${
            errors.email ? "border-red-400" : "border-gray-300"
          }`}
          placeholder="hola@ejemplo.com"
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <Link href="/olvide-contrasena" className="text-xs text-violet-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })) }}
            autoComplete="current-password"
            className={`w-full px-3 py-2 pr-10 rounded-md border bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors ${
              errors.password ? "border-red-400" : "border-gray-300"
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
      </div>

      {login.isError && (
        <div className="text-sm text-red-500 space-y-1">
          {(login.error instanceof ApiError
            ? login.error.messages
            : ["Email o contraseña incorrectos"]
          ).map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={login.isPending}
        className="w-full py-2.5 px-4 bg-violet-600 text-white rounded-md font-semibold hover:bg-violet-500 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {login.isPending ? "Ingresando..." : "Ingresar"}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">o</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Google button */}
      <button
        type="button"
        disabled
        className="w-full py-2.5 px-4 border border-gray-300 rounded-md font-medium text-sm text-gray-400 flex items-center justify-center gap-2 cursor-not-allowed bg-gray-50"
        title="Próximamente"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
          <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z" fill="#ccc"/>
        </svg>
        Continuar con Google <span className="text-xs">(próximamente)</span>
      </button>

      {/* Crear cuenta */}
      <p className="text-center text-sm text-gray-500">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="text-violet-600 font-medium hover:underline">
          Registrate
        </Link>
      </p>
    </form>
  )
}
