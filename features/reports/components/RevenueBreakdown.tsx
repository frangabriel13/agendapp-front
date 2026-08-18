import { Panel, PanelHeader } from "@/components/Panel"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import type { RevenueSlice } from "../lib/revenue"

/**
 * Un corte de la facturación: por servicio, por profesional, por lo que sea.
 *
 * La barra va detrás del texto y no al lado: con una lista de nombres largos,
 * una columna de barras aparte deja el nombre lejos de su propio dato.
 */
export function RevenueBreakdown({
  title,
  slices,
  empty,
}: {
  title: string
  slices: RevenueSlice[]
  empty: string
}) {
  return (
    <Panel className="flex flex-col">
      <PanelHeader title={title} />

      {slices.length === 0 ? (
        <p className="px-5 pb-10 text-center text-[13px] text-neutral-500">{empty}</p>
      ) : (
        <ul className="space-y-1 px-5 pb-5">
          {slices.map((slice) => (
            <li key={slice.label} className="relative isolate overflow-hidden rounded-xl px-3 py-2.5">
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 -z-10 rounded-xl bg-violet-100/70"
                style={{ width: `${slice.share * 100}%` }}
              />
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-900">
                  {slice.label}
                </span>
                <span className="shrink-0 text-[11px] text-neutral-500 tabular-nums">
                  {slice.turnos} {slice.turnos === 1 ? "turno" : "turnos"}
                </span>
                <span
                  className={cn(
                    "w-24 shrink-0 text-right text-[13px] font-semibold text-neutral-900 tabular-nums",
                  )}
                >
                  {formatPrice(slice.total)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
