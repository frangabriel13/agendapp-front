"use client"

import { Loader2, RotateCw } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { cardSurface } from "@/components/surface"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { formatCents } from "@/features/catalog/lib/money"
import { useMonthCollections } from "../hooks/usePayments"

/**
 * Lo que entró en la caja este mes.
 *
 * **Es la otra mitad de `/reportes`**, que arriba muestra lo *agendado* —lo que
 * se pactó al reservar—. Las dos cifras son distintas y la diferencia es el
 * punto: un mes puede tener mucho agendado y poco cobrado.
 *
 * **No dice qué falta cobrar.** El endpoint filtra por cuándo entró la plata, así
 * que un cobro pendiente no tiene fecha y no puede aparecer. La deuda del día
 * sale de `DayCollections`, que la calcula sobre el saldo de cada turno.
 *
 * **Solo lo monta quien puede verlo** (`canManage`): a un profesional el endpoint
 * le contesta 403.
 */
export function MonthCollections({ month, label }: { month: string; label: string }) {
  const query = useMonthCollections(month, true)
  const totals = query.data?.totals

  return (
    <div className={cn(cardSurface, "p-5")}>
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
          {/*
            En minúscula porque acá el mes va en medio de una oración; `monthLabel`
            lo devuelve capitalizado para usarlo suelto, como en el badge del
            período. Mismo criterio que `Variacion` en `RevenueCard`.
          */}
          Lo cobrado en {label.toLowerCase()}
        </h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          Plata que entró de verdad, no lo que se agendó.
        </p>
      </div>

      {query.isPending && (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-neutral-500">
          <Loader2 size={14} className="animate-spin" aria-hidden />
          Sumando los cobros del mes…
        </p>
      )}

      {query.isError && (
        <div className="mt-4">
          <p className="text-[13px] text-neutral-600">
            {apiErrorMessage(query.error, "No pudimos traer lo cobrado del mes.")}
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

      {totals && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[22px] leading-none font-semibold tracking-tight text-emerald-700">
                {formatCents(totals.netCents)}
              </p>
              <p className="mt-1.5 text-[13px] text-neutral-600">Entró en total</p>
            </div>
            <div>
              <p className="text-[22px] leading-none font-semibold tracking-tight text-neutral-900">
                {formatCents(totals.chargedCents)}
              </p>
              <p className="mt-1.5 text-[13px] text-neutral-600">Cobrado</p>
            </div>
            <div>
              {/*
                Las devoluciones se apagan en cero: en gris no llaman la atención
                cuando no hubo ninguna, que es lo normal, y se leen cuando sí.
              */}
              <p
                className={cn(
                  "text-[22px] leading-none font-semibold tracking-tight",
                  totals.refundedCents > 0 ? "text-amber-700" : "text-neutral-400",
                )}
              >
                {formatCents(totals.refundedCents)}
              </p>
              <p className="mt-1.5 text-[13px] text-neutral-600">Devuelto</p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-neutral-400">
            {/*
              Se aclara que no es una foto congelada porque el mismo mes puede dar
              distinto en dos momentos: una reversión de octubre sobre un cobro de
              septiembre cambia el septiembre que se muestra hoy.
            */}
            Refleja el estado de hoy de los cobros del mes. Lo que todavía falta cobrar no está acá:
            se ve turno por turno.
          </p>
        </>
      )}
    </div>
  )
}
