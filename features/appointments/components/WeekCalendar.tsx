"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Appointment, Professional } from "@/types"

const HOUR_START = 8
const HOUR_END = 20
const SLOT_HEIGHT = 60

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-100 border-emerald-400 text-emerald-900",
  pending: "bg-amber-100 border-amber-400 text-amber-900",
  completed: "bg-slate-100 border-slate-400 text-slate-600",
  cancelled: "bg-red-100 border-red-400 text-red-900 line-through opacity-60",
  no_show: "bg-red-50 border-red-300 text-red-700 opacity-60",
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  pending: "Pendiente",
  completed: "Completado",
  cancelled: "Cancelado",
  no_show: "No asistió",
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function getWeekDates(referenceDate: Date): Date[] {
  const day = referenceDate.getDay()
  const monday = new Date(referenceDate)
  monday.setDate(referenceDate.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatDateStr(date: Date): string {
  return date.toISOString().split("T")[0]
}

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

interface Props {
  professionals: Professional[]
  appointments: Appointment[]
  onAppointmentClick?: (appointment: Appointment) => void
}

export function WeekCalendar({ professionals, appointments, onAppointmentClick }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const weekDates = getWeekDates(currentDate)
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  function prevWeek() {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  function nextWeek() {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  function goToday() {
    setCurrentDate(new Date())
  }

  const todayStr = formatDateStr(new Date())
  const monthLabel = currentDate.toLocaleDateString("es-AR", { month: "long", year: "numeric" })

  function handleClick(appt: Appointment) {
    setSelectedAppointment(appt)
    onAppointmentClick?.(appt)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            Hoy
          </button>
          <div className="flex items-center gap-1">
            <button onClick={prevWeek} className="p-1.5 rounded-md hover:bg-muted transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={nextWeek} className="p-1.5 rounded-md hover:bg-muted transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <span className="text-sm font-medium capitalize">{monthLabel}</span>
        </div>

        <div className="text-sm text-muted-foreground">
          {appointments.length} turno{appointments.length !== 1 ? "s" : ""} esta semana
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Time gutter */}
        <div className="w-14 shrink-0 border-r border-border">
          <div className="h-16 border-b border-border" />
          {hours.map((h) => (
            <div
              key={h}
              className="border-b border-border text-xs text-muted-foreground text-right pr-2 flex items-start pt-1"
              style={{ height: SLOT_HEIGHT }}
            >
              {h}:00
            </div>
          ))}
        </div>

        {/* Days scroll area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <div style={{ minWidth: professionals.length * 140 + 7 * 40 }}>
            {/* Day headers */}
            <div className="flex border-b border-border sticky top-0 bg-background z-10">
              {weekDates.map((date, i) => {
                const isToday = formatDateStr(date) === todayStr
                return (
                  <div
                    key={i}
                    className="flex-1 min-w-[40px] text-center py-3 border-r border-border last:border-r-0"
                  >
                    <p className="text-xs text-muted-foreground uppercase">{DAY_NAMES[i]}</p>
                    <p
                      className={`text-sm font-semibold mt-0.5 ${
                        isToday
                          ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto"
                          : ""
                      }`}
                    >
                      {date.getDate()}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Grid */}
            <div className="flex">
              {weekDates.map((date, dayIdx) => {
                const dateStr = formatDateStr(date)
                const dayAppts = appointments.filter((a) => a.date === dateStr)

                return (
                  <div
                    key={dayIdx}
                    className="flex-1 min-w-[40px] border-r border-border last:border-r-0 relative"
                    style={{ height: (HOUR_END - HOUR_START) * SLOT_HEIGHT }}
                  >
                    {/* Hour lines */}
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute w-full border-b border-border/50"
                        style={{ top: (h - HOUR_START) * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                      />
                    ))}

                    {/* Appointments */}
                    {dayAppts.map((appt) => {
                      const startMin = timeToMinutes(appt.startTime) - HOUR_START * 60
                      const endMin = timeToMinutes(appt.endTime) - HOUR_START * 60
                      const top = (startMin / 60) * SLOT_HEIGHT
                      const height = Math.max(((endMin - startMin) / 60) * SLOT_HEIGHT - 2, 20)
                      const colorClass = STATUS_COLORS[appt.status] || STATUS_COLORS.pending

                      return (
                        <button
                          key={appt.id}
                          onClick={() => handleClick(appt)}
                          className={`absolute left-0.5 right-0.5 rounded border-l-4 px-1.5 py-1 text-left overflow-hidden cursor-pointer hover:brightness-95 transition-all ${colorClass} ${
                            selectedAppointment?.id === appt.id ? "ring-2 ring-primary" : ""
                          }`}
                          style={{ top, height, borderLeftColor: appt.professional.color }}
                        >
                          <p className="text-xs font-semibold truncate leading-tight">{appt.patient.name}</p>
                          <p className="text-xs truncate opacity-75">{appt.service.name}</p>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedAppointment && (
        <div className="border-t border-border px-6 py-4 bg-card shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="font-semibold">{selectedAppointment.patient.name}</p>
              <p className="text-sm text-muted-foreground">{selectedAppointment.service.name} · {selectedAppointment.service.duration} min</p>
              <p className="text-sm text-muted-foreground">
                {selectedAppointment.startTime} – {selectedAppointment.endTime} · {selectedAppointment.professional.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[selectedAppointment.status]}`}>
                {STATUS_LABELS[selectedAppointment.status]}
              </span>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
