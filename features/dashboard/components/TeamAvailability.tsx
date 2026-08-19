"use client"

import { useMemo } from "react"
import { CalendarDays, CalendarOff, RotateCw, TriangleAlert, User, UserPlus } from "lucide-react"
import { CtaLink } from "@/components/CtaLink"
import { Panel, PanelHeader, PanelLink, pillClasses } from "@/components/Panel"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { useBranches } from "@/features/branches/hooks/useBranches"
import { useEmployees } from "@/features/employees/hooks/useEmployees"
import { personColor } from "@/features/employees/lib/palette"
import { ALL_ROLE_LABELS, fullName } from "@/features/employees/lib/roles"
import type { Appointment, Employee } from "@/types"
import { useBranchCalendars } from "../hooks/useBranchCalendars"
import { useTeamSchedules } from "../hooks/useTeamSchedules"
import { useTeamTimeOff } from "../hooks/useTeamTimeOff"
import {
  absenceMinutesByDay,
  absenceRange,
  bookedMinutesByDay,
  dayStatus,
  describeAbsence,
  layoutAbsences,
  minutesByWeekday,
  type AbsenceOnDay,
  type AbsenceSpan,
  type DayStatus,
} from "../lib/availability"
import { closedDays, type ClosedDay } from "../lib/openDays"
import { appointmentsByEmployee } from "../lib/roster"
import { buildDays, rangeLabel, type TimelineDay } from "../lib/timeline"

/** Dos semanas: entra la que se está viviendo y la que hay que planificar. */
const DAY_COUNT = 14

/**
 * Ancho de la columna de nombres.
 *
 * Va en una variable CSS y no en una constante de JS porque el encabezado de
 * días y cada fila tienen que coincidir al pixel, y además cambia por
 * breakpoint: en un teléfono, 13rem de nombres no dejan lugar para ningún día.
 */
const NAME_VARS = "[--tl-name:9.5rem] sm:[--tl-name:13rem]"
const NAME_WIDTH = "w-[var(--tl-name)]"

/** Debajo de esto las columnas dejan de leerse y conviene scrollear. */
const MIN_WIDTH = "min-w-[68rem]"

/**
 * Cómo viene cada persona del equipo, día por día, sobre dos semanas.
 *
 * Cada celda dice de cuándo a cuándo trabaja esa persona y cuánto tiene tomado.
 * Encima van las ausencias, y las columnas en que el negocio no abre se rayan.
 *
 * Es lo primero del panel porque es la pregunta que la agenda no contesta: la
 * agenda muestra los turnos que hay, no quién tiene lugar para tomar el próximo.
 */
export function TeamAvailability({ appointments }: { appointments: Appointment[] }) {
  const employees = useEmployees()
  const branches = useBranches()

  const team = useMemo(
    () =>
      (employees.data ?? [])
        .filter((employee) => employee.isActive)
        .sort((a, b) => fullName(a).localeCompare(fullName(b), "es")),
    [employees.data],
  )
  const activas = useMemo(
    () => (branches.data ?? []).filter((branch) => branch.isActive),
    [branches.data],
  )

  const timeOff = useTeamTimeOff(team)
  const schedules = useTeamSchedules(team)
  const calendars = useBranchCalendars(activas)

  // La ventana se fija al montar: si se recalculara en cada render, cruzar la
  // medianoche con el panel abierto correría el calendario debajo del mouse.
  const days = useMemo(() => buildDays(new Date(), DAY_COUNT), [])

  const cerrados = closedDays(days, calendars.hours, calendars.special)
  const porEmpleado = appointmentsByEmployee(team, appointments)

  const rows = team.map((employee) => {
    const shifts = schedules.byEmployee.get(employee.id) ?? []
    const ausencias = absenceMinutesByDay(timeOff.byEmployee.get(employee.id) ?? [], days, shifts)

    return {
      employee,
      shifts,
      ausencias,
      capacidad: minutesByWeekday(shifts),
      ocupado: bookedMinutesByDay(porEmpleado.get(employee.id) ?? []),
      ...layoutAbsences(ausencias, days),
    }
  })

  return (
    <Panel className="shrink-0">
      <PanelHeader
        title="Disponibilidad del equipo"
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

      {team.length > 0 && <Leyenda />}

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
            Cuando sumes gente vas a ver acá quién trabaja cada día y cuánto tiene tomado.
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
                    <DayChip key={day.key} day={day} cerrado={cerrados.get(day.key)} />
                  ))}
                </div>
              </div>

              <div className="mt-2 space-y-1.5">
                {rows.map((row) => (
                  <Row key={row.employee.id} {...row} days={days} cerrados={cerrados} />
                ))}
              </div>
            </div>
          </div>

          {(timeOff.isError || schedules.isError) && (
            <p className="flex items-center justify-center gap-2 px-5 pb-5 text-[13px] text-amber-700">
              <TriangleAlert size={14} aria-hidden />
              Faltan datos de alguna persona: horarios o ausencias que no se pudieron cargar.
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

/**
 * Qué significa cada cosa.
 *
 * Va arriba de la grilla y no en un tooltip: una fila de celdas de colores hay
 * que descifrarla, y nadie lo hace — se la saltea.
 */
function Leyenda() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 pb-4 text-[11px] text-neutral-500">
      <Item muestra="bg-emerald-500">con lugar</Item>
      <Item muestra="bg-orange-500">casi sin lugar</Item>
      <Item muestra="bg-violet-500">ausente</Item>
      <Item muestra="hatch-diagonal bg-neutral-200 border border-black/[0.05]">cerrado o feriado</Item>
      <Item muestra="border border-dashed border-black/15 bg-white">ese día no trabaja</Item>
    </div>
  )
}

