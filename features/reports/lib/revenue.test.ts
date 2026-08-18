import { describe, expect, it } from "vitest"
import type { Appointment, AppointmentStatus } from "@/types"
import {
  dayRevenue,
  weekToDateRevenue,
  monthLabel,
  monthOutlook,
  monthRevenue,
  revenueByProfessional,
  revenueByService,
} from "./revenue"

const turno = (
  date: string,
  status: AppointmentStatus,
  price: number,
  service = "HIFU",
  professional = "Valentina",
): Appointment =>
  ({
    id: `${date}-${service}-${price}`,
    date,
    status,
    service: { name: service, price },
    professional: { name: professional },
  }) as Appointment

const AGOSTO = "2026-08"

const AGENDA = [
  turno("2026-08-03", "completed", 22_000, "Cavitación", "Sofía"),
  turno("2026-08-10", "confirmed", 45_000, "HIFU Facial", "Valentina"),
  turno("2026-08-10", "confirmed", 18_000, "Limpieza", "Camila"),
  turno("2026-08-18", "confirmed", 28_000, "Hydrafacial", "Valentina"),
  turno("2026-08-18", "pending", 65_000, "Liposonix", "Valentina"),
  turno("2026-08-20", "cancelled", 40_000, "HIFU Facial", "Camila"),
  turno("2026-08-21", "no_show", 30_000, "Limpieza", "Sofía"),
  // Otro mes: no tiene que aparecer en ninguna cuenta.
  turno("2026-07-30", "completed", 99_000, "HIFU Facial", "Valentina"),
]

describe("monthRevenue", () => {
  it("suma lo atendido y lo agendado, y nada más", () => {
    expect(monthRevenue(AGENDA, AGOSTO)).toMatchObject({
      atendido: 22_000,
      agendado: 91_000,
      total: 113_000,
      turnos: 4,
    })
  })

  it("deja lo pendiente aparte del total: todavía puede no confirmarse", () => {
    const { total, sinConfirmar } = monthRevenue(AGENDA, AGOSTO)

    expect(sinConfirmar).toBe(65_000)
    expect(total).toBe(113_000)
  })

  it("no cuenta cancelados ni ausencias", () => {
    const soloDescartados = [
      turno("2026-08-01", "cancelled", 50_000),
      turno("2026-08-02", "no_show", 50_000),
    ]

    expect(monthRevenue(soloDescartados, AGOSTO)).toMatchObject({ total: 0, turnos: 0 })
  })

  it("ignora los turnos de otros meses", () => {
    expect(monthRevenue(AGENDA, "2026-07").total).toBe(99_000)
  })

  it("el ticket promedio es el total sobre los turnos que suman", () => {
    // 113.000 / 4 = 28.250. El pendiente de 65.000 no participa de ninguno de los dos.
    expect(monthRevenue(AGENDA, AGOSTO).ticketPromedio).toBe(28_250)
  })

  it("sin turnos devuelve cero y no NaN", () => {
    expect(monthRevenue([], AGOSTO)).toMatchObject({ total: 0, turnos: 0, ticketPromedio: 0 })
  })
})

describe("revenueByService", () => {
  it("agrupa por servicio y ordena de mayor a menor", () => {
    expect(revenueByService(AGENDA, AGOSTO).map((s) => [s.label, s.total])).toEqual([
      ["HIFU Facial", 45_000],
      ["Hydrafacial", 28_000],
      ["Cavitación", 22_000],
      ["Limpieza", 18_000],
    ])
  })

  it("la porción se mide contra el total del corte, no contra el más grande", () => {
    const [mayor] = revenueByService(AGENDA, AGOSTO)

    // 45.000 sobre 113.000. Si se midiera contra el máximo daría 1.
    expect(mayor!.share).toBeCloseTo(45_000 / 113_000, 5)
  })

  it("las porciones suman uno", () => {
    const suma = revenueByService(AGENDA, AGOSTO).reduce((total, s) => total + s.share, 0)

    expect(suma).toBeCloseTo(1, 5)
  })

  it("no arrastra el turno cancelado del mismo servicio", () => {
    const hifu = revenueByService(AGENDA, AGOSTO).find((s) => s.label === "HIFU Facial")

    expect(hifu).toMatchObject({ total: 45_000, turnos: 1 })
  })
})

describe("revenueByProfessional", () => {
  it("agrupa por profesional", () => {
    expect(revenueByProfessional(AGENDA, AGOSTO).map((s) => [s.label, s.total])).toEqual([
      ["Valentina", 73_000],
      ["Sofía", 22_000],
      ["Camila", 18_000],
    ])
  })

  it("empatados en plata, ordena alfabético para que no bailen entre renders", () => {
    const empate = [
      turno("2026-08-01", "confirmed", 10_000, "A", "Zoe"),
      turno("2026-08-02", "confirmed", 10_000, "B", "Ana"),
    ]

    expect(revenueByProfessional(empate, AGOSTO).map((s) => s.label)).toEqual(["Ana", "Zoe"])
  })
})

