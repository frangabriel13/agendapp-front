import { describe, expect, it } from "vitest"
import { toInstant } from "@/features/employees/lib/timeOff"
import type { Appointment, EmployeeShift, TimeOff } from "@/types"
import {
  absenceMinutesByDay,
  bookedMinutesByDay,
  dayStatus,
  describeAbsence,
  layoutAbsences,
  minutesByWeekday,
} from "./availability"
import { buildDays } from "./timeline"

const tramo = (dayOfWeek: number, startsAt: string, endsAt: string): EmployeeShift =>
  ({ id: `${dayOfWeek}-${startsAt}`, branchId: "b1", dayOfWeek, startsAt, endsAt }) as EmployeeShift

const turno = (
  date: string,
  startTime: string,
  endTime: string,
  status: Appointment["status"] = "confirmed",
): Appointment => ({ date, startTime, endTime, status }) as Appointment

const ausencia = (
  desde: string,
  hasta: string,
  horaDesde = "00:00",
  horaHasta = "23:59",
  reason: string | null = null,
): TimeOff =>
  ({
    id: `${desde}${horaDesde}/${hasta}${horaHasta}`,
    employeeId: "e1",
    branchId: null,
    startsAt: toInstant(desde, horaDesde),
    endsAt: toInstant(hasta, horaHasta),
    reason,
  }) as TimeOff

/** Miércoles 9 de septiembre de 2026. La ventana arranca el lunes 7. */
const DIAS = buildDays(new Date(2026, 8, 9), 14)

/** Lunes a viernes de 10 a 19. Sábado y domingo no trabaja. */
const SEMANA = [1, 2, 3, 4, 5].map((d) => tramo(d, "10:00", "19:00"))

describe("minutesByWeekday", () => {
  it("suma los tramos del mismo día", () => {
    expect(minutesByWeekday([tramo(1, "09:00", "13:00"), tramo(1, "16:00", "20:00")]).get(1)).toBe(480)
  })

  it("no mezcla días", () => {
    const porDia = minutesByWeekday([tramo(1, "09:00", "13:00"), tramo(2, "10:00", "12:00")])

    expect([porDia.get(1), porDia.get(2), porDia.get(3)]).toEqual([240, 120, undefined])
  })

  it("descarta un tramo invertido en vez de restar minutos", () => {
    const porDia = minutesByWeekday([tramo(1, "09:00", "13:00"), tramo(1, "18:00", "09:00")])

    expect(porDia.get(1)).toBe(240)
  })
})

describe("bookedMinutesByDay", () => {
  it("suma la duración de los turnos del día", () => {
    const porDia = bookedMinutesByDay([
      turno("2026-09-09", "09:00", "10:00"),
      turno("2026-09-09", "11:00", "12:30"),
    ])

    expect(porDia.get("2026-09-09")).toBe(150)
  })

  it("un cancelado libera el lugar y no ocupa", () => {
    const porDia = bookedMinutesByDay([
      turno("2026-09-09", "09:00", "10:00", "cancelled"),
      turno("2026-09-09", "11:00", "12:00"),
    ])

    expect(porDia.get("2026-09-09")).toBe(60)
  })

  it("un 'no asistió' sí ocupa: nadie más pudo tomar ese horario", () => {
    expect(bookedMinutesByDay([turno("2026-09-09", "09:00", "10:00", "no_show")]).get("2026-09-09")).toBe(60)
  })
})

describe("dayStatus", () => {
  const base = { capacidad: 540, ocupado: 0, tieneHorarios: true }

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

  it("un resto que no alcanza para nadie es 'casi llena', no llena", () => {
    // Quedan 60 minutos de 540: hay tiempo, pero no entra ningún servicio real.
    expect(dayStatus({ ...base, ocupado: 480 })).toBe("casi-llena")
  })

  it("llena es no tener un solo minuto", () => {
    expect(dayStatus({ ...base, ocupado: 540 })).toBe("llena")
  })

  it("sobrevendido no rompe: sigue siendo llena", () => {
    expect(dayStatus({ ...base, ocupado: 700 })).toBe("llena")
  })

  it("justo en el borde del resto mínimo todavía no está llena", () => {
    // Quedan 81 de 540: un 15% exacto entra en "casi llena", no en "llena".
    expect(dayStatus({ ...base, ocupado: 459 })).toBe("casi-llena")
  })
})

