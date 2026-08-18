import { describe, expect, it } from "vitest"
import type { Appointment, AppointmentStatus } from "@/types"
import {
  monthLabel,
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
