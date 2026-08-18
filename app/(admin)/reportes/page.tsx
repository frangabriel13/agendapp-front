"use client"

import { useMemo } from "react"
import { CircleCheck, Clock, Receipt, Wallet } from "lucide-react"
import { cardSurface } from "@/components/surface"
import { pillClasses } from "@/components/Panel"
import { Page, PageHeader } from "../ui/Page"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import { dateToStr } from "@/lib/time"
import { mockAppointments } from "@/features/appointments/data/mockData"
import { RevenueBreakdown } from "@/features/reports/components/RevenueBreakdown"
import {
  monthLabel,
  monthRevenue,
  revenueByProfessional,
  revenueByService,
} from "@/features/reports/lib/revenue"

export default function ReportesPage() {
  const mes = useMemo(() => dateToStr(new Date()).slice(0, 7), [])

  /**
   * Los turnos todavía salen de datos de ejemplo: el backend no expone la agenda
   * ni los pagos. Las cuentas viven en `features/reports/lib/revenue.ts` y no
   * acá, así que cuando exista la API solo cambia de dónde salen los turnos.
   */
  const { revenue, porServicio, porProfesional } = useMemo(
    () => ({
      revenue: monthRevenue(mockAppointments, mes),
      porServicio: revenueByService(mockAppointments, mes),
      porProfesional: revenueByProfessional(mockAppointments, mes),
    }),
    [mes],
  )

  return (
    <Page width="wide">
      <PageHeader
        title="Reportes"
        description="Cómo viene la facturación del mes."
        badge={
          <span className={cn(pillClasses, "text-neutral-500")}>
            <Receipt size={12} aria-hidden />
            {monthLabel(mes)}
          </span>
        }
      />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Cifra
            icon={Wallet}
            label="Facturación"
            valor={formatPrice(revenue.total)}
            hint={`${revenue.turnos} ${revenue.turnos === 1 ? "turno" : "turnos"}`}
          />
          <Cifra
            icon={CircleCheck}
            label="Ya atendidos"
            valor={formatPrice(revenue.atendido)}
            hint="Turnos que ya ocurrieron"
          />
          <Cifra
            icon={Clock}
            label="Agendados"
            valor={formatPrice(revenue.agendado)}
            hint="Confirmados, todavía por atender"
          />
          <Cifra
            icon={Receipt}
            label="Ticket promedio"
            valor={formatPrice(revenue.ticketPromedio)}
            hint="Por turno facturado"
          />
        </div>

        {revenue.sinConfirmar > 0 && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            Hay {formatPrice(revenue.sinConfirmar)} en turnos reservados sin confirmar. No entran en
            ninguna de las cifras de arriba hasta que se confirmen.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RevenueBreakdown
            title="Por servicio"
            slices={porServicio}
            empty="Todavía no hay turnos facturados este mes."
          />
          <RevenueBreakdown
            title="Por profesional"
            slices={porProfesional}
            empty="Todavía no hay turnos facturados este mes."
          />
        </div>
      </div>
    </Page>
  )
}

function Cifra({
  icon: Icon,
  label,
  valor,
  hint,
}: {
  icon: typeof Wallet
  label: string
  valor: string
  hint: string
}) {
  return (
    <div className={cn(cardSurface, "relative isolate flex flex-col gap-3 overflow-hidden p-5")}>
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-8 -z-10 size-24 rounded-full bg-violet-100/60 blur-2xl"
      />
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-xl border border-violet-100 bg-gradient-to-b from-violet-50 to-white"
      >
        <Icon size={17} className="text-violet-600" />
      </span>
      <div>
        <p className="text-[22px] leading-none font-semibold tracking-tight text-neutral-900">
          {valor}
        </p>
        <p className="mt-1.5 text-[13px] font-medium text-neutral-700">{label}</p>
        <p className="text-xs text-neutral-400">{hint}</p>
      </div>
    </div>
  )
}
