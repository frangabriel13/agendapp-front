"use client"

import { X, Clock, User, Stethoscope, Phone, FileText, CalendarDays } from "lucide-react"
import type { Appointment } from "@/types"

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-300",
  pending: "bg-amber-100 text-amber-700 border-amber-300",
  completed: "bg-slate-100 text-slate-600 border-slate-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
  no_show: "bg-red-50 text-red-600 border-red-200",
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  pending: "Pendiente",
  completed: "Completado",
  cancelled: "Cancelado",
  no_show: "No asistió",
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00")
  return date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

function formatPrice(price: number): string {
  return price.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
}

interface Props {
  appointment: Appointment
  onClose: () => void
}

export function AppointmentModal({ appointment, onClose }: Props) {
  const { patient, professional, service, date, startTime, endTime, status, notes } = appointment

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-1 capitalize">{formatDate(date)}</p>
            <h2 className="text-lg font-bold text-gray-900">{patient.name}</h2>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full border mt-1 ${STATUS_STYLES[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <Row icon={<Stethoscope size={15} />} label="Servicio">
            <span className="font-medium text-gray-900">{service.name}</span>
            <span className="text-gray-400 text-xs ml-1">— {formatPrice(service.price)}</span>
          </Row>

          <Row icon={<Clock size={15} />} label="Horario">
            <span className="font-medium text-gray-900">{startTime} – {endTime}</span>
            <span className="text-gray-400 text-xs ml-1">({service.duration} min)</span>
          </Row>

          <Row icon={<User size={15} />} label="Profesional">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 shrink-0"
              style={{ backgroundColor: professional.color }}
            />
            <span className="font-medium text-gray-900">{professional.name}</span>
            <span className="text-gray-400 text-xs ml-1">— {professional.specialty}</span>
          </Row>

          <Row icon={<Phone size={15} />} label="Teléfono">
            <span className="font-medium text-gray-900">{patient.phone}</span>
          </Row>

          {notes && (
            <Row icon={<FileText size={15} />} label="Notas">
              <span className="text-gray-700">{notes}</span>
            </Row>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 flex items-center justify-center text-gray-400 shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <div className="flex items-center flex-wrap text-sm">{children}</div>
      </div>
    </div>
  )
}