function Item({ muestra, children }: { muestra: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className={cn("size-2.5 shrink-0 rounded-[4px]", muestra)} />
      {children}
    </span>
  )
}

function DayChip({ day, cerrado }: { day: TimelineDay; cerrado?: ClosedDay }) {
  return (
    <div
      title={cerrado?.nombre}
      className={cn(
        "rounded-xl border px-1 py-1.5 text-center",
        day.isToday
          ? "border-violet-600 bg-violet-600 text-white shadow-[0_6px_16px_-8px_rgba(124,58,237,0.7)]"
          : cerrado
            ? "border-black/[0.05] bg-neutral-200/70 text-neutral-400"
            : "border-black/[0.06] bg-white text-neutral-500",
      )}
    >
      <p className="text-[10px] leading-none tracking-wide uppercase">{day.short}</p>
      <p className={cn("mt-1 text-[12px] leading-none font-semibold", !day.isToday && "text-neutral-800")}>
        {day.number}
      </p>
      {/* Un feriado y un domingo se ven igual pero no se explican igual. */}
      {cerrado?.motivo === "especial" && (
        <p className="mt-0.5 truncate text-[8px] tracking-wide text-amber-700 uppercase">
          {cerrado.nombre ?? "Feriado"}
        </p>
      )}
    </div>
  )
}

interface RowProps {
  employee: Employee
  days: TimelineDay[]
  spans: AbsenceSpan[]
  lanes: number
  ausencias: Map<string, AbsenceOnDay>
  capacidad: Map<number, number>
  ocupado: Map<string, number>
  shifts: { dayOfWeek: number; startsAt: string; endsAt: string }[]
  cerrados: Map<string, ClosedDay>
}

function Row({
  employee,
  days,
  spans,
  lanes,
  ausencias,
  capacidad,
  ocupado,
  shifts,
  cerrados,
}: RowProps) {
  const color = personColor(employee.id)
  const tapados = new Set(spans.flatMap((s) => range(s.start, s.end)))

  return (
    <div className="flex">
      {/* Queda fija al scrollear: sin el nombre a la vista, las barras de la
          segunda semana no se sabe de quién son. */}
      <div className={cn(NAME_WIDTH, "sticky left-0 z-20 shrink-0 bg-white pr-3 pl-5")}>
        <div className="flex h-full items-center gap-2.5 rounded-xl border border-black/[0.06] bg-white px-2.5 py-2">
          {/* Marcador de foto: `avatarUrl` existe en la API pero todavía no hay
              forma de subir una desde el panel. El aro lleva el color de la
              persona, que es lo que la identifica en la grilla. */}
          <span
            aria-hidden
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full ring-2",
              color.avatar,
              color.ring,
            )}
          >
            <User size={15} />
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
        {days.map((day, index) =>
          // La barra ocupa el lugar de la celda en vez de apoyarse encima: dos
          // rectángulos redondeados anidados se leen como una tarjeta sobre otra.
          tapados.has(index) ? null : (
            <Celda
              key={day.key}
              column={index + 1}
              cerrado={cerrados.has(day.key)}
              shifts={shifts.filter((shift) => shift.dayOfWeek === day.dayOfWeek)}
              capacidad={capacidad.get(day.dayOfWeek) ?? 0}
              ocupado={ocupado.get(day.key) ?? 0}
              ausencia={ausencias.get(day.key)}
              tieneHorarios={shifts.length > 0}
            />
          ),
        )}
        {spans.map((span) => (
          <AbsenceBar key={`${span.timeOff.id}-${span.start}`} span={span} />
        ))}
      </div>
    </div>
  )
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

interface CeldaProps {
  column: number
  cerrado: boolean
  shifts: { startsAt: string; endsAt: string }[]
  capacidad: number
  ocupado: number
  ausencia?: AbsenceOnDay
  tieneHorarios: boolean
}

