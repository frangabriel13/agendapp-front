import { dateToStr, timeToMinutes } from "@/lib/time"
import { rangeBreakdown } from "@/features/reports/lib/revenue"
import type { Appointment, AppointmentStatus } from "@/types"
import { estaCancelado, noOcurrio } from "./status"

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
  PENDING_PAYMENT: 0,
  CONFIRMED: 0,
  ATTENDED: 0,
  NO_SHOW: 0,
  CANCELED_BY_CUSTOMER: 0,
  CANCELED_BY_BUSINESS: 0,
  RESCHEDULED: 0,
}

/** Cómo viene una semana: cuántos turnos, en qué estado y cuánta plata. */
export function weekStats(appointments: Appointment[], week: Date[]): WeekStats {
  const desde = dateToStr(week[0]!)
  const hasta = dateToStr(week[week.length - 1]!)
  const dentro = appointments.filter((a) => a.day >= desde && a.day <= hasta)

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
 * Las dos cancelaciones, la ausencia y el turno viejo de una reprogramación van
 * a la misma: las cuatro significan que no se hizo, y separarlas daría cuatro
 * columnas casi siempre vacías. La ficha de cada turno sigue diciendo cuál es.
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

const COLUMNAS: { key: BoardKey; incluye: (status: AppointmentStatus) => boolean }[] = [
  { key: "pending", incluye: (s) => s === "PENDING_PAYMENT" },
  { key: "confirmed", incluye: (s) => s === "CONFIRMED" },
  { key: "completed", incluye: (s) => s === "ATTENDED" },
  { key: "off", incluye: noOcurrio },
]

export function boardColumns(appointments: Appointment[], day: Date): BoardColumn[] {
  const key = dateToStr(day)
  const delDia = appointments
    .filter((a) => a.day === key)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  return COLUMNAS.map(({ key: columna, incluye }) => {
    const items = delDia.filter((a) => incluye(a.status))
    return {
      key: columna,
      items,
      minutos: items.reduce((t, a) => t + timeToMinutes(a.endTime) - timeToMinutes(a.startTime), 0),
      // `totalPriceCents`, el precio **congelado al reservar**: el del catálogo
      // pudo cambiar después y este turno no se movió.
      plata: items.reduce((t, a) => t + a.totalPriceCents, 0),
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
  if (appointment.day < hoy) return 1
  if (appointment.day > hoy) return 0

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
    // Los cancelados no cuentan como carga del día: nadie los va a atender. Un
    // `RESCHEDULED` tampoco —su hueco quedó libre—, pero un `NO_SHOW` sí: esa
    // hora estuvo tomada igual.
    if (estaCancelado(appointment.status) || appointment.status === "RESCHEDULED") continue
    const lista = porDia.get(appointment.day)
    if (lista) lista.push(appointment)
    else porDia.set(appointment.day, [appointment])
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
      professionals: [...new Set(delDia.map((a) => a.employee.id))],
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

/**
 * El rango de horas que tiene que dibujar la grilla para que no se corte nada.
 *
 * `HORA_INICIO`/`HORA_FIN` son el piso, no el techo. Con el rango fijo en 8–20,
 * un turno que arranca 19:55 y termina 20:50 se dibujaba fuera de la caja y se
 * cortaba solo. Los horarios los define cada negocio y pueden pasarse.
 *
 * Se redondea a la hora entera —para abajo al empezar, para arriba al terminar—
 * para que la primera y la última fila sigan siendo horas completas y la regla
 * de la izquierda no quede con medias horas.
 */
export function gridRange(
  appointments: Appointment[],
  piso = 8,
  techo = 20,
): { desde: number; hasta: number } {
  let desde = piso
  let hasta = techo

  for (const appointment of appointments) {
    desde = Math.min(desde, Math.floor(timeToMinutes(appointment.startTime) / 60))
    hasta = Math.max(hasta, Math.ceil(timeToMinutes(appointment.endTime) / 60))
  }

  // 24 no existe como hora de arranque de fila: un turno que cruza la medianoche
  // se corta ahí, que es lo correcto para la grilla de **un** día.
  return { desde: Math.max(0, desde), hasta: Math.min(24, hasta) }
}
