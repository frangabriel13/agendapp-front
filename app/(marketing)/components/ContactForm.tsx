"use client"

import { useState } from "react"
import { CheckCircle } from "lucide-react"

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function validate() {
    const e: Partial<typeof form> = {}
    if (!form.name.trim()) e.name = "El nombre es requerido"
    if (!form.email.trim()) e.email = "El email es requerido"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "El email no es válido"
    if (!form.message.trim()) e.message = "El mensaje es requerido"
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSending(true)
    // Pendiente: enviar `form` al backend de Franco cuando esté el endpoint de contacto
    await new Promise((r) => setTimeout(r, 600))
    setSending(false)
    setSent(true)
  }

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((p) => ({ ...p, [key]: e.target.value }))
        setErrors((p) => ({ ...p, [key]: undefined }))
      },
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle size={40} className="text-violet-600 mb-3" />
        <p className="text-lg font-semibold text-gray-900 mb-1">¡Mensaje enviado!</p>
        <p className="text-gray-500 text-sm">Te respondemos en menos de 24hs.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input
          type="text"
          placeholder="Tu nombre"
          {...field("name")}
          className={`w-full px-3 py-2 rounded-md border text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors ${errors.name ? "border-red-400" : "border-gray-300"}`}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          placeholder="hola@ejemplo.com"
          {...field("email")}
          className={`w-full px-3 py-2 rounded-md border text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors ${errors.email ? "border-red-400" : "border-gray-300"}`}
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
        <textarea
          rows={4}
          placeholder="Contanos sobre tu estética..."
          {...field("message")}
          className={`w-full px-3 py-2 rounded-md border text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors resize-none ${errors.message ? "border-red-400" : "border-gray-300"}`}
        />
        {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={sending}
        className="w-full py-2.5 bg-violet-600 text-white rounded-md font-semibold hover:bg-violet-500 disabled:opacity-50 transition-colors"
      >
        {sending ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  )
}
