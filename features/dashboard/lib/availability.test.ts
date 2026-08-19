import { describe, expect, it } from "vitest"
import type { Appointment, EmployeeShift } from "@/types"
import { bookedMinutesByDay, dayStatus, minutesByWeekday } from "./availability"

const tramo = (dayOfWeek: number, startsAt: string, endsAt: string): EmployeeShift =>
  ({ id: `${dayOfWeek}-${startsAt}`, branchId: "b1", dayOfWeek, startsAt, endsAt }) as EmployeeShift

const turno = (
  date: string,
  startTime: string,
  endTime: string,
  status: Appointment["status"] = "confirmed",
): Appointment => ({ date, startTime, endTime, status }) as Appointment

describe("minutesByWeekday", () => {
  it("suma los tramos del mismo día", () => {
    const porDia = minutesByWeekday([tramo(1, "09:00", "13:00"), tramo(1, "16:00", "20:00")])

    expect(porDia.get(1)).toBe(480)
  })

  it("no mezcla días", () => {
    const porDia = minutesByWeekday([tramo(1, "09:00", "13:00"), tramo(2, "10:00", "12:00")])

    expect(porDia.get(1)).toBe(240)
    expect(porDia.get(2)).toBe(120)
  })

  it("un día sin tramos no está en el mapa", () => {
    expect(minutesByWeekday([tramo(1, "09:00", "13:00")]).get(3)).toBeUndefined()
  })

  it("descarta un tramo invertido en vez de restar minutos", () => {
    // Un tramo de 18:00 a 09:00 sumaría -540 y dejaría la capacidad en negativo.
    const porDia = minutesByWeekday([tramo(1, "09:00", "13:00"), tramo(1, "18:00", "09:00")])

    expect(porDia.get(1)).toBe(240)
  })
})

describe("bookedMinutesByDay", () => {
  it("suma la duración de los turnos del día", () => {
    const porDia = bookedMinutesByDay([
      turno("2026-08-18", "09:00", "10:00"),
      turno("2026-08-18", "11:00", "12:30"),
    ])

    expect(porDia.get("2026-08-18")).toBe(150)
  })

  it("un cancelado libera el lugar y no ocupa", () => {
    const porDia = bookedMinutesByDay([
      turno("2026-08-18", "09:00", "10:00", "cancelled"),
      turno("2026-08-18", "11:00", "12:00"),
    ])

    expect(porDia.get("2026-08-18")).toBe(60)
  })

  it("un 'no asistió' sí ocupa: nadie más pudo tomar ese horario", () => {
    const porDia = bookedMinutesByDay([turno("2026-08-18", "09:00", "10:00", "no_show")])

    expect(porDia.get("2026-08-18")).toBe(60)
  })
})

describe("dayStatus", () => {
  const base = { capacidad: 480, ocupado: 0, tieneHorarios: true }

  it("sin horarios cargados no dice que no trabaja: dice que faltan", () => {
    expect(dayStatus({ ...base, tieneHorarios: false })).toBe("sin-horario")
  })

  it("con horarios pero sin tramos ese día, no trabaja", () => {
    expect(dayStatus({ ...base, capacidad: 0 })).toBe("no-trabaja")
  })

  it("trabaja y no tiene nada tomado: agenda vacía", () => {
    expect(dayStatus(base)).toBe("vacia")
  })

  it("con lugar de sobra, disponible", () => {
    expect(dayStatus({ ...base, ocupado: 120 })).toBe("disponible")
  })

  it("sin nada de lugar, llena", () => {
    expect(dayStatus({ ...base, ocupado: 480 })).toBe("llena")
  })

  it("un resto que no alcanza para nadie cuenta como llena", () => {
    // Quedan 30 minutos de 480: no entra ningún servicio real.
    expect(dayStatus({ ...base, ocupado: 450 })).toBe("llena")
  })

  it("un resto que sí sirve sigue siendo disponible", () => {
    // Quedan 120 de 480.
    expect(dayStatus({ ...base, ocupado: 360 })).toBe("disponible")
  })

  it("sobrevendido no rompe: sigue siendo llena", () => {
    expect(dayStatus({ ...base, ocupado: 600 })).toBe("llena")
  })

  it("la prioridad es sin-horario antes que cualquier otra cosa", () => {
    // Aunque la capacidad diga 0 y haya turnos, lo que falta es configurarlo.
    expect(dayStatus({ capacidad: 0, ocupado: 90, tieneHorarios: false })).toBe("sin-horario")
  })
})
