import { dateToStr, timeToMinutes } from "@/lib/time"
import { rangeBreakdown } from "@/features/reports/lib/revenue"
import type { Appointment, AppointmentStatus } from "@/types"

export interface WeekStats {
  /** Todos los turnos de la semana, cancelados incluidos. */
  total: number
  porEstado: Record<AppointmentStatus, number>
  /** Plata de lo atendido y lo confirmado, con la regla de `revenue.ts`. */
  agendado: number
  /** Lo reservado sin confirmar, que **no** entra en `agendado`. */
  sinConfirmar: number
}

const ESTADOS_VACIOS: Record<AppointmentStatus, number> = {
  pending: 0,
  confirmed: 0,
  completed: 0,
  cancelled: 0,
  no_show: 0,
}

/** Cómo viene una semana: cuántos turnos, en qué estado y cuánta plata. */
export function weekStats(appointments: Appointment[], week: Date[]): WeekStats {
  const desde = dateToStr(week[0]!)
  const hasta = dateToStr(week[week.length - 1]!)
  const dentro = appointments.filter((a) => a.date >= desde && a.date <= hasta)

  const porEstado = { ...ESTADOS_VACIOS }
  for (const appointment of dentro) porEstado[appointment.status]++

  const plata = rangeBreakdown(appointments, desde, hasta)

  return {
    total: dentro.length,
    porEstado,
    agendado: plata.total,
    sinConfirmar: plata.sinConfirmar,
  }
}

/**
 * Las cuatro columnas del día.
 *
 * `cancelled` y `no_show` van juntas: las dos significan que el turno no se
 * hizo, y separarlas daría una quinta columna casi siempre vacía. La ficha de
 * cada turno sigue diciendo cuál de las dos es.
 */
export type BoardKey = "pending" | "confirmed" | "completed" | "off"

export interface BoardColumn {
  key: BoardKey
  items: Appointment[]
  /** Minutos que se llevan entre todos. */
  minutos: number
  /** Plata del grupo, sin la regla de facturación: acá interesa el volumen. */
  plata: number
}

const COLUMNAS: { key: BoardKey; estados: AppointmentStatus[] }[] = [
  { key: "pending", estados: ["pending"] },
  { key: "confirmed", estados: ["confirmed"] },
  { key: "completed", estados: ["completed"] },
  { key: "off", estados: ["cancelled", "no_show"] },
]

export function boardColumns(appointments: Appointment[], day: Date): BoardColumn[] {
  const key = dateToStr(day)
  const delDia = appointments
    .filter((a) => a.date === key)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  return COLUMNAS.map(({ key: columna, estados }) => {
    const items = delDia.filter((a) => estados.includes(a.status))
    return {
      key: columna,
      items,
      minutos: items.reduce((t, a) => t + timeToMinutes(a.endTime) - timeToMinutes(a.startTime), 0),
      plata: items.reduce((t, a) => t + a.service.price, 0),
    }
  })
}

/**
 * Cuánto del turno ya transcurrió, de 0 a 1.
 *
 * Es lo que llena la barrita al pie del bloque: los días pasados llenos, el que
 * está ocurriendo a medias y lo que viene vacío. Da de un vistazo dónde está
 * parado el día sin tener que leer las horas.
 */
export function elapsedFraction(appointment: Appointment, now: Date): number {
  const hoy = dateToStr(now)
  if (appointment.date < hoy) return 1
  if (appointment.date > hoy) return 0

  const inicio = timeToMinutes(appointment.startTime)
  const fin = timeToMinutes(appointment.endTime)
  // Un turno de duración cero no existe, pero dividir por cero sí rompe.
  if (fin <= inicio) return 1

  const ahora = now.getHours() * 60 + now.getMinutes()
  return Math.min(Math.max((ahora - inicio) / (fin - inicio), 0), 1)
}

/** ¿Hoy cae dentro de estos días? Es lo que decide si se dibuja la línea de ahora. */
export function containsToday(days: Date[], now: Date): boolean {
  const hoy = dateToStr(now)
  return days.some((day) => dateToStr(day) === hoy)
}

export interface MonthCell {
  key: string
  day: number
  /** Fuera del mes que se está mirando: la fila que completa la semana. */
  inMonth: boolean
  isToday: boolean
  /** Domingo. Se raya, como en el calendario de Inicio. */
  isSunday: boolean
  count: number
  /** Ids de quienes atienden ese día, sin repetir y en orden de aparición. */
  professionals: string[]
}

/** Cuántas filas tiene la grilla del mes. Seis entran cualquier mes de 31 días. */
const SEMANAS_DEL_MES = 6

/**
 * La grilla del mes, de lunes a domingo y siempre de seis filas.
 *
 * Alto fijo a propósito: si la grilla creciera o se achicara según el mes, pasar
 * de página movería todo lo que está abajo.
 */
export function monthCells(reference: Date, appointments: Appointment[], now: Date): MonthCell[] {
  const primero = new Date(reference.getFullYear(), reference.getMonth(), 1)
  // `getDay()` da 0 el domingo; la grilla arranca el lunes.
  const desplazamiento = (primero.getDay() + 6) % 7
  const hoy = dateToStr(now)

  const porDia = new Map<string, Appointment[]>()
  for (const appointment of appointments) {
    // Los cancelados no cuentan como carga del día: nadie los va a atender.
    if (appointment.status === "cancelled") continue
    const lista = porDia.get(appointment.date)
    if (lista) lista.push(appointment)
    else porDia.set(appointment.date, [appointment])
  }

  return Array.from({ length: SEMANAS_DEL_MES * 7 }, (_, index) => {
    const date = new Date(
      reference.getFullYear(),
      reference.getMonth(),
      index - desplazamiento + 1,
    )
    const key = dateToStr(date)
    const delDia = porDia.get(key) ?? []

    return {
      key,
      day: date.getDate(),
      inMonth: date.getMonth() === reference.getMonth(),
      isToday: key === hoy,
      isSunday: date.getDay() === 0,
      count: delDia.length,
      professionals: [...new Set(delDia.map((a) => a.professionalId))],
    }
  })
}

/**
 * El día más cargado de la grilla, para medir la barra de los demás contra él.
 *
 * Se mide contra el pico del mes y no contra un cupo inventado: la agenda no
 * conoce los horarios del equipo —eso lo sabe el calendario de Inicio, que sí
 * los pide—, así que un "70% lleno" acá sería un número sin respaldo.
 */
export function busiestDay(cells: MonthCell[]): number {
  return cells.reduce((max, cell) => (cell.count > max ? cell.count : max), 0)
}
