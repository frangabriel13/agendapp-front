"use client"

import { X, Clock, User, Stethoscope, Phone, FileText, Pencil, Check, XCircle, CheckCheck, UserX } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { Appointment, AppointmentStatus } from "@/types"
import { STATUS_BADGE, STATUS_LABELS, TRANSICIONES } from "../lib/status"
import { customerName, employeeColor, serviceName } from "../lib/display"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { formatCents } from "@/features/catalog/lib/money"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00")
  return date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

interface Props {
  appointment: Appointment
  onClose: () => void
  onChangeStatus: (status: AppointmentStatus) => void
  onEdit: () => void
}

type Tone = "primary" | "muted" | "danger"

/**
 * Cómo se ofrece cada destino. **Cuáles se ofrecen sale de `TRANSICIONES`**, no
 * de una lista escrita acá: el backend rechaza una transición inválida con 409, y
 * dos listas separadas se desincronizan sin que nada avise.
 *
 * Antes esto ofrecía "Reabrir" un turno cancelado. **No se puede**: cancelado,
 * atendido, ausente y reprogramado son estados finales, así que ese botón daba
 * 409. Lo correcto para volver atrás es agendar de nuevo.
 */
const DESTINO: Record<AppointmentStatus, { label: string; icon: LucideIcon; tone: Tone }> = {
  PENDING_PAYMENT: { label: "Marcar sin seña", icon: Clock, tone: "muted" },
  CONFIRMED: { label: "Confirmar", icon: Check, tone: "primary" },
  ATTENDED: { label: "Atendido", icon: CheckCheck, tone: "primary" },
  NO_SHOW: { label: "No asistió", icon: UserX, tone: "muted" },
  CANCELED_BY_CUSTOMER: { label: "Canceló el cliente", icon: XCircle, tone: "danger" },
  CANCELED_BY_BUSINESS: { label: "Cancelar", icon: XCircle, tone: "danger" },
  RESCHEDULED: { label: "Reprogramado", icon: Clock, tone: "muted" },
}

const TONE: Record<"primary" | "muted" | "danger", string> = {
  primary: cta({ size: "sm" }),
  muted: cta({ variant: "outline", size: "sm" }),
  // El destructivo no está en `cta`: es el único rojo del sistema y sumarlo como
  // variante lo pondría al alcance de cualquier pantalla sin querer.
  danger: cn(cta({ variant: "outline", size: "sm" }), "border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"),
}

export function AppointmentModal({ appointment, onClose, onChangeStatus, onEdit }: Props) {
  const { startTime, endTime, status, notes } = appointment
  const actions = TRANSICIONES[status].map((destino) => ({ status: destino, ...DESTINO[destino] }))

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="block p-0 gap-0 bg-white rounded-2xl shadow-xl overflow-hidden sm:max-w-md"
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-black/[0.06]">
          <div>
            <p className="text-xs text-neutral-400 mb-1 capitalize">{formatDate(appointment.day)}</p>
            <DialogTitle className="text-lg font-bold text-neutral-900">{customerName(appointment)}</DialogTitle>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full border mt-1 ${STATUS_BADGE[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <DialogClose
            aria-label="Cerrar"
            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X size={18} />
          </DialogClose>
        </div>

        <div className="px-6 py-5 space-y-4">
          <Row icon={<Stethoscope size={15} />} label="Servicio">
            <span className="font-medium text-neutral-900">{serviceName(appointment)}</span>
            {/* `totalPriceCents`: el precio **congelado al reservar**. El del catálogo
                pudo cambiar después y este turno no se mueve. */}
            <span className="text-neutral-400 text-xs ml-1">
              — {formatCents(appointment.totalPriceCents)}
            </span>
          </Row>

          <Row icon={<Clock size={15} />} label="Horario">
            <span className="font-medium text-neutral-900">{startTime} – {endTime}</span>
            <span className="text-neutral-400 text-xs ml-1">
              ({appointment.services.reduce((t, x) => t + x.durationMinutes, 0)} min)
            </span>
          </Row>

          <Row icon={<User size={15} />} label="Profesional">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 shrink-0"
              style={{ backgroundColor: employeeColor(appointment) }}
            />
            <span className="font-medium text-neutral-900">{appointment.employee.name}</span>
            <span className="text-neutral-400 text-xs ml-1">— {appointment.branch.name}</span>
          </Row>

          <Row icon={<Phone size={15} />} label="Teléfono">
            <span className="font-medium text-neutral-900">{appointment.customer.phone}</span>
          </Row>

          {notes && (
            <Row icon={<FileText size={15} />} label="Notas">
              <span className="text-neutral-700">{notes}</span>
            </Row>
          )}
        </div>

        <div className="px-6 py-4 border-t border-black/[0.06] flex flex-wrap items-center gap-2">
          {actions.map(({ status: s, label, icon: Icon, tone }) => (
            <button
              key={s}
              onClick={() => onChangeStatus(s)}
              className={TONE[tone]}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
          <button
            onClick={onEdit}
            className={cn(cta({ variant: "outline", size: "sm" }), "ml-auto")}
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
      <div className="w-5 h-5 flex items-center justify-center text-neutral-400 shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-neutral-400 mb-0.5">{label}</p>
        <div className="flex items-center flex-wrap text-sm">{children}</div>
      </div>
    </div>
  )
}
