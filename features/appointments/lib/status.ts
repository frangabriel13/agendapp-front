import type { AppointmentStatus } from "@/types"

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
  no_show: "No asistió",
}

// Bloque del turno dentro del calendario semanal
export const STATUS_BLOCK: Record<AppointmentStatus, string> = {
  confirmed: "bg-emerald-100 border-emerald-400 text-emerald-900",
  pending: "bg-amber-100 border-amber-400 text-amber-900",
  completed: "bg-slate-100 border-slate-400 text-slate-600",
  cancelled: "bg-red-100 border-red-400 text-red-900 line-through opacity-60",
  no_show: "bg-red-50 border-red-300 text-red-700 opacity-60",
}

// Badge de estado (modal / filtros)
export const STATUS_BADGE: Record<AppointmentStatus, string> = {
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-300",
  pending: "bg-amber-100 text-amber-700 border-amber-300",
  completed: "bg-slate-100 text-slate-600 border-slate-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
  no_show: "bg-red-50 text-red-600 border-red-200",
}

export const STATUS_ORDER: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]
