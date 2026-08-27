"use client"

import { useMemo } from "react"
import { CalendarCheck, Clock, User } from "lucide-react"
import { Panel, PanelHeader, PanelLink } from "@/components/Panel"
import { cn } from "@/lib/utils"
import { STATUS_BADGE, STATUS_LABELS } from "@/features/appointments/lib/status"
import type { Appointment } from "@/types"
import { customerName, employeeColor, serviceName } from "@/features/appointments/lib/display"
import { nextUpIndex, nextUpLabel } from "../lib/agenda"
import { businessNow, clockTime } from "@/lib/time"

/** Cuántos entran en la lista sin que la tarjeta crezca de más. */
const VISIBLE = 5

/**
 * El día, con el turno que sigue destacado arriba.
 *
 * Se muestra la jornada entera y no solo lo que falta: a las siete de la tarde
 * "no queda nada" es una tarjeta vacía, y lo que se quiere ver a esa hora es
 * cómo estuvo el día.
 *
 * Recibe los turnos ya ordenados en vez de pedirlos: hoy salen de datos de
 * ejemplo y mañana de la API, y esta tarjeta no tiene por qué enterarse.
 */
export function UpcomingAppointments({ appointments }: { appointments: Appointment[] }) {
  const now = useMemo(() => clockTime(businessNow()), [])

  const nextIndex = nextUpIndex(appointments, now)
  const siguiente = nextIndex === -1 ? undefined : appointments[nextIndex]
  const resto = appointments.filter((_, index) => index !== nextIndex).slice(0, VISIBLE)

  return (
    <Panel className="flex flex-col">
      <PanelHeader title="Turnos de hoy" action={<PanelLink href="/agenda">Ver agenda</PanelLink>} />

      {appointments.length === 0 ? (
        <div className="px-5 pb-10 text-center">
          <CalendarCheck size={26} aria-hidden className="mx-auto mb-3 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-900">No hay turnos para hoy</p>
          <p className="mt-1 text-[13px] text-neutral-500">
            Cuando entre una reserva, la vas a ver acá.
          </p>
        </div>
      ) : (
        <div className="flex-1 px-5 pb-5">
          {siguiente ? (
            <NextUp appointment={siguiente} label={nextUpLabel(siguiente, now)} />
          ) : (
            <p className="rounded-2xl border border-black/[0.06] bg-neutral-50 px-4 py-3 text-[13px] text-neutral-500">
              Terminó la jornada: {appointments.length} turnos.
            </p>
          )}

          {resto.length > 0 && (
            <ul className="mt-1">
              {resto.map((appointment) => (
                <Row key={appointment.id} appointment={appointment} past={appointment.endTime <= now} />
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  )
}

/**
 * El turno que sigue, en amarillo.
 *
 * Es la única tarjeta de color del tablero: si hubiera dos, ninguna de las dos
 * sería lo primero que se mira.
 */
function NextUp({ appointment, label }: { appointment: Appointment; label: string }) {
  const chip = "inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-medium text-amber-900"

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-200 to-amber-300 p-4 shadow-[0_12px_26px_-16px_rgba(180,83,9,0.9)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight text-amber-950">
            {customerName(appointment)}
          </p>
          <p className="truncate text-[13px] text-amber-900/80">{serviceName(appointment)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white/75 px-2.5 py-1 text-[11px] font-medium text-amber-900">
          {label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={chip}>
          <Clock size={12} aria-hidden />
          {appointment.startTime} – {appointment.endTime}
        </span>
        <span className={chip}>
          <User size={12} aria-hidden />
          {appointment.employee.name}
        </span>
      </div>
    </div>
  )
}

function Row({ appointment, past }: { appointment: Appointment; past: boolean }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 border-b border-black/[0.05] py-2.5 last:border-0",
        // Lo que ya pasó se ve, pero no compite con lo que falta.
        past && "opacity-55",
      )}
    >
      <span className="w-11 shrink-0 text-[13px] font-medium text-neutral-900 tabular-nums">
        {appointment.startTime}
      </span>
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: employeeColor(appointment) }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-neutral-900">{customerName(appointment)}</p>
        <p className="truncate text-xs text-neutral-500">{serviceName(appointment)}</p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
          STATUS_BADGE[appointment.status],
        )}
      >
        {STATUS_LABELS[appointment.status]}
      </span>
    </li>
  )
}
