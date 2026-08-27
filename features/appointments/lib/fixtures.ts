import { toInstant } from "@/lib/time"
import { toAppointment } from "@/services/appointments"
import type { Appointment, AppointmentStatus } from "@/types"

/**
 * Turnos para los tests. **No lo importa nada de la aplicación.**
 *
 * Existe porque un `Appointment` de la API tiene veintipico de campos y escribir
 * los veinte en cada caso esconde lo que el test quiere probar. Acá se ponen los
 * cuatro que importan —día, hora, quién y estado— y el resto sale de un molde.
 *
 * **Pasa por `toAppointment`, igual que los turnos de verdad**: así el día y las
 * horas de pared se derivan del instante con la misma función que usa la app, en
 * vez de escribirse a mano y poder mentir.
 */
export function turno(overrides: {
  id?: string
  day?: string
  from?: string
  to?: string
  status?: AppointmentStatus
  employeeId?: string
  employeeName?: string
  cents?: number
  services?: { name: string; priceCents: number }[]
}): Appointment {
  const day = overrides.day ?? "2026-09-07"
  const from = overrides.from ?? "09:00"
  const to = overrides.to ?? "10:00"
  const cents = overrides.cents ?? 1500000
  const services = overrides.services ?? [{ name: "Corte", priceCents: cents }]

  return toAppointment({
    id: overrides.id ?? `${day}-${from}`,
    branch: { id: "b1", name: "Centro" },
    employee: {
      id: overrides.employeeId ?? "e1",
      name: overrides.employeeName ?? "Lucía Fernández",
    },
    customer: { id: "c1", firstName: "María", lastName: "González", phone: "11 5555-1234" },
    startsAt: toInstant(day, from),
    endsAt: toInstant(day, to),
    status: overrides.status ?? "CONFIRMED",
    createdVia: "ADMIN",
    totalPriceCents: cents,
    depositAmountCents: null,
    depositPaid: false,
    notes: null,
    services: services.map((service, index) => ({
      serviceId: `s${index + 1}`,
      name: service.name,
      durationMinutes: 60,
      priceCents: service.priceCents,
    })),
    resources: [],
    rescheduledFromId: null,
    rescheduledToId: null,
    canceledAt: null,
    cancellationReason: null,
    recurrenceGroupId: null,
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
  })
}
