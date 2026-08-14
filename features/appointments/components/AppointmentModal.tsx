"use client"

import { X, Clock, User, Stethoscope, Phone, FileText, Pencil, Check, XCircle, CheckCheck, UserX } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { Appointment, AppointmentStatus } from "@/types"
import { STATUS_BADGE, STATUS_LABELS } from "../lib/status"

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
  onChangeStatus: (status: AppointmentStatus) => void
  onEdit: () => void
}

const ACTIONS: Record<AppointmentStatus, { status: AppointmentStatus; label: string; icon: LucideIcon; tone: "primary" | "muted" | "danger" }[]> = {
  pending: [
    { status: "confirmed", label: "Confirmar", icon: Check, tone: "primary" },
    { status: "cancelled", label: "Cancelar", icon: XCircle, tone: "danger" },
  ],
  confirmed: [
    { status: "completed", label: "Completado", icon: CheckCheck, tone: "primary" },
    { status: "no_show", label: "No asistió", icon: UserX, tone: "muted" },
    { status: "cancelled", label: "Cancelar", icon: XCircle, tone: "danger" },
  ],
  completed: [],
  cancelled: [{ status: "pending", label: "Reabrir", icon: Check, tone: "muted" }],
  no_show: [{ status: "pending", label: "Reabrir", icon: Check, tone: "muted" }],
}

const TONE: Record<"primary" | "muted" | "danger", string> = {
  primary: "bg-violet-600 text-white hover:bg-violet-500",
  muted: "border border-gray-200 text-gray-600 hover:bg-gray-50",
  danger: "border border-red-200 text-red-600 hover:bg-red-50",
}

export function AppointmentModal({ appointment, onClose, onChangeStatus, onEdit }: Props) {
  const { patient, professional, service, date, startTime, endTime, status, notes } = appointment
  const actions = ACTIONS[status]

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="block p-0 gap-0 bg-white rounded-2xl shadow-xl overflow-hidden sm:max-w-md"
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-400 mb-1 capitalize">{formatDate(date)}</p>
            <DialogTitle className="text-lg font-bold text-gray-900">{patient.name}</DialogTitle>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full border mt-1 ${STATUS_BADGE[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <DialogClose
            aria-label="Cerrar"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </DialogClose>
        </div>

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

        <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center gap-2">
          {actions.map(({ status: s, label, icon: Icon, tone }) => (
            <button
              key={s}
              onClick={() => onChangeStatus(s)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md font-medium transition-colors ${TONE[tone]}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ml-auto"
          >
            <Pencil size={15} />
            Editar
          </button>
        </div>
      </DialogContent>
    </Dialog>
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
