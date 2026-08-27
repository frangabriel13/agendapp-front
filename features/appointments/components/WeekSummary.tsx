"use client"

import { cn } from "@/lib/utils"
import { formatCents } from "@/features/catalog/lib/money"
import { quienesAtienden as quienes, type Quien } from "../lib/display"
import { dateToStr } from "@/lib/time"
import type { Appointment, AppointmentStatus } from "@/types"
import { weekStats } from "../lib/agenda"

interface Props {
  appointments: Appointment[]
  week: Date[]
  /** Tocar una tarjeta filtra el calendario por ese estado. */
  onPick: (status: AppointmentStatus | "all") => void
}

/**
 * Los cuatro números de la semana.
 *
 * Son tarjetas de color y no cuadros blancos porque son el resumen: si se vieran
 * como el resto de la pantalla habría que buscarlas. El degradé es del tono del
 * dato —violeta lo neutro, ámbar lo que hay que atender, verde la plata—, no
 * decoración.
 */
export function WeekSummary({ appointments, week, onPick }: Props) {
  const stats = weekStats(appointments, week)
  const desde = dateToStr(week[0]!)
  const hasta = dateToStr(week[week.length - 1]!)
  const dentro = appointments.filter((a) => a.day >= desde && a.day <= hasta)

    // Las dos cancelaciones, la ausencia y el turno viejo de una reprogramación:
  // los cuatro significan "esa hora no se usó".
  const caidos =
    stats.porEstado.CANCELED_BY_CUSTOMER +
    stats.porEstado.CANCELED_BY_BUSINESS +
    stats.porEstado.NO_SHOW +
    stats.porEstado.RESCHEDULED

  return (
    <div className="grid grid-cols-2 gap-3 px-5 pb-5 xl:grid-cols-4">
      <Tarjeta
        tono="from-violet-500 to-violet-700 shadow-violet-700/30"
        titulo="Turnos de la semana"
        valor={stats.total}
        pie={caidos === 1 ? "1 no se hizo" : `${caidos} no se hicieron`}
        avatares={quienes(dentro)}
        avance={proporcion(stats.porEstado.ATTENDED, stats.total)}
        onClick={() => onPick("all")}
      />
      <Tarjeta
        tono="from-amber-500 to-amber-700 shadow-amber-700/30"
        titulo="A confirmar"
        valor={stats.porEstado.PENDING_PAYMENT}
        pie="hay que llamar"
        avatares={quienes(dentro.filter((a) => a.status === "PENDING_PAYMENT"))}
        avance={proporcion(stats.porEstado.PENDING_PAYMENT, stats.total)}
        onClick={() => onPick("PENDING_PAYMENT")}
      />
      <Tarjeta
        tono="from-sky-500 to-sky-700 shadow-sky-700/30"
        titulo="Ya atendidos"
        valor={stats.porEstado.ATTENDED}
        pie={`de ${stats.total}`}
        avatares={quienes(dentro.filter((a) => a.status === "ATTENDED"))}
        avance={proporcion(stats.porEstado.ATTENDED, stats.total)}
        onClick={() => onPick("ATTENDED")}
      />
      <Tarjeta
        tono="from-emerald-500 to-emerald-700 shadow-emerald-700/30"
        titulo="Agendado"
        valor={formatCents(stats.agendado)}
        // La misma regla que el resto de la app: lo sin confirmar no suma, se
        // muestra al lado. Ver `revenue.ts`.
        pie={`+ ${formatCents(stats.sinConfirmar)} sin confirmar`}
        avatares={quienes(
          dentro.filter((a) => a.status === "ATTENDED" || a.status === "CONFIRMED"),
        )}
        avance={proporcion(stats.agendado, stats.agendado + stats.sinConfirmar)}
        onClick={() => onPick("CONFIRMED")}
      />
    </div>
  )
}

/** Sin turnos la barra queda vacía en vez de dar `NaN`. */
function proporcion(parte: number, total: number): number {
  return total === 0 ? 0 : parte / total
}

interface TarjetaProps {
  tono: string
  titulo: string
  valor: number | string
  pie: string
  avatares: Quien[]
  avance: number
  onClick: () => void
}

function Tarjeta({ tono, titulo, valor, pie, avatares, avance, onClick }: TarjetaProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col rounded-2xl bg-linear-to-br p-4 text-left text-white",
        "shadow-[0_10px_24px_-14px_var(--tw-shadow-color)] transition-transform hover:-translate-y-0.5",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
        tono,
      )}
    >
      <span className="flex items-center gap-2">
        <Pila profesionales={avatares} />
        <span aria-hidden className="ml-auto flex gap-[3px]">
          <span className="size-[3px] rounded-full bg-white/60" />
          <span className="size-[3px] rounded-full bg-white/60" />
          <span className="size-[3px] rounded-full bg-white/60" />
        </span>
      </span>

      <span className="pt-3 text-[15px] font-semibold tracking-tight">{titulo}</span>
      <span className="flex flex-wrap items-baseline gap-x-2 pt-0.5">
        <span className="text-[27px] leading-tight font-bold tracking-tight">{valor}</span>
        <span className="text-xs text-white/80">{pie}</span>
      </span>

      <span aria-hidden className="mt-auto flex h-2 w-full overflow-hidden rounded-full bg-white/25">
        <span className="h-full rounded-full bg-white" style={{ width: `${avance * 100}%` }} />
      </span>
    </button>
  )
}

/**
 * Las caras de quienes participan de ese número.
 *
 * Cada tarjeta muestra la suya y no la del equipo entero: si las cuatro
 * mostraran a todos, dirían lo mismo cuatro veces y no aportarían nada.
 */
function Pila({ profesionales }: { profesionales: Quien[] }) {
  if (profesionales.length === 0) return <span className="h-6" />

  return (
    <span className="flex items-center">
      {profesionales.map((profesional, index) => (
        <span
          key={profesional.id}
          aria-hidden
          // Fondo blanco y letra del color de la persona: el mismo tono sobre el
          // degradé de la tarjeta no se lee.
          style={{ color: profesional.hex, marginLeft: index > 0 ? -7 : 0 }}
          className="flex size-6 items-center justify-center rounded-full bg-white text-[10px] font-bold ring-2 ring-white/45"
        >
          {profesional.name.charAt(0)}
        </span>
      ))}
      <span className="-ml-[7px] flex size-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-neutral-700 ring-2 ring-white/35">
        {profesionales.length}
      </span>
      <span className="sr-only">
        {profesionales.map((p) => p.name).join(", ")}
      </span>
    </span>
  )
}
