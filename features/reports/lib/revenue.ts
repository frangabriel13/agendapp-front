import { dateToStr } from "@/lib/time"
import type { Appointment, AppointmentStatus } from "@/types"

/**
 * Estados que suman plata.
 *
 * `ATTENDED` ya se atendió: es plata hecha. `CONFIRMED` está agendado y en pie,
 * así que se cuenta como plata que va a entrar. Los otros cinco no suman:
 * `PENDING_PAYMENT` todavía puede no confirmarse, y las cancelaciones, la
 * ausencia y el turno viejo de una reprogramación no ocurrieron.
 *
 * **Todos los montos van en centavos**, como los devuelve la API. La conversión
 * a pesos es cosa de la pantalla, con `formatCents`.
 */
const ATENDIDO: AppointmentStatus = "ATTENDED"
const AGENDADO: AppointmentStatus = "CONFIRMED"

export interface Revenue {
  /** Todo lo que suma: atendido + agendado. */
  total: number
  /** Ya se atendió. */
  atendido: number
  /** Agendado y en pie, todavía no ocurrió. */
  agendado: number
  /** Reservado pero sin confirmar: **no** entra en `total`. */
  sinConfirmar: number
  /** Cuántos turnos hay detrás de `total`. */
  turnos: number
  /** `total / turnos`, redondeado. 0 si no hay turnos. */
  ticketPromedio: number
}

/** ¿El turno cae en el mes "YYYY-MM"? */
function esDelMes(appointment: Appointment, month: string): boolean {
  return appointment.day.startsWith(month)
}

function esFacturable(appointment: Appointment): boolean {
  return appointment.status === ATENDIDO || appointment.status === AGENDADO
}

/** El día del mes de un turno, sin construir un `Date`. */
function diaDe(appointment: Appointment): number {
  return Number(appointment.day.slice(8, 10))
}

function totalDe(appointments: Appointment[]): number {
  return appointments.reduce((total, appointment) => total + appointment.totalPriceCents, 0)
}

/**
 * La facturación de un mes.
 *
 * Recibe los turnos en vez de pedirlos: hoy salen de datos de ejemplo y mañana
 * de la API, y la cuenta es la misma.
 */
export function monthRevenue(appointments: Appointment[], month: string): Revenue {
  return desglose(appointments.filter((appointment) => esDelMes(appointment, month)))
}

/**
 * El mismo desglose, pero entre dos días de calendario.
 *
 * Existe aparte de `rangeRevenue` porque la agenda necesita ver lo pendiente al
 * lado de lo agendado, y esa separación es justamente la regla de plata de la
 * app: pedirla desde afuera sería recopiar acá qué estado suma y cuál no.
 */
export function rangeBreakdown(appointments: Appointment[], from: string, to: string): Revenue {
  return desglose(appointments.filter((a) => a.day >= from && a.day <= to))
}

function desglose(appointments: Appointment[]): Revenue {
  const sumar = (status: AppointmentStatus) =>
    appointments
      .filter((appointment) => appointment.status === status)
      .reduce((total, appointment) => total + appointment.totalPriceCents, 0)

  const atendido = sumar(ATENDIDO)
  const agendado = sumar(AGENDADO)
  const total = atendido + agendado
  const turnos = appointments.filter(esFacturable).length

  return {
    total,
    atendido,
    agendado,
    sinConfirmar: sumar("PENDING_PAYMENT"),
    turnos,
    // Sin turnos el promedio no es cero: no existe. Devolver 0 evita un NaN en
    // pantalla y se lee igual de bien con la etiqueta al lado.
    ticketPromedio: turnos === 0 ? 0 : Math.round(total / turnos),
  }
}

export interface RevenueSlice {
  label: string
  total: number
  turnos: number
  /** Porción del total, de 0 a 1. Para dibujar la barra. */
  share: number
}

/** Un renglón del corte: a qué se le atribuye cuánta plata. */
interface Renglon {
  label: string
  cents: number
}

/**
 * Reparte la facturación del mes de mayor a menor.
 *
 * `renglones` devuelve **una lista** y no un solo par porque un turno puede
 * encadenar varios servicios con el mismo profesional. Por profesional es un
 * renglón; por servicio, uno por cada uno con su propio precio congelado.
 */
