import type { Appointment, AppointmentStatus, Professional, Service } from "@/types"

export const mockProfessionals: Professional[] = [
  { id: "p1", name: "Valentina", email: "vale@demo.com", specialty: "HIFU & Liposonix", branchId: "b1", color: "#7c3aed" },
  { id: "p2", name: "Camila", email: "cami@demo.com", specialty: "Tratamientos faciales", branchId: "b1", color: "#0891b2" },
  { id: "p3", name: "Sofía", email: "sofi@demo.com", specialty: "Corporales", branchId: "b1", color: "#059669" },
]

export const mockServices: Service[] = [
  { id: "s1", name: "HIFU Facial", duration: 60, price: 45000 },
  { id: "s2", name: "Liposonix Abdomen", duration: 90, price: 65000 },
  { id: "s3", name: "Limpieza profunda", duration: 60, price: 18000 },
  { id: "s4", name: "Cavitación", duration: 45, price: 22000 },
  { id: "s5", name: "Hydrafacial", duration: 75, price: 28000 },
]

export const mockAppointments: Appointment[] = [
  {
    id: "a1",
    patientId: "pa1",
    patient: { id: "pa1", name: "Laura Gómez", phone: "11-4455-6677" },
    professionalId: "p1",
    professional: mockProfessionals[0],
    serviceId: "s1",
    service: mockServices[0],
    branchId: "b1",
    date: getTodayStr(),
    startTime: "09:00",
    endTime: "10:00",
    status: "confirmed",
  },
  {
    id: "a2",
    patientId: "pa2",
    patient: { id: "pa2", name: "Marcela Ruiz", phone: "11-2233-4455" },
    professionalId: "p1",
    professional: mockProfessionals[0],
    serviceId: "s2",
    service: mockServices[1],
    branchId: "b1",
    date: getTodayStr(),
    startTime: "11:00",
    endTime: "12:30",
    status: "pending",
  },
  {
    id: "a3",
    patientId: "pa3",
    patient: { id: "pa3", name: "Jimena Torres", phone: "11-6677-8899" },
    professionalId: "p2",
    professional: mockProfessionals[1],
    serviceId: "s3",
    service: mockServices[2],
    branchId: "b1",
    date: getTodayStr(),
    startTime: "10:00",
    endTime: "11:00",
    status: "confirmed",
  },
  {
    id: "a4",
    patientId: "pa4",
    patient: { id: "pa4", name: "Ana Fernández", phone: "11-9900-1122" },
    professionalId: "p3",
    professional: mockProfessionals[2],
    serviceId: "s4",
    service: mockServices[3],
    branchId: "b1",
    date: getTodayStr(),
    startTime: "14:00",
    endTime: "14:45",
    status: "completed",
  },
  {
    id: "a5",
    patientId: "pa5",
    patient: { id: "pa5", name: "Patricia Silva", phone: "11-3344-5566" },
    professionalId: "p2",
    professional: mockProfessionals[1],
    serviceId: "s5",
    service: mockServices[4],
    branchId: "b1",
    date: getTodayStr(),
    startTime: "15:00",
    endTime: "16:15",
    status: "confirmed",
  },
]

function getTodayStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

/**
 * Historial de ejemplo: el mes en curso y el anterior.
 *
 * Sin esto, todo lo que mira "el mes" —la tarjeta de facturación del tablero y
 * `/reportes`— queda vacío: los cinco turnos de arriba son todos de hoy, así que
 * no hay mes anterior contra el cual comparar ni nada agendado por venir.
 *
 * **Las fechas son relativas a hoy, nunca fijas.** Un mock con fechas escritas a
 * mano envejece: al mes siguiente el "mes en curso" queda vacío otra vez.
 *
 * Se va cuando exista la Fase 5 y los turnos salgan de la API.
 */
const PACIENTES = [
  { id: "pa6", name: "Carla Méndez", phone: "11-5566-7788" },
  { id: "pa7", name: "Rocío Álvarez", phone: "11-2244-6688" },
  { id: "pa8", name: "Julieta Paz", phone: "11-7788-9900" },
  { id: "pa9", name: "Noelia Bravo", phone: "11-3355-7799" },
  { id: "pa10", name: "Bárbara Ortiz", phone: "11-4466-8800" },
]

/** Cuatro franjas que no se pisan entre sí dentro del mismo día. */
const FRANJAS = [
  ["09:00", "10:00"],
  ["11:00", "12:30"],
  ["14:00", "15:00"],
  ["16:00", "17:15"],
]

