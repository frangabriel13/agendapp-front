"use client"

import { useMemo } from "react"
import { CircleCheck, Clock, Receipt, Wallet } from "lucide-react"
import { cardSurface } from "@/components/surface"
import { pillClasses } from "@/components/Panel"
import { Page, PageHeader } from "../ui/Page"
import { cn } from "@/lib/utils"
import { formatCents } from "@/features/catalog/lib/money"
import { dateToStr } from "@/lib/time"
import { useMonthAppointments } from "@/features/appointments/hooks/useAppointments"
import { DayCollections } from "@/features/payments/components/DayCollections"
import { RevenueBreakdown } from "@/features/reports/components/RevenueBreakdown"
import {
  monthLabel,
  monthRevenue,
  revenueByProfessional,
  revenueByService,
} from "@/features/reports/lib/revenue"

export default function ReportesPage() {
  // Se fija al montar: recalcularlo en cada render cambiaría el mes debajo del
  // mouse al cruzar la medianoche con la pantalla abierta.
  const hoy = useMemo(() => dateToStr(new Date()), [])
  const mes = hoy.slice(0, 7)

  /**
   * Las cuentas viven en `features/reports/lib/revenue.ts` y no acá, así que
   * esta pantalla solo elige el período y compone. **Los montos vienen en
   * centavos**: los formatea `formatCents`.
   */
  const query = useMonthAppointments(new Date())
  const appointments = useMemo(() => query.data ?? [], [query.data])
  const deHoy = useMemo(() => appointments.filter((a) => a.day === hoy), [appointments, hoy])

  const { revenue, porServicio, porProfesional } = useMemo(
    () => ({
      revenue: monthRevenue(appointments, mes),
      porServicio: revenueByService(appointments, mes),
      porProfesional: revenueByProfessional(appointments, mes),
    }),
    [appointments, mes],
  )

  return (
    <Page width="wide">
      <PageHeader
        title="Reportes"
        description="Cuánto se agendó este mes. Es lo pactado, no lo que entró en la caja."
        badge={
          <span className={cn(pillClasses, "text-neutral-500")}>
            <Receipt size={12} aria-hidden />
            {monthLabel(mes)}
          </span>
        }
      />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/*
            **Dice "agendado" y no "facturación" a propósito.** Sale de
            `totalPriceCents`, que es lo que se pactó al reservar; lo que
            realmente entró son los pagos, y la API no los expone de a un mes.
            Llamar "facturación" a esto hacía que la cifra se leyera como plata en
            la caja.
          */}
          <Cifra
            icon={Wallet}
            label="Agendado en total"
            valor={formatCents(revenue.total)}
            hint={`${revenue.turnos} ${revenue.turnos === 1 ? "turno" : "turnos"}`}
          />
          <Cifra
            icon={CircleCheck}
            label="Ya atendidos"
            valor={formatCents(revenue.atendido)}
            hint="Turnos que ya ocurrieron"
          />
          <Cifra
            icon={Clock}
            label="Por atender"
            valor={formatCents(revenue.agendado)}
            hint="Confirmados, todavía no ocurrieron"
          />
          <Cifra
            icon={Receipt}
            label="Ticket promedio"
            valor={formatCents(revenue.ticketPromedio)}
            hint="Por turno facturado"
          />
        </div>

        {revenue.sinConfirmar > 0 && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            Hay {formatCents(revenue.sinConfirmar)} en turnos reservados sin confirmar. No entran en
            ninguna de las cifras de arriba hasta que se confirmen.
          </p>
        )}

        {/*
          Lo cobrado va acá abajo y **solo del día**: la API da los pagos de a un
          turno, así que un mes serían cientos de pedidos. Ver `useDayCollections`.
        */}
        <DayCollections day={hoy} appointments={deHoy} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RevenueBreakdown
            title="Por servicio"
            slices={porServicio}
            empty="Todavía no hay turnos agendados este mes."
          />
          <RevenueBreakdown
            title="Por profesional"
            slices={porProfesional}
            empty="Todavía no hay turnos agendados este mes."
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