function sliceBy(
  appointments: Appointment[],
  month: string,
  renglones: (appointment: Appointment) => Renglon[],
): RevenueSlice[] {
  const acumulado = new Map<string, { total: number; turnos: number }>()

  for (const appointment of appointments) {
    if (!esDelMes(appointment, month)) continue
    if (appointment.status !== ATENDIDO && appointment.status !== AGENDADO) continue

    for (const { label, cents } of renglones(appointment)) {
      const previo = acumulado.get(label) ?? { total: 0, turnos: 0 }
      acumulado.set(label, { total: previo.total + cents, turnos: previo.turnos + 1 })
    }
  }

  const total = [...acumulado.values()].reduce((suma, item) => suma + item.total, 0)

  return [...acumulado.entries()]
    .map(([label, item]) => ({
      label,
      total: item.total,
      turnos: item.turnos,
      // Contra el total del corte, no contra el máximo: una barra al 100% tiene
      // que significar "se lleva todo", no "es el más grande de la lista".
      share: total === 0 ? 0 : item.total / total,
    }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "es"))
}

/**
 * Por servicio.
 *
 * **Cuenta renglones, no turnos**: un turno de corte + color suma en los dos, con
 * el precio que cada uno tenía al reservarse. Por eso la suma de `turnos` de este
 * corte puede ser mayor que la cantidad de turnos del mes, y está bien: la
 * pregunta es "cuánto trajo cada servicio", no "cuántas veces vino gente".
 */
export function revenueByService(appointments: Appointment[], month: string): RevenueSlice[] {
  return sliceBy(appointments, month, (appointment) =>
    appointment.services.map((service) => ({ label: service.name, cents: service.priceCents })),
  )
}

export function revenueByProfessional(appointments: Appointment[], month: string): RevenueSlice[] {
  return sliceBy(appointments, month, (appointment) => [
    { label: appointment.employee.name, cents: appointment.totalPriceCents },
  ])
}

/** "Agosto" a partir de "2026-08". Para titular el período. */
export function monthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number)
  const texto = new Date(year!, monthNumber! - 1, 1).toLocaleDateString("es-AR", { month: "long" })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * Con menos días transcurridos que esto, proyectar el mes es adivinar: dos
 * jornadas flojas o dos buenas mueven el resultado a cualquier lado.
 */
const DIAS_MINIMOS_PARA_PROYECTAR = 5

export interface MonthOutlook {
  /** Mes que se está mirando, "YYYY-MM". */
  mes: string
  /** Mes anterior, "YYYY-MM". */
  mesAnterior: string
  /** Facturado en lo que va del mes, hasta hoy inclusive. */
  actual: number
  /**
   * Lo mismo del mes anterior **hasta el mismo día**.
   *
   * `null` cuando no hay ni un turno registrado en ese mes: mostrar "$0" ahí
   * diría que el negocio no facturó nada, cuando lo que pasa es que todavía no
   * estaba usando la app.
   */
  anteriorAlMismoDia: number | null
  /** Lo que cerró el mes anterior, completo. `null` por el mismo motivo. */
  anteriorCierre: number | null
  /**
   * Variación de `actual` contra `anteriorAlMismoDia`, como fracción: `0.15` es
   * +15%. `null` si no hay con qué comparar, o si el mes anterior fue cero —una
   * división por cero no es "creció infinito", es que no se puede medir—.
   */
  variacion: number | null
  proyeccion: {
    /** Facturado + agendado + estimación de los días que quedan vacíos. */
    total: number
    /** Ya agendado para lo que resta del mes. Es dato, no estimación. */
    agendado: number
    /** Cuántos días que faltan no tienen nada agendado y se estimaron. */
    diasEstimados: number
    /** Variación contra `anteriorCierre`. */
    variacion: number | null
    /** Hay tan pocos días transcurridos que el número todavía no dice nada. */
    preliminar: boolean
  }
}

/** Variación entre dos montos. `null` cuando la base no sirve para dividir. */
function variacionEntre(actual: number, base: number | null): number | null {
  if (base === null || base <= 0) return null
  return actual / base - 1
}

