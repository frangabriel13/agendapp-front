"use client"

import { Banknote, Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCents } from "@/features/catalog/lib/money"
import { cta } from "@/components/CtaLink"
import type { Appointment, AppointmentStatus } from "@/types"
import { boardColumns, type BoardKey } from "../lib/agenda"
import { avatarStyle } from "../lib/tone"
import { STATUS_LABELS, STATUS_PLURAL, noOcurrio } from "../lib/status"
import { customerName, employeeColor, employeeInitial, serviceName } from "../lib/display"

interface Props {
  appointments: Appointment[]
  day: Date
  now: Date
  onOpen: (appointment: Appointment) => void
  onChangeStatus: (appointment: Appointment, status: AppointmentStatus) => void
}

/**
 * Los nombres salen de `STATUS_PLURAL` y no de una lista propia: el filtro de la
 * agenda y el modal usan las mismas palabras, y dos nombres para el mismo estado
 * en la misma pantalla obligan a adivinar que son lo mismo.
 */
const COLUMNA: Record<BoardKey, { nombre: string; punto: string; chip: string; vacio: string }> = {
  pending: {
    nombre: STATUS_PLURAL.PENDING_PAYMENT,
    punto: "bg-amber-500",
    chip: "bg-amber-100 text-amber-700",
    vacio: "Ninguna seña pendiente.",
  },
  confirmed: {
    nombre: STATUS_PLURAL.CONFIRMED,
    punto: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-700",
    vacio: "Nada por delante.",
  },
  completed: {
    nombre: STATUS_PLURAL.ATTENDED,
    punto: "bg-slate-400",
    chip: "bg-slate-100 text-slate-600",
    vacio: "Todavía nadie.",
  },
  off: {
    nombre: "No se hicieron",
    punto: "bg-red-500",
    chip: "bg-red-100 text-red-700",
    vacio: "Ninguno, bien.",
  },
}

/**
 * El día de hoy repartido por estado.
 *
 * Contesta otra pregunta que el calendario: no *cuándo* es cada turno sino *qué
 * hay que hacer* — a quién llamar, quién está por entrar, qué se cayó. Por eso
 * la única columna con acción es la de los que faltan confirmar.
 */
export function DayBoard({ appointments, day, now, onOpen, onChangeStatus }: Props) {
  const columnas = boardColumns(appointments, day)

  return (
    <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-4">
      {columnas.map((columna) => {
        const meta = COLUMNA[columna.key]

        return (
          <section
            key={columna.key}
            className="flex min-h-[13.5rem] flex-col rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center gap-2 px-3.5 pt-3.5 pb-2">
              <span aria-hidden className={cn("size-2 rounded-full", meta.punto)} />
              <h3 className="text-[13px] font-semibold text-neutral-900">{meta.nombre}</h3>
              <span className={cn("rounded-full px-1.5 text-[11px] font-semibold", meta.chip)}>
                {columna.items.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col px-2">
              {columna.items.map((appointment) => (
                <Fila
                  key={appointment.id}
                  appointment={appointment}
                  now={now}
                  onOpen={() => onOpen(appointment)}
                />
              ))}

              {columna.items.length === 0 && (
                <p className="px-1.5 py-4 text-center text-[11px] text-neutral-400">{meta.vacio}</p>
              )}
            </div>

            <div className="flex items-center gap-2.5 border-t border-black/5 px-3.5 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                <Clock size={13} aria-hidden />
                {reloj(columna.minutos)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                <Banknote size={13} aria-hidden />
                {formatCents(columna.plata)}
              </span>

              {columna.key === "pending" && columna.items.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    columna.items.forEach((a) => onChangeStatus(a, "CONFIRMED"))
                  }
                  className={cn(cta({ size: "sm" }), "ml-auto px-3 py-1 text-[11px]")}
                >
                  <Check size={12} aria-hidden />
                  Confirmar {columna.items.length > 1 ? "todos" : ""}
                </button>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Fila({
  appointment,
  now,
  onOpen,
}: {
  appointment: Appointment
  now: Date
  onOpen: () => void
}) {
  const { status, startTime, endTime } = appointment
  const enCurso = status === "CONFIRMED" && startTime <= horaDe(now) && endTime > horaDe(now)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-neutral-50"
    >
      <span
        aria-hidden
        style={avatarStyle(employeeColor(appointment))}
        className="flex size-[30px] shrink-0 items-center justify-center rounded-full text-xs font-bold"
      >
        {employeeInitial(appointment)}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[12.5px] font-medium text-neutral-900",
            noOcurrio(status) && "text-neutral-500 line-through",
          )}
        >
          {customerName(appointment)}
        </span>
        <span className="block truncate text-[11px] text-neutral-500">
          {startTime} · {serviceName(appointment)}
        </span>
      </span>

      {status === "ATTENDED" && (
        <span
          aria-hidden
          className="flex size-[19px] shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
        >
          <Check size={11} strokeWidth={3} />
        </span>
      )}
      {status === "NO_SHOW" && (
        <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
          {STATUS_LABELS.NO_SHOW}
        </span>
      )}
      {enCurso && (
        <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
          en curso
        </span>
      )}
    </button>
  )
}

function horaDe(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

/** "1 h 45" y "45′": el pie de la columna compite por poco lugar. */
function reloj(minutos: number): string {
  if (minutos < 60) return `${minutos}′`
  if (minutos % 60 === 0) return `${minutos / 60} h`
  return `${Math.floor(minutos / 60)} h ${minutos % 60}`
}
