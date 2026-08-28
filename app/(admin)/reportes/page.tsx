"use client"

import { useMemo } from "react"
import { CircleCheck, Clock, Receipt, Wallet } from "lucide-react"
import { cardSurface } from "@/components/surface"
import { pillClasses } from "@/components/Panel"
import { Page, PageHeader } from "../ui/Page"
import { cn } from "@/lib/utils"
import { formatCents } from "@/features/catalog/lib/money"
import { businessNow, today } from "@/lib/time"
import { canManage, useSession } from "@/features/auth/hooks/useAuth"
import { useMonthAppointments } from "@/features/appointments/hooks/useAppointments"
import { DayCollections } from "@/features/payments/components/DayCollections"
import { MonthCollections } from "@/features/payments/components/MonthCollections"
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
  const hoy = useMemo(() => today(), [])
  const mes = hoy.slice(0, 7)

  /**
   * **Lo cobrado del mes pide `OWNER` o `ADMINISTRATIVE`.** A un profesional el
   * endpoint le contesta 403, así que el panel no se monta — pero la pantalla
   * sí: lo agendado y los turnos de hoy los puede ver cualquiera, y esconderle
   * `/reportes` entero le sacaría algo que hoy tiene.
   */
  const { data: session } = useSession()
  const vePlataDelNegocio = canManage(session?.employee.role)

  /**
   * Las cuentas viven en `features/reports/lib/revenue.ts` y no acá, así que
   * esta pantalla solo elige el período y compone. **Los montos vienen en
   * centavos**: los formatea `formatCents`.
   */
  const query = useMonthAppointments(businessNow())
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
        /*
          La bajada cambia con el rol porque el panel de lo cobrado no se monta
          para un profesional: prometerle "cuánto entró en la caja" y no
          mostrárselo se lee como si faltara algo.
        */
        description={
          vePlataDelNegocio
            ? "Cuánto se agendó este mes y cuánto entró en la caja. No son lo mismo."
            : "Cuánto se agendó este mes. Es lo pactado, no lo que entró en la caja."
        }
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
            `totalPriceCents`, que es lo que se pactó al reservar. Lo que
            realmente entró está abajo, en "Lo cobrado": son dos cifras distintas
            y confundirlas es leer como plata en la caja algo que todavía no lo es.
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
          Dos preguntas distintas, no una repetida: arriba **cuánto entró** en el
          mes, que sale de los pagos acreditados; abajo **quién quedó debiendo**
          hoy, que sale del saldo de cada turno y por eso sigue costando un pedido
          por turno.
        */}
        {vePlataDelNegocio && <MonthCollections month={mes} label={monthLabel(mes)} />}

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
