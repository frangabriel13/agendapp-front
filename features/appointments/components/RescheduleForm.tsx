"use client"

import { useMemo, useState } from "react"
import { CalendarClock } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { control } from "@/components/form"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { splitInstant } from "@/lib/time"
import type { Appointment } from "@/types"
import { useAvailability, useReschedule } from "../hooks/useAppointments"

/**
 * Mover un turno de hora.
 *
 * **No es editar: crea un turno nuevo.** El viejo queda en `RESCHEDULED`, los dos
 * quedan enlazados y el historial dice que hubo un cambio. Por eso al terminar la
 * pantalla pasa a mostrar el turno nuevo y no vuelve al viejo, que ya es un
 * registro muerto.
 *
 * **La plata no se muda con el turno.** Lo cobrado queda asentado en el viejo, que
 * a partir de la reprogramación tampoco acepta movimientos. Si había seña, se
 * avisa antes.
 */
export function RescheduleForm({
  appointment,
  onDone,
  onCancel,
}: {
  appointment: Appointment
  /** Recibe el id del turno **nuevo**. */
  onDone: (nuevoId: string) => void
  onCancel: () => void
}) {
  const [fecha, setFecha] = useState(appointment.day)
  const [slot, setSlot] = useState<{ startsAt: string; employeeId: string } | null>(null)

  const reprogramar = useReschedule()

  /**
   * **`availability` acepta un solo `serviceId`.** Con un turno de varios
   * servicios la duración real es la suma, así que los horarios de abajo salen
   * calculados con el primero y se avisa: el que confirma la cuenta completa es
   * el backend, con un 409 si no entra.
   */
  const primerServicio = appointment.services[0]?.serviceId ?? null
  const variosServicios = appointment.services.length > 1

  const disponibilidad = useAvailability({
    branchId: appointment.branch.id,
    serviceId: primerServicio,
    date: fecha,
  })

  const llegada = disponibilidad.dataUpdatedAt
  const slots = useMemo(
    () => (disponibilidad.data?.slots ?? []).filter((s) => new Date(s.startsAt).getTime() > llegada),
    [disponibilidad.data, llegada],
  )

  const error = reprogramar.error
  const chocó = error instanceof ApiError && error.statusCode === 409

  function confirmar() {
    if (!slot) return
    reprogramar.mutate(
      {
        id: appointment.id,
        startsAt: slot.startsAt,
        // Solo si cambia de manos: el turno sigue con el mismo profesional salvo
        // que el horario elegido lo tenga libre otro.
        ...(slot.employeeId !== appointment.employee.id ? { employeeId: slot.employeeId } : {}),
      },
      { onSuccess: (nuevo) => onDone(nuevo.id) },
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-black/[0.08] bg-neutral-50/60 p-3.5">
      <p className="text-[13px] font-medium text-neutral-800">Mover el turno</p>

      <div>
        <label htmlFor="r-fec" className="mb-1.5 block text-xs font-medium text-neutral-600">
          Día
        </label>
        <input
          id="r-fec"
          type="date"
          value={fecha}
          onChange={(e) => {
            setFecha(e.target.value)
            setSlot(null)
          }}
          className={control()}
        />
      </div>

      {variosServicios && (
        <p className="text-xs text-amber-700">
          Este turno tiene {appointment.services.length} servicios. Los horarios se calculan con el
          primero; el total lo valida el servidor al confirmar.
        </p>
      )}

      {disponibilidad.isPending && (
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-neutral-100" />
          ))}
        </div>
      )}

      {disponibilidad.data && slots.length === 0 && (
        <p className="rounded-lg bg-white px-3 py-2.5 text-[13px] text-neutral-500">
          {disponibilidad.data.branchClosed
            ? "Ese día la sucursal está cerrada."
            : "No queda ningún horario libre ese día."}
        </p>
      )}

      {slots.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {slots.map((s) => {
            const primero = s.employees[0]
            const elegido = slot?.startsAt === s.startsAt

            return (
              <button
                key={s.startsAt}
                type="button"
                disabled={!primero}
                onClick={() =>
                  primero && setSlot({ startsAt: s.startsAt, employeeId: primero.employeeId })
                }
                title={s.employees.map((e) => e.employeeName).join(", ")}
                className={cn(
                  "rounded-lg border py-2 text-[13px] transition-colors",
                  elegido
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-black/10 bg-white text-neutral-700 hover:border-violet-400",
                )}
              >
                {splitInstant(s.startsAt).time}
              </button>
            )
          })}
        </div>
      )}

      {error && (
        <p className={cn("text-xs", chocó ? "text-amber-700" : "text-red-600")}>
          {chocó
            ? "Ese horario se ocupó mientras elegías. Probá con otro."
            : apiErrorMessage(error, "No pudimos reprogramar el turno.")}
        </p>
      )}

      <div className="flex gap-2 pt-0.5">
        <button
          type="button"
          onClick={confirmar}
          disabled={!slot || reprogramar.isPending}
          className={cta({ size: "sm" })}
        >
          <CalendarClock size={15} aria-hidden />
          {reprogramar.isPending ? "Moviendo…" : "Mover a este horario"}
        </button>
        <button type="button" onClick={onCancel} className={cta({ variant: "outline", size: "sm" })}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