describe("monthLabel", () => {
  it("nombra el mes en castellano y con mayúscula", () => {
    expect(monthLabel("2026-08")).toBe("Agosto")
    expect(monthLabel("2026-01")).toBe("Enero")
  })

  it("no se corre de mes en zona negativa", () => {
    // `new Date("2026-01")` se leería como UTC y en América caería en diciembre.
    expect(monthLabel("2026-01")).not.toBe("Diciembre")
  })
})

describe("monthOutlook", () => {
  /** 18 de agosto de 2026. Agosto tiene 31 días, así que faltan 13. */
  const HOY = new Date(2026, 7, 18)

  const HISTORIAL = [
    // Julio, antes del 18.
    turno("2026-07-05", "completed", 30_000),
    turno("2026-07-12", "completed", 40_000),
    // Julio, después del 18: entra en el cierre pero no en la comparación.
    turno("2026-07-25", "completed", 50_000),
    // Agosto, hasta hoy.
    turno("2026-08-03", "completed", 22_000),
    turno("2026-08-18", "confirmed", 45_000),
    // Agosto, por venir.
    turno("2026-08-20", "confirmed", 28_000),
    // No suman.
    turno("2026-08-19", "pending", 99_000),
    turno("2026-07-08", "cancelled", 99_000),
  ]

  it("el actual llega hasta hoy, no hasta fin de mes", () => {
    expect(monthOutlook(HISTORIAL, HOY).actual).toBe(67_000)
  })

  it("compara contra el mismo tramo del mes anterior, no contra su cierre", () => {
    const outlook = monthOutlook(HISTORIAL, HOY)

    // Julio hasta el 18 = 70.000. El turno del 25 queda fuera de la comparación
    // pero sí entra en el cierre.
    expect(outlook.anteriorAlMismoDia).toBe(70_000)
    expect(outlook.anteriorCierre).toBe(120_000)
  })

  it("la variación sale del tramo comparable", () => {
    // 67.000 contra 70.000.
    expect(monthOutlook(HISTORIAL, HOY).variacion).toBeCloseTo(67_000 / 70_000 - 1, 5)
  })

  it("sin registro del mes anterior no inventa un cero", () => {
    const soloAgosto = HISTORIAL.filter((t) => t.date.startsWith("2026-08"))
    const outlook = monthOutlook(soloAgosto, HOY)

    expect(outlook.anteriorAlMismoDia).toBeNull()
    expect(outlook.anteriorCierre).toBeNull()
    expect(outlook.variacion).toBeNull()
    expect(outlook.proyeccion.variacion).toBeNull()
  })

  it("un mes anterior en cero no da variación infinita", () => {
    const anteriorVacio = [
      // Existe el registro del mes, pero nada facturable.
      turno("2026-07-05", "cancelled", 30_000),
      turno("2026-08-03", "completed", 22_000),
    ]

    expect(monthOutlook(anteriorVacio, HOY).variacion).toBeNull()
  })

  it("la proyección suma lo agendado como dato, no como estimación", () => {
    expect(monthOutlook(HISTORIAL, HOY).proyeccion.agendado).toBe(28_000)
  })

  it("solo estima los días que faltan y no tienen nada agendado", () => {
    // Del 19 al 31 hay 13 días; el 20 ya tiene turno, así que se estiman 12.
    expect(monthOutlook(HISTORIAL, HOY).proyeccion.diasEstimados).toBe(12)
  })

  it("proyecta facturado + agendado + estimación al ritmo del mes", () => {
    // Ritmo = 67.000 / 18 = 3.722,2 por día. 12 días = 44.667.
    const esperado = 67_000 + 28_000 + Math.round((67_000 / 18) * 12)

    expect(monthOutlook(HISTORIAL, HOY).proyeccion.total).toBe(esperado)
  })

  it("no cuenta dos veces el día que ya tiene turnos agendados", () => {
    const conYSin = monthOutlook(HISTORIAL, HOY).proyeccion
    // Si el día 20 se estimara además de contarse en `agendado`, serían 13 días.
    expect(conYSin.diasEstimados).toBeLessThan(13)
  })

  it("avisa que la proyección es preliminar los primeros días del mes", () => {
    const dia2 = new Date(2026, 7, 2)
    const dia9 = new Date(2026, 7, 9)

    expect(monthOutlook(HISTORIAL, dia2).proyeccion.preliminar).toBe(true)
    expect(monthOutlook(HISTORIAL, dia9).proyeccion.preliminar).toBe(false)
  })

  it("cruza el cambio de año hacia atrás", () => {
    const enero = new Date(2027, 0, 10)
    const outlook = monthOutlook([turno("2026-12-05", "completed", 10_000)], enero)

    expect(outlook.mes).toBe("2027-01")
    expect(outlook.mesAnterior).toBe("2026-12")
    expect(outlook.anteriorCierre).toBe(10_000)
  })

  it("un mes anterior más corto no rompe la comparación", () => {
    // 31 de marzo contra febrero, que tiene 28. "Hasta el día 31" es todo febrero.
    const marzo31 = new Date(2026, 2, 31)
    const outlook = monthOutlook([turno("2026-02-27", "completed", 10_000)], marzo31)

    expect(outlook.anteriorAlMismoDia).toBe(10_000)
    expect(outlook.anteriorCierre).toBe(10_000)
  })

  it("sin nada facturado, proyecta cero en vez de NaN", () => {
    const outlook = monthOutlook([], HOY)

    expect(outlook.actual).toBe(0)
    expect(outlook.proyeccion.total).toBe(0)
  })
})

