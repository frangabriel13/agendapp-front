"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { cta } from "@/components/CtaLink"
import { ApiError } from "@/lib/api"
import { useRegister } from "../hooks/useAuth"
import { validateEmail, validateNewPassword, validateNombre } from "../utils/validators"

const controlClasses = cn(
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-neutral-900",
  "placeholder:text-neutral-400 transition-colors",
  "focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40",
)

interface Errores {
  firstName?: string
  lastName?: string
  businessName?: string
  email?: string
  password?: string
}

/**
 * Alta de un negocio nuevo.
 *
 * **Es una sola llamada y deja adentro.** `POST /auth/register` crea la persona y
 * el negocio juntos y devuelve los tokens, así que no hay pantalla intermedia: se
 * completa y se cae en el panel, con catorce días de prueba corriendo.
 *
 * **Los nombres se validan acá aunque el backend también los valide**, y no por
 * ahorrar un viaje: sus mensajes de largo mínimo vienen en inglés
 * ("firstName must be longer than or equal to 2 characters"). Lo que sí se deja
 * pasar al backend es el email repetido, que contesta 409 con un mensaje escrito
 * y mostrable — y ahí lo que importa no es el cartel sino la salida: quien ya
 * tiene cuenta necesita el link para entrar, no que le digan que se equivocó.
 */
export function RegisterForm() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errores>({})
  const registro = useRegister()

  const limpiar = (campo: keyof Errores) => setErrors((previos) => ({ ...previos, [campo]: undefined }))

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const encontrados: Errores = {
      firstName: validateNombre(firstName, "El nombre") ?? undefined,
      lastName: validateNombre(lastName, "El apellido") ?? undefined,
      businessName: validateNombre(businessName, "El nombre del negocio") ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validateNewPassword(password) ?? undefined,
    }

    if (Object.values(encontrados).some(Boolean)) {
      setErrors(encontrados)
      return
    }

    setErrors({})
    registro.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      businessName: businessName.trim(),
      email: email.trim(),
      password,
      // El teléfono es opcional de verdad: mandarlo vacío sería guardar una
      // cadena vacía como si fuera un dato.
      ...(phone.trim() ? { phone: phone.trim() } : {}),
    })
  }

  const yaExiste = registro.error instanceof ApiError && registro.error.statusCode === 409

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Campo
          id="firstName"
          label="Nombre"
          value={firstName}
          onChange={(valor) => {
            setFirstName(valor)
            limpiar("firstName")
          }}
          autoComplete="given-name"
          placeholder="Ana"
          error={errors.firstName}
        />
        <Campo
          id="lastName"
          label="Apellido"
          value={lastName}
          onChange={(valor) => {
            setLastName(valor)
            limpiar("lastName")
          }}
          autoComplete="family-name"
          placeholder="Gómez"
          error={errors.lastName}
        />
      </div>

      <Campo
        id="businessName"
        label="Nombre del negocio"
        value={businessName}
        onChange={(valor) => {
          setBusinessName(valor)
          limpiar("businessName")
        }}
        autoComplete="organization"
        placeholder="Peluquería Ana"
        error={errors.businessName}
        // Es el nombre que van a ver los clientes y del que sale la dirección web
        // del negocio; decirlo acá evita el "Mi peluquería" puesto de apuro.
        hint="Como lo conocen tus clientes."
      />

      <Campo
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(valor) => {
          setEmail(valor)
          limpiar("email")
        }}
        autoComplete="email"
        placeholder="hola@ejemplo.com"
        error={errors.email}
      />

      <Campo
        id="phone"
        label="Teléfono"
        type="tel"
        value={phone}
        onChange={setPhone}
        autoComplete="tel"
        placeholder="11 5555-5555"
        opcional
      />

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              limpiar("password")
            }}
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : "password-hint"}
            className={cn(
              controlClasses,
              "pr-11",
              errors.password ? "border-red-400" : "border-black/10",
            )}
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
        {errors.password ? (
          <p id="password-error" className="mt-1.5 text-xs text-red-500">
            {errors.password}
          </p>
        ) : (
          // La regla se dice antes de escribir, no después de rebotar.
          <p id="password-hint" className="mt-1.5 text-xs text-neutral-400">
            Al menos 8 caracteres, con una letra y un número.
          </p>
        )}
      </div>

      {registro.isError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          {(registro.error instanceof ApiError
            ? registro.error.messages
            : ["No pudimos crear la cuenta. Probá de nuevo en un momento."]
          ).map((mensaje) => (
            <p key={mensaje} className="text-[13px] text-red-600">
              {mensaje}
            </p>
          ))}
          {yaExiste && (
            <Link
              href="/login"
              className="mt-1.5 inline-block text-[13px] font-medium text-violet-600 underline underline-offset-2 hover:text-violet-500"
            >
              Ingresá con esa cuenta
            </Link>
          )}
        </div>
      )}

      <button type="submit" disabled={registro.isPending} className={cta({ block: true })}>
        {registro.isPending ? "Creando tu cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-xs text-neutral-400">
        Empezás con 14 días de prueba. No pedimos tarjeta.
      </p>

      <p className="text-center text-[13px] text-neutral-500">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-violet-600 transition-colors hover:text-violet-500"
        >
          Ingresá
        </Link>
      </p>
    </form>
  )
}

/**
 * Un campo de texto con su etiqueta, su error y su ayuda.
 *
 * Existe porque este formulario tiene cinco iguales: repetir el bloque cinco
 * veces es donde se cuelan el `htmlFor` que no coincide o el `aria-describedby`
 * que apunta a un id que no existe.
 */
function Campo({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  error,
  hint,
  opcional,
}: {
  id: string
  label: string
  value: string
  onChange: (valor: string) => void
  type?: string
  autoComplete?: string
  placeholder?: string
  error?: string
  hint?: string
  opcional?: boolean
}) {
  const ayuda = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-neutral-700">
        {label}
        {opcional && <span className="ml-1.5 font-normal text-neutral-400">(opcional)</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={ayuda}
        className={cn(controlClasses, error ? "border-red-400" : "border-black/10")}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-neutral-400">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
