"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { pillClasses } from "@/components/Panel"
import type { AppointmentStatus } from "@/types"
import type { Quien } from "../lib/display"
import { STATUS_LABELS, STATUS_ORDER } from "../lib/status"
import { avatarStyle } from "../lib/tone"

export type CalendarView = "month" | "week" | "day"

export const VIEW_LABELS: Record<CalendarView, string> = {
  month: "Mes",
  week: "Semana",
  day: "Día",
}

interface Props {
  view: CalendarView
  onView: (view: CalendarView) => void
  /** Qué período se está mirando. Lo arma quien conoce la vista. */
  title: string
  count: number
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  professionals: Quien[]
  professional: string
  onProfessional: (id: string) => void
  status: AppointmentStatus | "all"
  onStatus: (status: AppointmentStatus | "all") => void
}

export function CalendarToolbar({
  view,
  onView,
  title,
  count,
  onPrev,
  onNext,
  onToday,
  professionals,
  professional,
  onProfessional,
  status,
  onStatus,
}: Props) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onToday}
            className={cn(pillClasses, "px-3.5 py-1.5 text-[13px] hover:border-black/15")}
          >
            Hoy
          </button>
          <span className="flex items-center gap-0.5">
            <Flecha etiqueta="Período anterior" onClick={onPrev}>
              <ChevronLeft size={16} />
            </Flecha>
            <Flecha etiqueta="Período siguiente" onClick={onNext}>
              <ChevronRight size={16} />
            </Flecha>
          </span>
          <h2 className="truncate text-[17px] font-semibold tracking-tight text-neutral-900 first-letter:uppercase">
            {title}
          </h2>
          <span className="shrink-0 text-[13px] text-neutral-400">
            · {count} turno{count === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex gap-[3px] rounded-full border border-black/5 bg-neutral-100 p-[3px]">
          {(Object.keys(VIEW_LABELS) as CalendarView[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onView(key)}
              aria-pressed={view === key}
              className={cn(
                "rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors",
                view === key
                  ? "bg-violet-600 text-white shadow-[0_4px_12px_-6px_rgba(124,58,237,0.9)]"
                  : "text-neutral-500 hover:text-neutral-900",
              )}
            >
              {VIEW_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 px-5 pb-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Filtro activo={professional === "all"} onClick={() => onProfessional("all")}>
            Todos
          </Filtro>
          {professionals.map((p) => (
            <Filtro key={p.id} activo={professional === p.id} onClick={() => onProfessional(p.id)}>
              <span
                aria-hidden
                style={professional === p.id ? undefined : avatarStyle(p.hex)}
                className={cn(
                  "flex size-[17px] items-center justify-center rounded-full text-[9px] font-bold",
                  professional === p.id && "bg-white/25 text-white",
                )}
              >
                {p.name.charAt(0)}
              </span>
              {p.name}
            </Filtro>
          ))}
        </div>

        <span aria-hidden className="hidden h-5 w-px bg-black/[0.07] sm:block" />

        <div className="flex flex-wrap items-center gap-1.5">
          <Filtro activo={status === "all"} onClick={() => onStatus("all")}>
            Todos
          </Filtro>
          {STATUS_ORDER.map((s) => (
            <Filtro key={s} activo={status === s} onClick={() => onStatus(s)}>
              {STATUS_LABELS[s]}
            </Filtro>
          ))}
        </div>
      </div>
    </>
  )
}

function Flecha({
  etiqueta,
  onClick,
  children,
}: {
  etiqueta: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="inline-flex size-[30px] items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
    >
      {children}
    </button>
  )
}

/**
 * Píldora de filtro.
 *
 * La activa es negra y no del color del estado: los colores del calendario ya
 * significan quién atiende, y un filtro pintado del mismo verde que un bloque
 * haría dudar de si está seleccionado o si es una leyenda.
 */
function Filtro({
  activo,
  onClick,
  children,
}: {
  activo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        pillClasses,
        "gap-1.5 py-1 transition-colors",
        activo
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "text-neutral-500 hover:border-black/15 hover:text-neutral-900",
      )}
    >
      {children}
    </button>
  )
}
