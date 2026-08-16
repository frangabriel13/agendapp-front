"use client"

import { useMemo } from "react"
import { CalendarDays, CalendarOff, RotateCw, TriangleAlert, UserPlus } from "lucide-react"
import { CtaLink } from "@/components/CtaLink"
import { Panel, PanelHeader, PanelLink, pillClasses } from "@/components/Panel"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { useEmployees } from "@/features/employees/hooks/useEmployees"
import { personColor, type PersonColor } from "@/features/employees/lib/palette"
import { ALL_ROLE_LABELS, fullName, initials } from "@/features/employees/lib/roles"
import type { Employee } from "@/types"
import { useTeamTimeOff } from "../hooks/useTeamTimeOff"
import {
  buildDays,
  describeAbsence,
  layoutAbsences,
  rangeLabel,
  type AbsenceSpan,
  type TimelineDay,
} from "../lib/timeline"

/** Dos semanas: entra la que se está viviendo y la que hay que planificar. */
const DAY_COUNT = 14

/**
 * Ancho de la columna de nombres.
 *
 * Va en una variable CSS y no en una constante de JS porque tres cosas tienen
 * que coincidir al pixel —el encabezado de días, cada fila y el cálculo de
 * dónde cae la línea de hoy— y además cambia por breakpoint: en un teléfono,
 * 13rem de nombres no dejan lugar para ningún día.
 */
const NAME_VARS = "[--tl-name:9.5rem] sm:[--tl-name:13rem]"
const NAME_WIDTH = "w-[var(--tl-name)]"

/** Debajo de esto las columnas dejan de leerse y conviene scrollear. */
const MIN_WIDTH = "min-w-[64rem]"

/**
 * Quién falta y cuándo, sobre dos semanas.
 *
 * Es lo primero del panel porque es la pregunta que no se puede contestar desde
 * la agenda: la agenda muestra los turnos que hay, no los días en que alguien no
 * va a estar para tomarlos.
 */
export function AbsenceTimeline() {
  const employees = useEmployees()

  const team = useMemo(
    () =>
      (employees.data ?? [])
        .filter((employee) => employee.isActive)
        .sort((a, b) => fullName(a).localeCompare(fullName(b), "es")),
    [employees.data],
  )

  const timeOff = useTeamTimeOff(team)

  // La ventana se fija al montar: si se recalculara en cada render, cruzar la
  // medianoche con el panel abierto correría el calendario debajo del mouse.
  const days = useMemo(() => buildDays(new Date(), DAY_COUNT), [])
  const todayIndex = days.findIndex((day) => day.isToday)

  const rows = team.map((employee) => ({
    employee,
    ...layoutAbsences(timeOff.byEmployee.get(employee.id) ?? [], days),
  }))
  const sinAusencias = rows.length > 0 && rows.every((row) => row.spans.length === 0)

  return (
    <Panel>
      <PanelHeader
        title="Ausencias del equipo"
        size="lg"
        action={
          <>
            <span className={cn(pillClasses, "hidden sm:inline-flex")}>
              <CalendarDays size={13} aria-hidden />
              {rangeLabel(days)}
            </span>
            <PanelLink href="/equipo">Ver equipo</PanelLink>
          </>
        }
      />

      {employees.isPending && <TimelineSkeleton />}

      {employees.isError && (
        <div className="px-5 pb-10 text-center">
          <p className="text-sm font-medium text-neutral-900">No pudimos cargar el equipo</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-neutral-500">
            {apiErrorMessage(employees.error, "Revisá tu conexión y probá de nuevo.")}
          </p>
          <button
            type="button"
            onClick={() => employees.refetch()}
            className={cn(pillClasses, "mt-4 hover:border-black/15 hover:text-neutral-900")}
          >
            <RotateCw size={13} aria-hidden />
            Reintentar
          </button>
        </div>
      )}

      {employees.data && team.length === 0 && (
        <div className="px-5 pb-10 text-center">
          <CalendarOff size={26} aria-hidden className="mx-auto mb-3 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-900">Todavía no hay nadie en el equipo</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-neutral-500">
            Cuando sumes gente vas a ver acá quién se toma vacaciones o pide licencia.
          </p>
          <CtaLink href="/equipo" size="sm" className="mt-5">
            <UserPlus size={15} />
            Invitar a alguien
          </CtaLink>
        </div>
      )}

      {team.length > 0 && (
        <>
          {/* El scroll horizontal vive acá adentro: el panel entero no se mueve. */}
          <div className="overflow-x-auto pb-5">
            <div className={cn(MIN_WIDTH, NAME_VARS, "pr-5")}>
              <div className="flex">
                <div className={cn(NAME_WIDTH, "sticky left-0 z-20 shrink-0 bg-white")} />
                <div className="grid flex-1 gap-1" style={columns(days.length)}>
                  {days.map((day) => (
                    <DayChip key={day.key} day={day} />
                  ))}
                </div>
              </div>

              <div className="relative mt-2 space-y-1.5">
                {todayIndex !== -1 && <TodayLine index={todayIndex} total={days.length} />}
                {rows.map(({ employee, spans, lanes }) => (
                  <Row key={employee.id} employee={employee} spans={spans} lanes={lanes} days={days} />
                ))}
              </div>
            </div>
          </div>

          {timeOff.isError && (
            <p className="flex items-center justify-center gap-2 px-5 pb-5 text-[13px] text-amber-700">
              <TriangleAlert size={14} aria-hidden />
              Algunas ausencias no se pudieron cargar.
            </p>
          )}

          {!timeOff.isPending && !timeOff.isError && sinAusencias && (
            <p className="px-5 pb-5 text-center text-[13px] text-neutral-400">
              Nadie tiene ausencias cargadas en estas dos semanas.
            </p>
          )}
        </>
      )}
    </Panel>
  )
}