describe("absenceMinutesByDay", () => {
  it("una ausencia de día entero se lleva todo el turno", () => {
    // Miércoles 9, de 00:00 a 23:59, contra un turno de 10 a 19.
    const porDia = absenceMinutesByDay([ausencia("2026-09-09", "2026-09-09")], DIAS, SEMANA)

    expect(porDia.get("2026-09-09")).toMatchObject({ minutos: 540, completa: true })
  })

  it("una de pocas horas se lleva solo esas, y no es completa", () => {
    const porDia = absenceMinutesByDay(
      [ausencia("2026-09-09", "2026-09-09", "14:00", "18:00")],
      DIAS,
      SEMANA,
    )

    expect(porDia.get("2026-09-09")).toMatchObject({ minutos: 240, completa: false })
  })

  it("solo cuenta el rato que pisa el turno, no el que cae fuera", () => {
    // De 07:00 a 12:00 contra un turno de 10 a 19: se lleva 2 horas.
    const porDia = absenceMinutesByDay(
      [ausencia("2026-09-09", "2026-09-09", "07:00", "12:00")],
      DIAS,
      SEMANA,
    )

    expect(porDia.get("2026-09-09")!.minutos).toBe(120)
  })

  it("cubrir el turno entero alcanza para ser completa, aunque no sea todo el día", () => {
    const porDia = absenceMinutesByDay(
      [ausencia("2026-09-09", "2026-09-09", "08:00", "20:00")],
      DIAS,
      SEMANA,
    )

    expect(porDia.get("2026-09-09")).toMatchObject({ completa: true })
  })

  it("un día que no trabaja cuenta como completa, para no partir la barra", () => {
    // Sábado 12: no hay tramo, así que unas vacaciones que lo cruzan siguen.
    const porDia = absenceMinutesByDay([ausencia("2026-09-10", "2026-09-14")], DIAS, SEMANA)

    expect(porDia.get("2026-09-12")).toMatchObject({ minutos: 0, completa: true })
  })

  it("en una de varios días, solo el primero queda recortado por la hora", () => {
    const porDia = absenceMinutesByDay(
      [ausencia("2026-09-09", "2026-09-11", "14:00", "23:59")],
      DIAS,
      SEMANA,
    )

    expect(porDia.get("2026-09-09")).toMatchObject({ minutos: 300, completa: false })
    expect(porDia.get("2026-09-10")).toMatchObject({ completa: true })
    expect(porDia.get("2026-09-11")).toMatchObject({ completa: true })
  })

  it("dos el mismo día: gana la que se lleva más tiempo", () => {
    const corta = ausencia("2026-09-09", "2026-09-09", "10:00", "11:00", "Trámite")
    const larga = ausencia("2026-09-09", "2026-09-09", "12:00", "18:00", "Estudio")
    const porDia = absenceMinutesByDay([corta, larga], DIAS, SEMANA)

    expect(porDia.get("2026-09-09")!.timeOff.reason).toBe("Estudio")
  })

  it("ignora las que caen fuera de la ventana", () => {
    expect(absenceMinutesByDay([ausencia("2026-08-01", "2026-08-05")], DIAS, SEMANA).size).toBe(0)
  })

  it("sin horarios cargados no inventa minutos, pero tapa el día igual", () => {
    const porDia = absenceMinutesByDay([ausencia("2026-09-09", "2026-09-09")], DIAS, [])

    expect(porDia.get("2026-09-09")).toMatchObject({ minutos: 0, completa: true })
  })
})

