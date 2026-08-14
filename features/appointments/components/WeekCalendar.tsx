"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, CalendarOff } from "lucide-react"
import type { Appointment, AppointmentStatus, Professional } from "@/types"
import { STATUS_BLOCK, STATUS_BADGE, STATUS_LABELS, STATUS_ORDER } from "../lib/status"
import { timeToMinutes, dateToStr } from "@/lib/time"
import { getWeekDates, layoutDay } from "../lib/week"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"

const HOUR_START = 8
const HOUR_END = 20
const SLOT_HEIGHT = 60
const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

interface Props {
  professionals: Professional[]
  appointments: Appointment[]
  isLoading?: boolean
  selectedId?: string | null
  onAppointmentClick: (appointment: Appointment) => void
  onSlotClick: (date: string, time: string) => void
  onNew: () => void
}

export function WeekCalendar({
  professionals,
  appointments,
  isLoading = false,
  selectedId,
  onAppointmentClick,
  onSlotClick,
  onNew,
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [profFilter, setProfFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all")

  const weekDates = getWeekDates(currentDate)
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)
  const todayStr = dateToStr(new Date())
  const monthLabel = currentDate.toLocaleDateString("es-AR", { month: "long", year: "numeric" })

  const filtered = useMemo(() => {
    return appointments.filter(
      (a) =>
        (profFilter === "all" || a.professionalId === profFilter) &&
        (statusFilter === "all" || a.status === statusFilter)
    )
  }, [appointments, profFilter, statusFilter])

  const weekStrs = weekDates.map(dateToStr)
  const weekCount = filtered.filter((a) => weekStrs.includes(a.date)).length

  function shiftWeek(days: number) {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + days)
    setCurrentDate(d)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-black/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(new Date())}
            className={cn(cta({ variant: "outline", size: "sm" }))}
          >
            Hoy
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => shiftWeek(-7)} aria-label="Semana anterior" className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => shiftWeek(7)} aria-label="Semana siguiente" className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900">
              <ChevronRight size={16} />
            </button>
          </div>
          <span className="text-sm font-medium capitalize text-neutral-900">{monthLabel}</span>
          <span className="text-sm text-neutral-400">· {weekCount} turno{weekCount !== 1 ? "s" : ""}</span>
        </div>

        <button
          onClick={onNew}
          className={cn(cta({ size: "sm" }))}
        >
          <Plus size={16} />
          Nuevo turno
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-black/[0.06] shrink-0 text-sm">
        <select
          value={profFilter}
          onChange={(e) => setProfFilter(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-neutral-700 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        >
          <option value="all">Todos los profesionales</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
              statusFilter === "all" ? "bg-violet-600 text-white border-violet-600" : "border-black/10 text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            Todos
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
                statusFilter === s ? STATUS_BADGE[s] : "border-black/10 text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3 ml-auto text-xs text-neutral-400">
          {professionals.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-14 shrink-0 border-r border-black/[0.06]">
          <div className="h-16 border-b border-black/[0.06]" />
          {hours.map((h) => (
            <div
              key={h}
              className="border-b border-black/[0.06] text-xs text-neutral-400 text-right pr-2 flex items-start pt-1"
              style={{ height: SLOT_HEIGHT }}
            >
              {h}:00
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto relative">
          {isLoading ? (
            <CalendarSkeleton hours={hours} />
          ) : (
            <div style={{ minWidth: 7 * 120 }}>
              <div className="flex border-b border-black/[0.06] sticky top-0 bg-white z-10">
                {weekDates.map((date, i) => {
                  const isToday = dateToStr(date) === todayStr
                  return (
                    <div key={i} className="flex-1 min-w-[120px] text-center py-3 border-r border-black/[0.06] last:border-r-0">
                      <p className="text-xs text-neutral-400 uppercase">{DAY_NAMES[i]}</p>
                      <p
                        className={`text-sm font-semibold mt-0.5 ${
                          isToday ? "bg-violet-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto" : "text-neutral-900"
                        }`}
                      >
                        {date.getDate()}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="flex">
                {weekDates.map((date, dayIdx) => {
                  const dateStr = dateToStr(date)
                  const dayAppts = filtered.filter((a) => a.date === dateStr)
                  const lanes = layoutDay(dayAppts)

                  return (
                    <div
                      key={dayIdx}
                      className="flex-1 min-w-[120px] border-r border-black/[0.06] last:border-r-0 relative"
                      style={{ height: (HOUR_END - HOUR_START) * SLOT_HEIGHT }}
                    >
                      {hours.map((h) => (
                        <button
                          key={h}
                          aria-label={`Crear turno ${dateStr} ${h}:00`}
                          onClick={() => onSlotClick(dateStr, `${String(h).padStart(2, "0")}:00`)}
                          className="absolute w-full border-b border-black/[0.04] hover:bg-violet-50/50 transition-colors cursor-pointer"
                          style={{ top: (h - HOUR_START) * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                        />
                      ))}

                      {dayAppts.map((appt) => {
                        const startMin = timeToMinutes(appt.startTime) - HOUR_START * 60
                        const endMin = timeToMinutes(appt.endTime) - HOUR_START * 60
                        const top = (startMin / 60) * SLOT_HEIGHT
                        const height = Math.max(((endMin - startMin) / 60) * SLOT_HEIGHT - 2, 20)
                        const { lane, lanes: laneCount } = lanes.get(appt.id) ?? { lane: 0, lanes: 1 }
                        const widthPct = 100 / laneCount

                        return (
                          <button
                            key={appt.id}
                            onClick={() => onAppointmentClick(appt)}
                            className={`absolute rounded border-l-4 px-1.5 py-1 text-left overflow-hidden cursor-pointer hover:brightness-95 transition-all ${STATUS_BLOCK[appt.status]} ${
                              selectedId === appt.id ? "ring-2 ring-violet-600 z-10" : ""
                            }`}
                            style={{
                              top,
                              height,
                              left: `calc(${lane * widthPct}% + 2px)`,
                              width: `calc(${widthPct}% - 4px)`,
                              borderLeftColor: appt.professional.color,
                            }}
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

              {weekCount === 0 && (
                <div className="absolute inset-0 top-16 flex flex-col items-center justify-center text-center pointer-events-none">
                  <CalendarOff size={32} className="text-neutral-300 mb-3" />
                  <p className="text-sm font-medium text-neutral-500">No hay turnos esta semana</p>
                  <p className="text-xs text-neutral-400 mt-1">Tocá un horario o usá &ldquo;Nuevo turno&rdquo; para agendar</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CalendarSkeleton({ hours }: { hours: number[] }) {
  return (
    <div style={{ minWidth: 7 * 120 }}>
      <div className="flex border-b border-black/[0.06] sticky top-0 bg-white z-10">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 min-w-[120px] py-3 flex flex-col items-center gap-2 border-r border-black/[0.06] last:border-r-0">
            <div className="h-3 w-8 bg-neutral-200 rounded animate-pulse" />
            <div className="h-5 w-5 bg-neutral-200 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
      <div className="flex">
        {Array.from({ length: 7 }).map((_, d) => (
          <div
            key={d}
            className="flex-1 min-w-[120px] border-r border-black/[0.06] last:border-r-0 relative"
            style={{ height: hours.length * SLOT_HEIGHT }}
          >
            {[0, 2, 4].map((k) => (
              <div
                key={k}
                className="absolute left-1 right-1 rounded bg-neutral-100 animate-pulse"
                style={{ top: (d + k) * 40 + 20, height: 52 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