/** Las columnas de días se reparten el ancho que sobra, todas iguales. */
function columns(count: number): React.CSSProperties {
  return { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }
}

function DayChip({ day }: { day: TimelineDay }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-1 py-1.5 text-center",
        day.isToday
          ? "border-violet-600 bg-violet-600 text-white shadow-[0_6px_16px_-8px_rgba(124,58,237,0.7)]"
          : day.isWeekend
            ? "border-black/[0.05] bg-neutral-100 text-neutral-400"
            : "border-black/[0.06] bg-white text-neutral-500",
      )}
    >
      <p className="text-[10px] leading-none tracking-wide uppercase">{day.short}</p>
      <p className={cn("mt-1 text-[12px] leading-none font-semibold", !day.isToday && "text-neutral-800")}>
        {day.number}
      </p>
    </div>
  )
}

interface RowProps {
  employee: Employee
  spans: AbsenceSpan[]
  lanes: number
  days: TimelineDay[]
}

function Row({ employee, spans, lanes, days }: RowProps) {
  const color = personColor(employee.id)

  return (
    <div className="flex">
      {/* Queda fija al scrollear: sin el nombre a la vista, las barras de la
          segunda semana no se sabe de quién son. */}
      <div className={cn(NAME_WIDTH, "sticky left-0 z-20 shrink-0 bg-white pr-3 pl-5")}>
        <div className="flex h-full items-center gap-2.5 rounded-xl border border-black/[0.06] bg-white px-2.5 py-2">
          <span
            aria-hidden
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
              color.avatar,
            )}
          >
            {initials(employee)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-neutral-900">{fullName(employee)}</p>
            <p className="truncate text-[11px] text-neutral-500">{ALL_ROLE_LABELS[employee.role]}</p>
          </div>
        </div>
      </div>

      <div
        className="grid flex-1 gap-1"
        style={{ ...columns(days.length), gridTemplateRows: `repeat(${lanes}, 2.75rem)` }}
      >
        {days.map((day, index) => (
          <div key={day.key} style={{ gridColumn: index + 1, gridRow: "1 / -1" }} className={cellClasses(day)} />
        ))}
        {spans.map((span) => (
          <AbsenceBar key={span.timeOff.id} span={span} color={color} />
        ))}
      </div>
    </div>
  )
}

/**
 * El fondo de un día.
 *
 * Los tres casos son excluyentes a propósito: si se acumularan las clases de
 * fondo, cuál gana lo decidiría el orden en que Tailwind las emite, que no es
 * el orden en que están escritas acá.
 */
function cellClasses(day: TimelineDay): string {
  return cn(
    "rounded-xl border",
    day.isToday
      ? "border-violet-200 bg-violet-50"
      : day.isWeekend
        ? "hatch-diagonal border-black/[0.05] bg-neutral-200/70"
        : "border-black/[0.05] bg-neutral-100",
  )
}

function AbsenceBar({ span, color }: { span: AbsenceSpan; color: PersonColor }) {
  const { title, detail } = describeAbsence(span.timeOff)
  const columnas = span.end - span.start + 1

  /**
   * En una sola columna no entra el motivo: recortado a "T…" parece un error de
   * maquetado, y con el ícono solo por lo menos se ve que ese día falta. El
   * texto completo queda en el `title` y para el lector de pantalla.
   */
  const showTitle = columnas > 1
  /** El chip de duración necesita todavía más lugar. */
  const showDetail = columnas > 2

  return (
    <div
      style={{ gridColumn: `${span.start + 1} / ${span.end + 2}`, gridRow: span.lane + 1 }}
      title={`${title} · ${detail}`}
      className={cn(
        "z-10 my-[3px] flex items-center gap-2 overflow-hidden text-white",
        "shadow-[0_6px_16px_-8px_rgba(0,0,0,0.45)]",
        showTitle ? "px-2.5" : "justify-center px-1",
        color.bar,
        // El borde recto avisa que la ausencia sigue más allá de lo que se ve.
        span.continuesBefore ? "rounded-l-none" : "rounded-l-xl",
        span.continuesAfter ? "rounded-r-none" : "rounded-r-xl",
      )}
    >
      <CalendarOff size={13} aria-hidden className="shrink-0 opacity-80" />
      {showTitle ? (
        <span className="truncate text-[12px] font-medium">{title}</span>
      ) : (
        <span className="sr-only">
          {title} · {detail}
        </span>
      )}
      {showDetail && (
        <span className={cn("ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", color.chip)}>
          {detail}
        </span>
      )}
    </div>
  )
}

function TodayLine({ index, total }: { index: number; total: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 border-l border-dashed border-violet-400"
      // El centro de la columna de hoy, sobre el ancho que queda después de la
      // columna de nombres.
      style={{ left: `calc(var(--tl-name) + (100% - var(--tl-name)) * ${(index + 0.5) / total})` }}
    />
  )
}

function TimelineSkeleton() {
  return (
    <div className="space-y-1.5 px-5 pb-5">
      <div className="h-10 animate-pulse rounded-xl bg-neutral-100" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-xl bg-neutral-100" />
      ))}
    </div>
  )
}
