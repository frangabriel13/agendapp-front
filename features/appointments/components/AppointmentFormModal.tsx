"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { Appointment, Professional, Service } from "@/types"
import { addMinutes } from "../lib/time"

interface Initial {
  date: string
  startTime: string
  professionalId?: string
  appointment?: Appointment
}

interface Props {
  mode: "create" | "edit"
  professionals: Professional[]
  services: Service[]
  initial: Initial
  onClose: () => void
  onSubmit: (appointment: Appointment) => void
}

export function AppointmentFormModal({ mode, professionals, services, initial, onClose, onSubmit }: Props) {
  const a = initial.appointment

  const [form, setForm] = useState({
    patientName: a?.patient.name ?? "",
    patientPhone: a?.patient.phone ?? "",
    professionalId: a?.professionalId ?? initial.professionalId ?? professionals[0]?.id ?? "",
    serviceId: a?.serviceId ?? services[0]?.id ?? "",
    date: a?.date ?? initial.date,
    startTime: a?.startTime ?? initial.startTime,
    notes: a?.notes ?? "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: "" }))
  }

  function validate() {
    const e: Partial<Record<keyof typeof form, string>> = {}
    if (!form.patientName.trim()) e.patientName = "El paciente es requerido"
    if (!form.patientPhone.trim()) e.patientPhone = "El teléfono es requerido"
    if (!form.professionalId) e.professionalId = "Elegí un profesional"
    if (!form.serviceId) e.serviceId = "Elegí un servicio"
    if (!form.date) e.date = "La fecha es requerida"
    if (!form.startTime) e.startTime = "El horario es requerido"
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    // El id elegido puede no resolver: lista vacía, o un turno viejo que apunta
    // a un profesional que ya no está. `validate()` solo mira que no sea "".
    const professional = professionals.find((p) => p.id === form.professionalId)
    const service = services.find((s) => s.id === form.serviceId)
    if (!professional || !service) {
      setErrors({
        ...(professional ? {} : { professionalId: "Elegí un profesional" }),
        ...(service ? {} : { serviceId: "Elegí un servicio" }),
      })
      return
    }

    const patientId = a?.patientId ?? crypto.randomUUID()

    const appointment: Appointment = {
      id: a?.id ?? crypto.randomUUID(),
      patientId,
      patient: {
        id: patientId,
        name: form.patientName.trim(),
        phone: form.patientPhone.trim(),
      },
      professionalId: professional.id,
      professional,
      serviceId: service.id,
      service,
      branchId: professional.branchId,
      date: form.date,
      startTime: form.startTime,
      endTime: addMinutes(form.startTime, service.duration),
      status: a?.status ?? "pending",
      notes: form.notes.trim() || undefined,
    }
    onSubmit(appointment)
  }

  const inputCls = (err?: string) =>
    `w-full px-3 py-2 rounded-md border bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors ${
      err ? "border-red-400" : "border-gray-300"
    }`

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="flex flex-col p-0 gap-0 bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] sm:max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 shrink-0">
          <DialogTitle className="text-lg font-bold text-gray-900">
            {mode === "create" ? "Nuevo turno" : "Editar turno"}
          </DialogTitle>
          <DialogClose
            aria-label="Cerrar"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </DialogClose>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
            <input
              type="text"
              value={form.patientName}
              onChange={(e) => set("patientName", e.target.value)}
              placeholder="Nombre y apellido"
              className={inputCls(errors.patientName)}
            />
            {errors.patientName && <p className="text-xs text-red-500 mt-1">{errors.patientName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={form.patientPhone}
              onChange={(e) => set("patientPhone", e.target.value)}
              placeholder="11-4455-6677"
              className={inputCls(errors.patientPhone)}
            />
            {errors.patientPhone && <p className="text-xs text-red-500 mt-1">{errors.patientPhone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profesional</label>
            <select
              value={form.professionalId}
              onChange={(e) => set("professionalId", e.target.value)}
              className={inputCls(errors.professionalId)}
            >
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.specialty}</option>
              ))}
            </select>
            {errors.professionalId && <p className="text-xs text-red-500 mt-1">{errors.professionalId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
            <select
              value={form.serviceId}
              onChange={(e) => set("serviceId", e.target.value)}
              className={inputCls(errors.serviceId)}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.duration} min — {s.price.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                </option>
              ))}
            </select>
            {errors.serviceId && <p className="text-xs text-red-500 mt-1">{errors.serviceId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className={inputCls(errors.date)}
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                className={inputCls(errors.startTime)}
              />
              {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Indicaciones, contraindicaciones..."
              className={`${inputCls()} resize-none`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-violet-600 text-white rounded-md font-semibold hover:bg-violet-500 transition-colors"
            >
              {mode === "create" ? "Crear turno" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
