"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Plus, RotateCw } from "lucide-react"
import { Page } from "../ui/Page"
import { Panel, PanelHeader, pillClasses } from "@/components/Panel"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { businessNow, dateToStr } from "@/lib/time"
import { AgendaCalendar } from "@/features/appointments/components/AgendaCalendar"
import { AppointmentModal } from "@/features/appointments/components/AppointmentModal"
import { BookingModal } from "@/features/appointments/components/BookingModal"
import { DayBoard } from "@/features/appointments/components/DayBoard"
import { WeekSummary } from "@/features/appointments/components/WeekSummary"
import { getWeekDates } from "@/features/appointments/lib/week"
import { useChangeStatus, useMonthAppointments } from "@/features/appointments/hooks/useAppointments"
import { quienesAtienden } from "@/features/appointments/lib/display"
import { apiErrorMessage } from "@/lib/errors"
import type { Appointment, AppointmentStatus, RefundDecision } from "@/types"

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
  const [detailId, setDetailId] = useState<string | null>(null)
  const [booking, setBooking] = useState<Date | null>(null)
  const [status, setStatus] = useState<AppointmentStatus | "all">("all")
  const [devolucion, setDevolucion] = useState<RefundDecision | null>(null)

  /**
   * **El reloj del negocio, no el de la máquina.** `businessNow()` devuelve un
   * `Date` corrido para que `getHours()` y `dateToStr()` den la hora y el día del
   * negocio: así la línea de "ahora", qué turno está en curso y cuál es el
   * casillero de hoy salen bien aunque quien mira esté en otra zona.
   *
   * Se fija al montar: si se recalculara en cada render, cruzar la medianoche con
   * el panel abierto correría la agenda debajo del mouse.
   */
  const now = useMemo(() => businessNow(), [])
  const week = useMemo(() => getWeekDates(now), [now])

  /**
   * Se pide **el mes entero de una vez**, no la semana visible: moverse entre
   * semanas dentro del mes no dispara una request por paso, y el resumen de la
   * banda de arriba necesita la semana en curso aunque el calendario esté
   * mirando otra.
   */
  const query = useMonthAppointments(now)
  const appointments = query.data ?? []
  const cambiarEstado = useChangeStatus()

  const detail = appointments.find((a) => a.id === detailId) ?? null
  const equipo = quienesAtienden(appointments)

  // Antes los turnos eran locales y siempre estaban; ahora viajan, y las tres
  // bandas dirían "0 turnos" mientras cargan. Un cero es una afirmación.
  if (query.isPending) return <AgendaCargando />
  if (query.isError) return <AgendaCaida error={query.error} onRetry={() => query.refetch()} />

  /**
   * **La devolución llega con la respuesta de cancelar, no antes.** El backend la
   * calcula según su política y la manda en `refund`; hasta el punto 15 se tiraba.
   * Se guarda acá y no en el modal porque el modal se desmonta si el turno sale
   * del rango visible, y este dato hay que alcanzar a leerlo.
   */
  function changeStatus(appointment: Appointment, next: AppointmentStatus) {
    setDevolucion(null)
    cambiarEstado.mutate(
      { id: appointment.id, status: next },
      { onSuccess: (resultado) => setDevolucion(resultado.refund) },
    )
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
                onClick={() => setBooking(now)}
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
          professionals={equipo}
          now={now}
          selectedId={detailId}
          status={status}
          onStatus={setStatus}
          onAppointmentClick={(a) => setDetailId(a.id)}
          onSlotClick={(date) => setBooking(new Date(`${date}T12:00:00`))}
        />
      </Panel>

      {detail && (
        <AppointmentModal
          appointment={detail}
          refund={devolucion}
          onClose={() => {
            setDetailId(null)
            setDevolucion(null)
          }}
          onChangeStatus={(next) => changeStatus(detail, next)}
          onEdit={() => setBooking(new Date(`${detail.day}T12:00:00`))}
          // Reprogramar crea otro turno: la pantalla salta a ese en vez de
          // quedarse en el viejo, que a partir de ahí es un registro muerto.
          onRescheduled={(nuevoId) => setDetailId(nuevoId)}
        />
      )}

      <BookingModal
        open={booking !== null}
        day={booking ?? now}
        onClose={() => setBooking(null)}
      />
    </Page>
  )
}

function AgendaCargando() {
  return (
    <Page width="full" className="flex flex-col gap-3">
      <Panel>
        <div className="h-28 animate-pulse rounded-xl bg-neutral-100" />
      </Panel>
      <Panel>
        <div className="h-44 animate-pulse rounded-xl bg-neutral-100" />
      </Panel>
      <Panel className="flex-1">
        <div className="h-full min-h-64 animate-pulse rounded-xl bg-neutral-100" />
      </Panel>
    </Page>
  )
}

function AgendaCaida({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Page width="full" className="flex flex-col gap-3">
      <Panel>
        <div className="px-2 py-12 text-center">
          <p className="text-sm font-medium text-neutral-900">No pudimos cargar la agenda</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-neutral-500">
            {apiErrorMessage(error, "Revisá tu conexión y probá de nuevo.")}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className={cn(cta({ variant: "outline", size: "sm" }), "mt-5")}
          >
            <RotateCw size={15} />
            Reintentar
          </button>
        </div>
      </Panel>
    </Page>
  )
}

function deHoy(appointments: Appointment[], now: Date): number {
  const key = dateToStr(now)
  return appointments.filter((a) => a.day === key).length
}

function rango(week: Date[]): string {
  const desde = week[0]!
  const hasta = week[6]!
  const mes = (d: Date) => d.toLocaleDateString("es-AR", { month: "long" })

  return desde.getMonth() === hasta.getMonth()
    ? `${desde.getDate()} al ${hasta.getDate()} de ${mes(desde)}`
    : `${desde.getDate()} de ${mes(desde)} al ${hasta.getDate()} de ${mes(hasta)}`
}
