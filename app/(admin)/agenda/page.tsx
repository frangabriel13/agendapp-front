"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Plus } from "lucide-react"
import { Page } from "../ui/Page"
import { Panel, PanelHeader, pillClasses } from "@/components/Panel"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { dateToStr } from "@/lib/time"
import { AgendaCalendar } from "@/features/appointments/components/AgendaCalendar"
import { AppointmentModal } from "@/features/appointments/components/AppointmentModal"
import { AppointmentFormModal } from "@/features/appointments/components/AppointmentFormModal"
import { DayBoard } from "@/features/appointments/components/DayBoard"
import { WeekSummary } from "@/features/appointments/components/WeekSummary"
import { getWeekDates } from "@/features/appointments/lib/week"
import { mockAppointments, mockProfessionals, mockServices } from "@/features/appointments/data/mockData"
import type { Appointment, AppointmentStatus } from "@/types"

interface FormState {
  mode: "create" | "edit"
  initial: {
    date: string
    startTime: string
    professionalId?: string
    appointment?: Appointment
  }
}

/**
 * La agenda, en tres bandas.
 *
 * 1. Los cuatro números de la semana — el resumen.
 * 2. Hoy repartido por estado — qué hay que hacer.
 * 3. El calendario — cuándo es cada cosa.
 *
 * Las dos primeras miran siempre la semana y el día en curso; el calendario se
 * mueve por su cuenta. Si el resumen siguiera la navegación, los números
 * cambiarían debajo del mouse al pasar de semana para mirar algo.
 */
export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [status, setStatus] = useState<AppointmentStatus | "all">("all")

  // Se fija al montar: si se recalculara en cada render, cruzar la medianoche
  // con el panel abierto correría la agenda debajo del mouse.
  const now = useMemo(() => new Date(), [])
  const week = useMemo(() => getWeekDates(now), [now])

  const detail = appointments.find((a) => a.id === detailId) ?? null

  function openSlot(date: string, startTime: string) {
    setForm({ mode: "create", initial: { date, startTime } })
  }

  function openEdit(appointment: Appointment) {
    setDetailId(null)
    setForm({
      mode: "edit",
      initial: { date: appointment.date, startTime: appointment.startTime, appointment },
    })
  }

  function handleSubmit(appointment: Appointment) {
    setAppointments((prev) => {
      const exists = prev.some((a) => a.id === appointment.id)
      return exists ? prev.map((a) => (a.id === appointment.id ? appointment : a)) : [...prev, appointment]
    })
    setForm(null)
  }

  function changeStatus(appointment: Appointment, next: AppointmentStatus) {
    setAppointments((prev) => prev.map((a) => (a.id === appointment.id ? { ...a, status: next } : a)))
  }

  return (
    <Page width="full" className="flex flex-col gap-3">
      <Panel>
        <PanelHeader
          title="Agenda"
          size="lg"
          action={
            <>
              <span className={cn(pillClasses, "hidden sm:inline-flex")}>
                <CalendarDays size={13} aria-hidden />
                {rango(week)}
              </span>
              <button
                type="button"
                onClick={() => openSlot(dateToStr(now), "09:00")}
                className={cn(cta({ size: "sm" }))}
              >
                <Plus size={16} aria-hidden />
                Nuevo turno
              </button>
            </>
          }
        />
        <WeekSummary appointments={appointments} week={week} onPick={setStatus} />
      </Panel>

      <Panel>
        <PanelHeader
          title={`Hoy, ${now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric" })}`}
          badge={
            <span className={pillClasses}>
              {deHoy(appointments, now)} turno{deHoy(appointments, now) === 1 ? "" : "s"}
            </span>
          }
        />
        <DayBoard
          appointments={appointments}
          day={now}
          now={now}
          onOpen={(a) => setDetailId(a.id)}
          onChangeStatus={changeStatus}
        />
      </Panel>

      <Panel className="overflow-hidden">
        <AgendaCalendar
          appointments={appointments}
          professionals={mockProfessionals}
          now={now}
          selectedId={detailId}
          status={status}
          onStatus={setStatus}
          onAppointmentClick={(a) => setDetailId(a.id)}
          onSlotClick={openSlot}
        />
      </Panel>

      {detail && (
        <AppointmentModal
          appointment={detail}
          onClose={() => setDetailId(null)}
          onChangeStatus={(next) => changeStatus(detail, next)}
          onEdit={() => openEdit(detail)}
        />
      )}

      {form && (
        <AppointmentFormModal
          mode={form.mode}
          professionals={mockProfessionals}
          services={mockServices}
          initial={form.initial}
          onClose={() => setForm(null)}
          onSubmit={handleSubmit}
        />
      )}
    </Page>
  )
}

function deHoy(appointments: Appointment[], now: Date): number {
  const key = dateToStr(now)
  return appointments.filter((a) => a.date === key).length
}

function rango(week: Date[]): string {
  const desde = week[0]!
  const hasta = week[6]!
  const mes = (d: Date) => d.toLocaleDateString("es-AR", { month: "long" })

  return desde.getMonth() === hasta.getMonth()
    ? `${desde.getDate()} al ${hasta.getDate()} de ${mes(desde)}`
    : `${desde.getDate()} de ${mes(desde)} al ${hasta.getDate()} de ${mes(hasta)}`
}