/**
 * Cómo viene el mes: contra el anterior y hacia dónde va.
 *
 * **La comparación es contra el mismo tramo del mes anterior, no contra su
 * cierre.** Medir 18 días contra 31 hace que el negocio parezca en caída todos
 * los meses hasta el día 30.
 *
 * **La proyección no extrapola a ciegas.** Una estética sabe parte de su futuro:
 * los turnos del resto del mes ya están agendados. Así que solo se estiman los
 * días que quedan **sin nada agendado**, al ritmo de lo que va del mes.
 */
export function monthOutlook(appointments: Appointment[], today: Date): MonthOutlook {
  const mes = dateToStr(today).slice(0, 7)
  const mesAnterior = dateToStr(new Date(today.getFullYear(), today.getMonth() - 1, 1)).slice(0, 7)
  const dia = today.getDate()
  // Día 0 del mes siguiente = último día de este mes.
  const diasDelMes = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

  const facturables = appointments.filter(esFacturable)
  const delMes = facturables.filter((appointment) => esDelMes(appointment, mes))

  const actual = totalDe(delMes.filter((appointment) => diaDe(appointment) <= dia))
  const porVenir = delMes.filter((appointment) => diaDe(appointment) > dia)
  const agendado = totalDe(porVenir)

  const hayHistorial = appointments.some((appointment) => esDelMes(appointment, mesAnterior))
  const delAnterior = facturables.filter((appointment) => esDelMes(appointment, mesAnterior))
  const anteriorAlMismoDia = hayHistorial
    ? totalDe(delAnterior.filter((appointment) => diaDe(appointment) <= dia))
    : null
  const anteriorCierre = hayHistorial ? totalDe(delAnterior) : null

  // Los días que faltan y ya tienen algo agendado no se estiman: su plata ya
  // está contada en `agendado`, y sumarles el ritmo la contaría dos veces.
  const conAgenda = new Set(porVenir.map(diaDe))
  let diasEstimados = 0
  for (let d = dia + 1; d <= diasDelMes; d++) {
    if (!conAgenda.has(d)) diasEstimados++
  }

  const ritmoDiario = actual / dia
  const estimado = Math.round(ritmoDiario * diasEstimados)
  const total = actual + agendado + estimado

  return {
    mes,
    mesAnterior,
    actual,
    anteriorAlMismoDia,
    anteriorCierre,
    variacion: variacionEntre(actual, anteriorAlMismoDia),
    proyeccion: {
      total,
      agendado,
      diasEstimados,
      variacion: variacionEntre(total, anteriorCierre),
      preliminar: dia < DIAS_MINIMOS_PARA_PROYECTAR,
    },
  }
}

export interface RevenueSnapshot {
  total: number
  turnos: number
}

function snapshotDe(appointments: Appointment[]): RevenueSnapshot {
  const facturables = appointments.filter(esFacturable)
  return { total: totalDe(facturables), turnos: facturables.length }
}

/** Facturado entre dos días de calendario, los dos incluidos. */
export function rangeRevenue(
  appointments: Appointment[],
  from: string,
  to: string,
): RevenueSnapshot {
  // "YYYY-MM-DD" ordena igual como texto que como fecha: alcanza con comparar
  // las cadenas, sin construir un `Date` por turno.
  return snapshotDe(appointments.filter((a) => a.day >= from && a.day <= to))
}

/** Lo facturado en un día puntual. */
export function dayRevenue(appointments: Appointment[], day: Date): RevenueSnapshot {
  const key = dateToStr(day)
  return rangeRevenue(appointments, key, key)
}

/**
 * Lo que va de esta semana: del lunes a hoy, los dos incluidos.
 *
 * Corta en hoy y no el domingo: es "lo que va", no "lo que va a haber". Los
 * turnos ya agendados para el jueves son plata que todavía no entró, y sumarlos
 * acá haría que el número creciera solo por reservar.
 *
 * La semana arranca el lunes, igual que el calendario de ausencias y la agenda.
 */
export function weekToDateRevenue(appointments: Appointment[], today: Date): RevenueSnapshot {
  const lunes = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // `getDay()` numera 0 = domingo, así que el lunes está a `(día + 6) % 7` atrás.
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7))

  return rangeRevenue(appointments, dateToStr(lunes), dateToStr(today))
}