/** Días que tiene ese mes. El 0 del siguiente es el último del actual. */
function diasDelMes(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Todos los días del mes menos los domingos.
 *
 * Contiguo y no una lista salteada: con huecos, el corte "lo que va de la
 * semana" cae en una semana sin turnos según qué día sea hoy y termina
 * mostrando lo mismo que "hoy", como si estuviera roto.
 */
function diasDe(year: number, month: number): number[] {
  const dias: number[] = []
  for (let day = 1; day <= diasDelMes(year, month); day++) {
    if (new Date(year, month, day).getDay() !== 0) dias.push(day)
  }
  return dias
}

/**
 * Turnos por día. Tres es lo que hace que el día de hoy —que tiene cinco escritos
 * a mano— no parezca un pico: con un turno por día, hoy solo inflaba el mes en
 * curso y la comparación daba un crecimiento irreal del 50%.
 */
const TURNOS_POR_DIA = 3

function fechaDe(year: number, month: number, day: number): string {
  // `new Date` normaliza el 31 de un mes de 30 y el cambio de año.
  const d = new Date(year, month, day)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function turnoDe(date: string, index: number, status: AppointmentStatus): Appointment {
  const service = mockServices[index % mockServices.length]!
  const professional = mockProfessionals[index % mockProfessionals.length]!
  const patient = PACIENTES[index % PACIENTES.length]!
  const [startTime, endTime] = FRANJAS[index % FRANJAS.length]!

  return {
    id: `h${date}-${index}`,
    patientId: patient.id,
    patient,
    professionalId: professional.id,
    professional,
    serviceId: service.id,
    service,
    branchId: "b1",
    date,
    startTime: startTime!,
    endTime: endTime!,
    status,
  }
}

function construirHistorial(): Appointment[] {
  const hoy = new Date()
  const turnos: Appointment[] = []
  let index = 0

  const agregar = (date: string, cantidad: number, status: AppointmentStatus) => {
    for (let i = 0; i < cantidad; i++) turnos.push(turnoDe(date, index++, status))
  }

  for (const day of diasDe(hoy.getFullYear(), hoy.getMonth() - 1)) {
    agregar(fechaDe(hoy.getFullYear(), hoy.getMonth() - 1, day), TURNOS_POR_DIA, "completed")
  }

  for (const day of diasDe(hoy.getFullYear(), hoy.getMonth())) {
    // Hoy ya tiene sus cinco turnos escritos arriba: no se le agregan más.
    if (day === hoy.getDate()) continue

    // Un turno extra cada tres días: el mes en curso viene apenas mejor que el
    // anterior, que es la historia que cuenta la tarjeta de facturación.
    const cantidad = TURNOS_POR_DIA + (day % 3 === 0 ? 1 : 0)

    // Lo que ya pasó se atendió; lo que viene está confirmado y todavía no
    // ocurrió. De esa diferencia sale la proyección del mes.
    agregar(
      fechaDe(hoy.getFullYear(), hoy.getMonth(), day),
      cantidad,
      day < hoy.getDate() ? "completed" : "confirmed",
    )
  }

  return turnos
}

/**
 * Un poco de variedad, solo en la semana en curso.
 *
 * El generador pinta todo lo pasado como atendido y todo lo que viene como
 * confirmado. Con eso, el tablero de la agenda no tiene nunca nada que confirmar
 * ni ninguna baja, y dos de sus cuatro columnas se ven siempre vacías.
 *
 * Se tocan **tres turnos y nada más**, y todos de la semana en curso: la
 * comparación contra el mes anterior está calibrada y unos pocos turnos fuera
 * del total facturable no la mueven. Con más, el mes en curso caería solo porque
 * el mock cambió de opinión.
 */
function darVariedad(turnos: Appointment[]): void {
  const hoy = new Date()
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7))
  const domingo = new Date(lunes)
  domingo.setDate(lunes.getDate() + 6)

  const porVenir = turnos
    .filter(
      (t) =>
        t.status === "confirmed" &&
        t.date > fechaDe(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) &&
        t.date >= fechaDe(lunes.getFullYear(), lunes.getMonth(), lunes.getDate()) &&
        t.date <= fechaDe(domingo.getFullYear(), domingo.getMonth(), domingo.getDate()),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

  if (porVenir[0]) porVenir[0].status = "pending"
  if (porVenir[2]) porVenir[2].status = "pending"
  if (porVenir[4]) porVenir[4].status = "cancelled"
}

const historial = construirHistorial()
darVariedad(historial)
mockAppointments.push(...historial)