describe("layoutAbsences", () => {
  const ubicar = (items: TimeOff[], shifts = SEMANA) =>
    layoutAbsences(absenceMinutesByDay(items, DIAS, shifts), DIAS)

  it("junta los días completos en una sola barra", () => {
    const { spans } = ubicar([ausencia("2026-09-09", "2026-09-11")])

    expect(spans).toHaveLength(1)
    expect(spans[0]).toMatchObject({ start: 2, end: 4 })
  })

  it("un día tomado a medias no lleva barra: ahí la persona atendió", () => {
    const { spans } = ubicar([ausencia("2026-09-09", "2026-09-09", "14:00", "18:00")])

    expect(spans).toHaveLength(0)
  })

  it("la barra arranca recién donde la ausencia se lleva el día entero", () => {
    // Empieza a las 14 del miércoles: el miércoles queda como celda parcial.
    const { spans } = ubicar([ausencia("2026-09-09", "2026-09-11", "14:00", "23:59")])

    expect(spans).toHaveLength(1)
    expect(spans[0]).toMatchObject({ start: 3, end: 4, continuesBefore: true })
  })

  it("un día parcial en el medio parte la ausencia en dos barras", () => {
    const shifts = SEMANA
    const porDia = absenceMinutesByDay([ausencia("2026-09-07", "2026-09-11")], DIAS, shifts)
    // El miércoles pasa a estar tomado a medias.
    porDia.set("2026-09-09", { ...porDia.get("2026-09-09")!, minutos: 120, completa: false })

    const { spans } = layoutAbsences(porDia, DIAS)

    expect(spans.map((s) => [s.start, s.end])).toEqual([
      [0, 1],
      [3, 4],
    ])
  })

  it("avisa que sigue cuando se corta contra el borde de la ventana", () => {
    const { spans } = ubicar([ausencia("2026-09-01", "2026-09-08")])

    expect(spans[0]).toMatchObject({ start: 0, end: 1, continuesBefore: true, continuesAfter: false })
  })

  it("dos ausencias superpuestas van a filas distintas", () => {
    const porDia = absenceMinutesByDay([ausencia("2026-09-07", "2026-09-09")], DIAS, SEMANA)
    const otra = absenceMinutesByDay([ausencia("2026-09-10", "2026-09-11")], DIAS, SEMANA)
    for (const [k, v] of otra) porDia.set(k, v)

    // Días contiguos pero de ausencias distintas: no se pueden fusionar.
    const { spans } = layoutAbsences(porDia, DIAS)

    expect(spans.map((s) => [s.start, s.end])).toEqual([
      [0, 2],
      [3, 4],
    ])
  })

  it("sin ausencias deja una sola fila, para que la persona ocupe alto igual", () => {
    expect(layoutAbsences(new Map(), DIAS)).toEqual({ spans: [], lanes: 1 })
  })
})

describe("describeAbsence", () => {
  const span = (start: number, end: number, extra = {}) => ({
    timeOff: ausencia("2026-09-07", "2026-09-11", "00:00", "23:59", "Vacaciones"),
    start,
    end,
    continuesBefore: false,
    continuesAfter: false,
    lane: 0,
    ...extra,
  })

  it("cuenta los días que ocupa la barra", () => {
    expect(describeAbsence(span(0, 4)).detail).toBe("5 días")
  })

  it("un día entero se anuncia como tal", () => {
    expect(describeAbsence(span(2, 2)).detail).toBe("Todo el día")
  })

  it("un día suelto que sigue más allá cuenta como día, no como 'todo el día'", () => {
    expect(describeAbsence(span(2, 2, { continuesAfter: true })).detail).toBe("1 día")
  })

  it("sin motivo dice 'Ausencia' en vez de dejar la barra vacía", () => {
    const sinMotivo = { ...span(0, 1), timeOff: ausencia("2026-09-07", "2026-09-08") }

    expect(describeAbsence(sinMotivo).title).toBe("Ausencia")
  })
})