describe("dayRevenue y weekToDateRevenue", () => {
  /** Martes 18 de agosto de 2026. El lunes de esta semana es el 17. */
  const MARTES = new Date(2026, 7, 18)

  const SEMANAS = [
    // Semana anterior: lunes 10 a domingo 16.
    turno("2026-08-10", "completed", 10_000),
    turno("2026-08-14", "completed", 20_000),
    turno("2026-08-16", "completed", 30_000),
    turno("2026-08-16", "cancelled", 99_000),
    // Domingo 9: es de la semana de antes, queda afuera.
    turno("2026-08-09", "completed", 77_000),
    // Lunes 17: ya es esta semana, queda afuera.
    turno("2026-08-17", "completed", 55_000),
    // Hoy.
    turno("2026-08-18", "completed", 40_000),
    turno("2026-08-18", "confirmed", 25_000),
    turno("2026-08-18", "pending", 99_000),
  ]

  it("el día cuenta solo lo facturable de esa fecha", () => {
    expect(dayRevenue(SEMANAS, MARTES)).toEqual({ total: 65_000, turnos: 2 })
  })

  it("la semana va del lunes a hoy: entra el lunes 17 y el martes 18", () => {
    // 55.000 del lunes + 65.000 facturables de hoy.
    expect(weekToDateRevenue(SEMANAS, MARTES)).toEqual({ total: 120_000, turnos: 3 })
  })

  it("no arrastra nada de la semana anterior", () => {
    // Sacar el domingo 16 y el resto de la semana pasada no tiene que cambiar
    // el número: si lo cambia, es que los estaba contando.
    const sinSemanaPasada = SEMANAS.filter((t) => t.date >= "2026-08-17")

    expect(weekToDateRevenue(SEMANAS, MARTES)).toEqual(weekToDateRevenue(sinSemanaPasada, MARTES))
  })

  it("corta en hoy: lo ya agendado para el resto de la semana no suma", () => {
    // Es "lo que va", no "lo que va a haber": si contara el jueves, el número
    // crecería solo por reservar.
    const conFuturo = [...SEMANAS, turno("2026-08-20", "confirmed", 88_000)]

    expect(weekToDateRevenue(conFuturo, MARTES).total).toBe(120_000)
  })

  it("desde un lunes, la semana es solo ese día", () => {
    expect(weekToDateRevenue(SEMANAS, new Date(2026, 7, 17))).toEqual({ total: 55_000, turnos: 1 })
  })

  it("desde un domingo, entra la semana entera", () => {
    // Domingo 23: su lunes es el 17, así que van del 17 al 23.
    expect(weekToDateRevenue(SEMANAS, new Date(2026, 7, 23))).toEqual({ total: 120_000, turnos: 3 })
  })

  it("cruza el fin de mes sin perder días", () => {
    // Martes 1 de septiembre: su lunes es el 31 de agosto.
    const cruce = [turno("2026-08-31", "completed", 9_000), turno("2026-09-01", "completed", 4_000)]

    expect(weekToDateRevenue(cruce, new Date(2026, 8, 1))).toEqual({ total: 13_000, turnos: 2 })
  })

  it("sin turnos devuelve cero, no NaN", () => {
    expect(dayRevenue([], MARTES)).toEqual({ total: 0, turnos: 0 })
    expect(weekToDateRevenue([], MARTES)).toEqual({ total: 0, turnos: 0 })
  })
})
