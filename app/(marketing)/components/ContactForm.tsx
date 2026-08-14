"use client"

import { useId, useState } from "react"
import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type Values = { name: string; email: string; message: string }
type Errors = Partial<Record<keyof Values, string>>

const controlClasses = cn(
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-neutral-900",
  "placeholder:text-neutral-400 transition-colors",
  "focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500",
)

export function ContactForm() {
  const formId = useId()
  const [form, setForm] = useState<Values>({ name: "", email: "", message: "" })
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function validate(): Errors {
    const e: Errors = {}
    if (!form.name.trim()) e.name = "El nombre es requerido"
    if (!form.email.trim()) e.email = "El email es requerido"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "El email no es válido"
    if (!form.message.trim()) e.message = "El mensaje es requerido"
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSending(true)
    // Pendiente: enviar `form` al backend cuando exista el endpoint de contacto
    await new Promise((r) => setTimeout(r, 600))
    setSending(false)
    setSent(true)
  }

  /** Ata label, control y mensaje de error por id, y limpia el error al tipear. */
  function bind(key: keyof Values) {
    const id = `${formId}-${key}`
    const error = errors[key]
    return {
      id,
      error,
      errorId: `${id}-error`,
      control: {
        id,
        value: form[key],
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? `${id}-error` : undefined,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          setForm((p) => ({ ...p, [key]: e.target.value }))
          setErrors((p) => ({ ...p, [key]: undefined }))
        },
        className: cn(controlClasses, error ? "border-red-400" : "border-black/10"),
      },
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle size={40} className="mb-3 text-violet-600" />
        <p className="text-lg font-semibold text-neutral-900">¡Mensaje enviado!</p>
        <p className="mt-1 text-sm text-neutral-500">Te respondemos en menos de 24hs.</p>
      </div>
    )
  }

  const name = bind("name")
  const email = bind("email")
  const message = bind("message")

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id={name.id} label="Nombre" error={name.error} errorId={name.errorId}>
        <input type="text" placeholder="Tu nombre" autoComplete="name" {...name.control} />
      </Field>

      <Field id={email.id} label="Email" error={email.error} errorId={email.errorId}>
        <input type="email" placeholder="hola@ejemplo.com" autoComplete="email" {...email.control} />
      </Field>

      <Field id={message.id} label="Mensaje" error={message.error} errorId={message.errorId}>
        <textarea
          rows={4}
          placeholder="Contanos sobre tu estética..."
          {...message.control}
          className={cn(message.control.className, "resize-none")}
        />
      </Field>

      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-full bg-neutral-900 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
      >
        {sending ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  )
}

function Field({
  id,
  label,
  error,
  errorId,
  children,
}: {
  id: string
  label: string
  error?: string
  errorId: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
