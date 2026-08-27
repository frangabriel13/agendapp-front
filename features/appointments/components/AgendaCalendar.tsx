"use client"

import { useMemo, useState } from "react"
import { CalendarOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { dateToStr, parseCalendarDay } from "@/lib/time"
import type { Appointment, AppointmentStatus } from "@/types"
import type { Quien } from "../lib/display"
import { busiestDay, containsToday, monthCells } from "../lib/agenda"
import { getWeekDates } from "../lib/week"
import { avatarStyle } from "../lib/tone"
import { CalendarToolbar, type CalendarView } from "./CalendarToolbar"
import { MonthGrid } from "./MonthGrid"
import { TimeGrid, type GridColumn } from "./TimeGrid"

interface Props {
  appointments: Appointment[]
  professionals: Quien[]
  now: Date
  selectedId: string | null
  /** Estado por el que llega filtrado desde las tarjetas de arriba. */
  status: AppointmentStatus | "all"
  onStatus: (status: AppointmentStatus | "all") => void
  onAppointmentClick: (appointment: Appointment) => void
  onSlotClick: (date: string, time: string) => void
}

/**
 * El calendario y su barra: mes, semana o día.
 *
 * Las tres vistas comparten el período y los filtros, así que el estado vive
 * acá y no en cada una: cambiar de semana y saltar a la vista de día tiene que
 * dejarte en el mismo lugar, no devolverte a hoy.
 */
export function AgendaCalendar({
  appointments,
  professionals,
  now,
  selectedId,
  status,
  onStatus,
  onAppointmentClick,
  onSlotClick,
}: Props) {
  const [view, setView] = useState<CalendarView>("week")
  const [cursor, setCursor] = useState(now)
  const [professional, setProfessional] = useState("all")

  const visibles = useMemo(
    () =>
      appointments.filter(
        (a) =>
          (professional === "all" || a.employee.id === professional) &&
          (status === "all" || a.status === status),
      ),
    [appointments, professional, status],
  )

  const week = useMemo(() => getWeekDates(cursor), [cursor])
  const porColor = useMemo(
    () => new Map(professionals.map((p) => [p.id, p])),
    [professionals],
  )

  function mover(pasos: number) {
    const d = new Date(cursor)
    if (view === "week") d.setDate(d.getDate() + pasos * 7)
    else if (view === "day") d.setDate(d.getDate() + pasos)
    else d.setMonth(d.getMonth() + pasos, 1)
    setCursor(d)
  }

  const delRango = visibles.filter((a) => enRango(a, view, cursor, week))

  return (
    <>
      <CalendarToolbar
        view={view}
        onView={setView}
        title={titulo(view, cursor, week)}
        count={delRango.length}
        onPrev={() => mover(-1)}
        onNext={() => mover(1)}
        onToday={() => setCursor(now)}
        professionals={professionals}
        professional={professional}
        onProfessional={setProfessional}
        status={status}
        onStatus={onStatus}
      />

      {view === "week" && (
        <TimeGrid
          columns={week.map((date): GridColumn => {
            const key = dateToStr(date)
            return {
              key,
              today: key === dateToStr(now),
              appointments: visibles.filter((a) => a.day === key),
              header: <CabeceraDia date={date} hoy={key === dateToStr(now)} />,
            }
          })}
          now={now}
          showNow={containsToday(week, now)}
          selectedId={selectedId}
          minWidth="min-w-[58rem]"
          onAppointmentClick={onAppointmentClick}
          onSlotClick={onSlotClick}
          empty={<Vacio periodo="esta semana" />}
        />
      )}

      {view === "day" && (
        <TimeGrid
          columns={professionals.map((p): GridColumn => {
            const suyos = visibles.filter(
              (a) => a.day === dateToStr(cursor) && a.employee.id === p.id,
            )
            return {
              key: p.id,
              appointments: suyos,
              header: <CabeceraProfesional profesional={p} turnos={suyos.length} />,
            }
          })}
          now={now}
          showNow={containsToday([cursor], now)}
          selectedId={selectedId}
          minWidth="min-w-[34rem]"
          onAppointmentClick={onAppointmentClick}
          // En esta vista la columna es la persona, así que la fecha es el cursor.
          onSlotClick={(_, time) => onSlotClick(dateToStr(cursor), time)}
          empty={<Vacio periodo="este día" />}
        />
      )}

      {view === "month" && (
        <MesConDatos
          cursor={cursor}
          appointments={visibles}
          now={now}
          professionals={porColor}
          onPickDay={(key) => {
            setCursor(parseCalendarDay(key))
            setView("day")
          }}
        />
      )}
    </>
  )
}

function MesConDatos({
  cursor,
  appointments,
  now,
  professionals,
  onPickDay,
}: {
  cursor: Date
  appointments: Appointment[]
  now: Date
  professionals: Map<string, Quien>
  onPickDay: (key: string) => void
}) {
  const cells = useMemo(() => monthCells(cursor, appointments, now), [cursor, appointments, now])
  return (
    <MonthGrid
      cells={cells}
      busiest={busiestDay(cells)}
      professionals={professionals}
      onPickDay={onPickDay}
    />
  )
}

function CabeceraDia({ date, hoy }: { date: Date; hoy: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-0.5 px-2">
      <p
        className={cn(
          "text-[12.5px] font-medium capitalize",
          hoy ? "text-violet-700" : "text-neutral-500",
        )}
      >
        {date.toLocaleDateString("es-AR", { weekday: "long" })}
      </p>
      <p
        className={cn(
          "text-[13px] font-semibold tracking-tight",
          hoy ? "text-violet-600" : "text-neutral-900",
        )}
      >
        {date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
      </p>
    </div>
  )
}

function CabeceraProfesional({
  profesional,
  turnos,
}: {
  profesional: Quien
  turnos: number
}) {
  return (
    <div className="flex h-full items-center gap-2.5 px-4">
      <span
        aria-hidden
        style={avatarStyle(profesional.hex)}
        className="flex size-[34px] shrink-0 items-center justify-center rounded-full text-sm font-bold"
      >
        {profesional.name.charAt(0)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-neutral-900">
          {profesional.name}
        </span>
        {/* Antes decía la especialidad, que venía del mock. La API no la trae en
            el turno, y el dato que sirve en la cabecera de una columna del día es
            cuánto tiene esa persona. */}
        <span className="block truncate text-[11px] text-neutral-500">
          {turnos} turno{turnos === 1 ? "" : "s"}
        </span>
      </span>
    </div>
  )
}

function Vacio({ periodo }: { periodo: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <CalendarOff size={30} aria-hidden className="text-neutral-300" />
      <p className="text-[13px] font-medium text-neutral-500">No hay turnos {periodo}</p>
      <p className="text-[11px] text-neutral-400">Tocá un horario para agendar uno.</p>
    </div>
  )
}

/** Qué turnos entran en el período que se está mirando. */
function enRango(
  appointment: Appointment,
  view: CalendarView,
  cursor: Date,
  week: Date[],
): boolean {
  if (view === "day") return appointment.day === dateToStr(cursor)
  if (view === "week") {
    return appointment.day >= dateToStr(week[0]!) && appointment.day <= dateToStr(week[6]!)
  }
  return appointment.day.startsWith(dateToStr(cursor).slice(0, 7))
}

function titulo(view: CalendarView, cursor: Date, week: Date[]): string {
  if (view === "day") {
    return cursor.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
  }
  if (view === "month") {
    return cursor.toLocaleDateString("es-AR", { month: "long", year: "numeric" })
  }

  const desde = week[0]!
  const hasta = week[6]!
  const mes = (d: Date) => d.toLocaleDateString("es-AR", { month: "long" })

  // "31 de agosto al 6 de septiembre" cuando la semana cruza de mes.
  return desde.getMonth() === hasta.getMonth()
    ? `${desde.getDate()} al ${hasta.getDate()} de ${mes(desde)}`
    : `${desde.getDate()} de ${mes(desde)} al ${hasta.getDate()} de ${mes(hasta)}`
}