/**
 * Un día de una persona: su horario y cuánto tiene tomado.
 *
 * El horario es dato duro y va escrito. La barra de abajo es la lectura rápida:
 * verde lo que ya tomó, violeta lo que se lleva una ausencia parcial, y lo que
 * queda en gris es el lugar libre.
 */
function Celda({
  column,
  cerrado,
  shifts,
  capacidad,
  ocupado,
  ausencia,
  tieneHorarios,
}: CeldaProps) {
  const marco = "flex flex-col items-center justify-center gap-1 rounded-xl border px-1 text-center"
  const posicion = { gridColumn: column, gridRow: "1 / -1" }

  // El negocio cerrado manda sobre todo lo demás: no importa el horario de nadie.
  if (cerrado) {
    return (
      <div
        style={posicion}
        className="hatch-diagonal rounded-xl border border-black/[0.05] bg-neutral-200/70"
      />
    )
  }

  const bloqueado = ausencia?.minutos ?? 0
  const estado: DayStatus = dayStatus({
    capacidad,
    ocupado: ocupado + bloqueado,
    tieneHorarios,
  })

  if (estado === "sin-horario" || estado === "no-trabaja") {
    return (
      <div
        style={posicion}
        className={cn(marco, "border-dashed border-black/10 bg-white text-[10px] text-neutral-400")}
      >
        {estado === "sin-horario" && <span>Sin horario</span>}
      </div>
    )
  }

  const porcentaje = (minutos: number) => `${Math.min((minutos / capacidad) * 100, 100)}%`

  return (
    <div
      style={posicion}
      title={ausencia ? `Ausente ${absenceRange(ausencia.timeOff)}` : undefined}
      className={cn(
        marco,
        "bg-white",
        // El día con una ausencia parcial se marca en el borde: el tramo violeta
        // de la barra mide 4px de alto y escaneando la grilla no se ve.
        //
        // Hoy no lleva marca en la celda: el chip violeta del encabezado ya
        // señala la columna entera, y dos violetas distintos en la misma grilla
        // harían dudar de cuál es cuál.
        ausencia ? "border-violet-300" : "border-black/[0.06]",
      )}
    >
      <span className="text-[11px] leading-none font-medium text-neutral-700">{jornada(shifts)}</span>

      <span aria-hidden className="flex h-1 w-full overflow-hidden rounded-full bg-neutral-200">
        <span
          className={cn("h-full", estado === "llena" ? "bg-orange-500" : "bg-emerald-500")}
          style={{ width: porcentaje(ocupado) }}
        />
        <span className="h-full bg-violet-500" style={{ width: porcentaje(bloqueado) }} />
      </span>

      <span className="sr-only">
        {estado === "llena" ? "Sin lugar" : estado === "vacia" ? "Sin turnos" : "Con lugar"}
        {ausencia ? `, ausente ${absenceRange(ausencia.timeOff)}` : ""}
      </span>
    </div>
  )
}

/**
 * De cuándo a cuándo está esa persona.
 *
 * Con dos tramos en el día —mañana y tarde— muestra las puntas y no el primero:
 * "09–13" cuando en realidad se queda hasta las 20 es peor que no decir nada.
 * El corte del mediodía se ve igual en la barra de ocupación.
 */
function jornada(shifts: { startsAt: string; endsAt: string }[]): string {
  if (shifts.length === 0) return ""

  const desde = shifts.reduce((min, s) => (s.startsAt < min ? s.startsAt : min), shifts[0]!.startsAt)
  const hasta = shifts.reduce((max, s) => (s.endsAt > max ? s.endsAt : max), shifts[0]!.endsAt)

  // "09:00" ocupa demasiado en una columna de 60px.
  const corto = (hora: string) => (hora.endsWith(":00") ? hora.slice(0, 2) : hora)
  return `${corto(desde)}–${corto(hasta)}`
}

function AbsenceBar({ span }: { span: AbsenceSpan }) {
  const { title, detail } = describeAbsence(span)
  const columnas = span.end - span.start + 1

  /**
   * En una sola columna no entra el motivo: recortado a "T…" parece un error de
   * maquetado, y con el ícono solo por lo menos se ve que ese día falta. El
   * texto completo queda en el `title` y para el lector de pantalla.
   */
  const showTitle = columnas > 1
  const showDetail = columnas > 2

  return (
    <div
      style={{ gridColumn: `${span.start + 1} / ${span.end + 2}`, gridRow: span.lane + 1 }}
      title={`${title} · ${detail}`}
      className={cn(
        "z-10 flex items-center gap-2 overflow-hidden text-white",
        "bg-gradient-to-r from-violet-500 to-violet-600",
        "shadow-[0_6px_16px_-8px_rgba(0,0,0,0.45)]",
        showTitle ? "px-2.5" : "justify-center px-1",
        // El borde recto avisa que la ausencia sigue más allá de la barra.
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
        <span className="ml-auto shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium">
          {detail}
        </span>
      )}
    </div>
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
