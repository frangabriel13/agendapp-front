import { describe, expect, it } from "vitest"
import {
  formatHours,
  shiftsOfDay,
  sortShifts,
  toDrafts,
  toPayload,
  validateShifts,
  weeklyMinutes,
  type DraftShift,
} from "./schedule"

const CENTRO = "b-centro"
const NORTE = "b-norte"
const SUCURSALES = [CENTRO, NORTE]

const shift = (
  key: string,
  dayOfWeek: number,
  startsAt: string,
  endsAt: string,
  branchId = CENTRO,
): DraftShift => ({ key, dayOfWeek, startsAt, endsAt, branchId })

const errorsOf = (drafts: DraftShift[], sucursales = SUCURSALES) =>
  Object.fromEntries(validateShifts(drafts, sucursales))

describe("sortShifts", () => {
  it("ordena la semana arrancando en lunes, no en domingo", () => {
    // El backend numera 0 = domingo, así que ordenar por el número crudo pondría
    // el domingo primero.
    const ordenado = sortShifts([
      shift("dom", 0, "09:00", "13:00"),
      shift("lun", 1, "09:00", "13:00"),
      shift("sab", 6, "09:00", "13:00"),
    ])

    expect(ordenado.map((s) => s.key)).toEqual(["lun", "sab", "dom"])
  })

  it("dentro del mismo día ordena por hora de inicio", () => {
    const ordenado = sortShifts([
      shift("tarde", 3, "15:00", "19:00"),
      shift("manana", 3, "09:00", "13:00"),
    ])

    expect(ordenado.map((s) => s.key)).toEqual(["manana", "tarde"])
  })

  it("no muta el array que recibe", () => {
    const shifts = [shift("b", 2, "15:00", "19:00"), shift("a", 1, "09:00", "13:00")]
    sortShifts(shifts)

    expect(shifts.map((s) => s.key)).toEqual(["b", "a"])
  })
})

describe("toDrafts / toPayload", () => {
  it("convierte el id de lectura en la key del editor", () => {
    const drafts = toDrafts([
      { id: "s-1", branchId: CENTRO, dayOfWeek: 1, startsAt: "09:00", endsAt: "13:00" },
    ])

    expect(drafts).toEqual([{ key: "s-1", branchId: CENTRO, dayOfWeek: 1, startsAt: "09:00", endsAt: "13:00" }])
  })

  it("el payload no lleva key ni id: el backend rechaza los campos de más", () => {
    const payload = toPayload([shift("s-1", 1, "09:00", "13:00")])

    expect(payload).toEqual([{ branchId: CENTRO, dayOfWeek: 1, startsAt: "09:00", endsAt: "13:00" }])
    expect(Object.keys(payload[0]!)).not.toContain("key")
    expect(Object.keys(payload[0]!)).not.toContain("id")
  })

  it("el payload sale ordenado", () => {
    const payload = toPayload([shift("b", 0, "09:00", "13:00"), shift("a", 1, "09:00", "13:00")])

    expect(payload.map((s) => s.dayOfWeek)).toEqual([1, 0])
  })
})

describe("validateShifts", () => {
  it("acepta una semana sana", () => {
    expect(
      errorsOf([shift("a", 1, "09:00", "13:00"), shift("b", 1, "15:00", "19:00"), shift("c", 3, "09:00", "18:00")]),
    ).toEqual({})
  })

  it("exige sucursal", () => {
    expect(errorsOf([shift("a", 1, "09:00", "13:00", "")])).toEqual({ a: "Elegí una sucursal" })
  })

  it("rechaza una sucursal donde el empleado no trabaja", () => {
    // Pasa al desasignar una sucursal que ya tenía tramos cargados.
    expect(errorsOf([shift("a", 1, "09:00", "13:00", NORTE)], [CENTRO])).toEqual({
      a: "No trabaja en esa sucursal",
    })
  })

  it("rechaza el rango invertido", () => {
    expect(errorsOf([shift("a", 1, "18:00", "09:00")])).toEqual({
      a: "El fin tiene que ser posterior al inicio",
    })
  })

  it("rechaza el rango de duración cero", () => {
    expect(errorsOf([shift("a", 1, "09:00", "09:00")])).toEqual({
      a: "El fin tiene que ser posterior al inicio",
    })
  })

  it("marca el solapamiento dentro del día", () => {
    expect(errorsOf([shift("a", 1, "09:00", "14:00"), shift("b", 1, "13:00", "18:00")])).toEqual({
      b: "Se superpone con otro tramo del mismo día",
    })
  })

  it("dos tramos que se tocan no se superponen", () => {
    expect(errorsOf([shift("a", 1, "09:00", "13:00"), shift("b", 1, "13:00", "18:00")])).toEqual({})
  })

  it("marca el solapamiento aunque sean sucursales distintas", () => {
    // Una persona no puede estar en dos locales a la vez; si se permitiera, la
    // agenda la daría por disponible en ambos al mismo tiempo.
    expect(errorsOf([shift("a", 1, "09:00", "14:00", CENTRO), shift("b", 1, "13:00", "18:00", NORTE)])).toEqual({
      b: "Se superpone con otro tramo del mismo día",
    })
  })

  it("el mismo horario en días distintos no se superpone", () => {
    expect(errorsOf([shift("a", 1, "09:00", "13:00"), shift("b", 2, "09:00", "13:00")])).toEqual({})
  })

  it("un tramo ya inválido no dispara además un falso solapamiento", () => {
    // Si el rango está invertido, su fin no sirve para comparar contra el vecino.
    expect(errorsOf([shift("a", 1, "18:00", "09:00"), shift("b", 1, "10:00", "12:00")])).toEqual({
      a: "El fin tiene que ser posterior al inicio",
    })
  })

  it("un tramo inválido por sucursal no arrastra al vecino a un falso solapamiento", () => {
    // Caso real: se desasigna una sucursal y sus tramos quedan huérfanos. Esos
    // hay que arreglarlos igual; marcar además al de la sucursal que sí vale es
    // ruido que manda a corregir algo que no está mal.
    expect(
      errorsOf([shift("a", 1, "09:00", "14:00", NORTE), shift("b", 1, "13:00", "18:00", CENTRO)], [CENTRO]),
    ).toEqual({ a: "No trabaja en esa sucursal" })
  })
})

describe("shiftsOfDay", () => {
  it("filtra por día y devuelve ordenado", () => {
    const result = shiftsOfDay(
      [shift("tarde", 1, "15:00", "19:00"), shift("otro", 2, "09:00", "13:00"), shift("manana", 1, "09:00", "13:00")],
      1,
    )

    expect(result.map((s) => s.key)).toEqual(["manana", "tarde"])
  })
})

describe("weeklyMinutes y formatHours", () => {
  it("suma los tramos de la semana", () => {
    expect(weeklyMinutes([shift("a", 1, "09:00", "13:00"), shift("b", 2, "09:00", "12:30")])).toBe(240 + 210)
  })

  it("ignora los tramos invertidos en vez de restar", () => {
    expect(weeklyMinutes([shift("a", 1, "09:00", "13:00"), shift("b", 2, "18:00", "09:00")])).toBe(240)
  })

  it("formatea horas y minutos", () => {
    expect(formatHours(0)).toBe("0 min")
    expect(formatHours(45)).toBe("45 min")
    expect(formatHours(120)).toBe("2 h")
    expect(formatHours(450)).toBe("7 h 30 min")
  })
})
