"use client"

import { useState } from "react"
import { HandCoins, Loader2, RotateCw } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { cardSurface } from "@/components/surface"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { formatCents } from "@/features/catalog/lib/money"
import type { Appointment } from "@/types"
import { useDayCollections } from "../hooks/usePayments"

/**
 * Quién se fue sin pagar, de los turnos de hoy.
 *
 * **No es un arqueo de caja y no dice serlo.** Un arqueo responde "cuánto entró
 * hoy", lo que incluye la seña que alguien pagó hoy para un turno del mes que
 * viene; para saber eso habría que mirar los pagos de todos los turnos, y la API
 * los da de a uno. La pregunta que sí se puede contestar —y es la del cierre del
 * día— es quién quedó debiendo.
 *
 * **Arranca apagado.** Cuesta un pedido por turno del día, así que se enciende
 * cuando alguien lo pide y no apenas se abre la pantalla.
 */
export function DayCollections({ day, appointments }: { day: string; appointments: Appointment[] }) {
  const [encendido, setEncendido] = useState(false)
  const query = useDayCollections(day, appointments, encendido)

  return (
    <div className={cn(cardSurface, "p-5")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
            Los turnos de hoy
          </h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Cuánto se cobró y quién quedó debiendo.
          </p>
        </div>

        {!encendido && appointments.length > 0 && (
          <button
            type="button"
            onClick={() => setEncendido(true)}
            className={cta({ variant: "outline", size: "sm" })}
          >
            <HandCoins size={15} aria-hidden />
            Ver los cobros
          </button>
        )}
      </div>

      {appointments.length === 0 && (
        <p className="mt-4 text-[13px] text-neutral-400">Hoy no hay turnos.</p>
      )}

      {encendido && query.isPending && (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-neutral-500">
          <Loader2 size={14} className="animate-spin" aria-hidden />
          {/* Se dice cuántos son porque **son un pedido cada uno**: sin eso, un
              día con treinta turnos parece colgado. */}
          Consultando {appointments.length} {appointments.length === 1 ? "turno" : "turnos"}…
        </p>
      )}

      {encendido && query.isError && (
        <div className="mt-4">
          <p className="text-[13px] text-neutral-600">
            {apiErrorMessage(query.error, "No pudimos traer los cobros de hoy.")}
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className={cn(cta({ variant: "outline", size: "sm" }), "mt-2.5")}
          >
            <RotateCw size={14} aria-hidden />
            Reintentar
          </button>
        </div>
      )}

      {query.data && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[22px] leading-none font-semibold tracking-tight text-emerald-700">
                {formatCents(query.data.cobrado)}
              </p>
              <p className="mt-1.5 text-[13px] text-neutral-600">Cobrado</p>
            </div>
            <div>
              <p
                className={cn(
                  "text-[22px] leading-none font-semibold tracking-tight",
                  query.data.pendiente > 0 ? "text-amber-700" : "text-neutral-400",
                )}
              >
                {formatCents(query.data.pendiente)}
              </p>
              <p className="mt-1.5 text-[13px] text-neutral-600">Por cobrar</p>
            </div>
          </div>

          {query.data.deudores.length > 0 ? (
            <ul className="mt-4 divide-y divide-black/[0.06] border-t border-black/[0.06]">
              {query.data.deudores.map((deudor) => (
                <li key={deudor.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate text-[13px] text-neutral-700">{deudor.nombre}</span>
                  <span className="text-[13px] font-medium text-neutral-900">
                    {formatCents(deudor.cents)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 border-t border-black/[0.06] pt-3 text-[13px] text-neutral-500">
              No quedó nadie debiendo.
            </p>
          )}

          <p className="mt-3 text-xs leading-relaxed text-neutral-400">
            Es la plata de los {query.data.turnos}{" "}
            {query.data.turnos === 1 ? "turno" : "turnos"} de hoy. No incluye señas cobradas hoy
            para turnos de otro día.
          </p>
        </>
      )}
    </div>
  )
}
