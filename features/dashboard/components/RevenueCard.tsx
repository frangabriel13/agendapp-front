"use client"

import { useMemo } from "react"
import { Receipt } from "lucide-react"
import { Panel, PanelHeader, PanelLink } from "@/components/Panel"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import { dateToStr } from "@/lib/time"
import { monthLabel, monthRevenue } from "@/features/reports/lib/revenue"
import type { Appointment } from "@/types"

/**
 * La plata del mes.
 *
 * Dos números y no uno: "facturación" a secas mezcla lo que ya se atendió con lo
 * que está agendado y todavía puede caerse. Partirlo es la diferencia entre un
 * dato y un dato en el que se puede confiar.
 *
 * Recibe los turnos en vez de pedirlos: hoy salen de datos de ejemplo y mañana
 * de la API, y esta tarjeta no tiene por qué enterarse.
 */
export function RevenueCard({ appointments }: { appointments: Appointment[] }) {
  const mes = useMemo(() => dateToStr(new Date()).slice(0, 7), [])
  const revenue = useMemo(() => monthRevenue(appointments, mes), [appointments, mes])

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Facturación"
        badge={<Periodo mes={mes} />}
        action={<PanelLink href="/reportes">Ver reportes</PanelLink>}
      />

      <div className="flex flex-1 flex-col px-5 pb-5">
        <p className="text-[32px] leading-none font-semibold tracking-tight text-neutral-900">
          {formatPrice(revenue.total)}
        </p>
        <p className="mt-1.5 text-[13px] text-neutral-500">
          {revenue.turnos === 0
            ? "Todavía no hay turnos que facturen"
            : `${revenue.turnos} ${revenue.turnos === 1 ? "turno" : "turnos"} · ${formatPrice(revenue.ticketPromedio)} promedio`}
        </p>

        {revenue.total > 0 && (
          <>
            <SplitBar atendido={revenue.atendido} agendado={revenue.agendado} total={revenue.total} />

            <dl className="mt-4 space-y-2.5">
              <Linea color="bg-emerald-500" label="Ya atendidos" valor={revenue.atendido} />
              <Linea color="bg-violet-500" label="Agendados" valor={revenue.agendado} />
            </dl>
          </>
        )}

        {revenue.sinConfirmar > 0 && (
          // `mt-auto`: la tarjeta se estira hasta el alto de sus vecinas y el
          // aviso queda al pie en vez de dejar el hueco abajo.
          <p className="mt-auto rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-amber-800">
            {formatPrice(revenue.sinConfirmar)} en turnos sin confirmar. No entran en el total hasta
            que se confirmen.
          </p>
        )}
      </div>
    </Panel>
  )
}

function Periodo({ mes }: { mes: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
      <Receipt size={12} aria-hidden />
      {monthLabel(mes)}
    </span>
  )
}

/**
 * Una sola barra partida en dos, no dos barras.
 *
 * Lo que interesa es la proporción entre lo hecho y lo prometido; con barras
 * separadas hay que compararlas a ojo.
 */
function SplitBar({
  atendido,
  agendado,
  total,
}: {
  atendido: number
  agendado: number
  total: number
}) {
  const porcentaje = (valor: number) => `${(valor / total) * 100}%`

  return (
    <div aria-hidden className="mt-5 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-neutral-100">
      <span className="rounded-full bg-emerald-500" style={{ width: porcentaje(atendido) }} />
      <span className="rounded-full bg-violet-500" style={{ width: porcentaje(agendado) }} />
    </div>
  )
}

function Linea({ color, label, valor }: { color: string; label: string; valor: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", color)} />
      <dt className="text-[13px] text-neutral-600">{label}</dt>
      <dd className="ml-auto text-[13px] font-medium text-neutral-900 tabular-nums">
        {formatPrice(valor)}
      </dd>
    </div>
  )
}
