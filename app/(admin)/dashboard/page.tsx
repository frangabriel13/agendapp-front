"use client"

import { useMemo } from "react"
import { ArrowRight, CalendarDays, CheckCircle2, Clock, Wallet } from "lucide-react"
import { CtaLink } from "@/components/CtaLink"
import { Glow } from "@/components/Glow"
import { pillClasses } from "@/components/Panel"
import { Page, PageHeader } from "../ui/Page"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import { dateToStr } from "@/lib/time"
import { useSession } from "@/features/auth/hooks/useAuth"
import { mockAppointments } from "@/features/appointments/data/mockData"
import { AbsenceTimeline } from "@/features/dashboard/components/AbsenceTimeline"
import { QuickActions } from "@/features/dashboard/components/QuickActions"
import { StatTiles, type Stat } from "@/features/dashboard/components/StatTiles"
import { TeamCard } from "@/features/dashboard/components/TeamCard"
import { UpcomingAppointments } from "@/features/dashboard/components/UpcomingAppointments"

export default function DashboardPage() {
  const { data: session } = useSession()

  /**
   * Los turnos todavía salen de datos de ejemplo: el backend no expone la
   * agenda. El equipo y las ausencias del calendario sí son reales, por eso el
   * aviso está en el título y no encima de todo el panel.
   */
  const agenda = useMemo(() => {
    const hoy = dateToStr(new Date())
    const mes = hoy.slice(0, 7)

    const deHoy = mockAppointments
      .filter((appointment) => appointment.date === hoy && appointment.status !== "cancelled")
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    const facturable = mockAppointments.filter(
      (appointment) =>
        appointment.date.startsWith(mes) &&
        (appointment.status === "confirmed" || appointment.status === "completed"),
    )

    return {
      deHoy,
      confirmados: deHoy.filter((appointment) => appointment.status === "confirmed").length,
      pendientes: deHoy.filter((appointment) => appointment.status === "pending").length,
      facturacion: facturable.reduce((total, appointment) => total + appointment.service.price, 0),
    }
  }, [])

  const stats: Stat[] = [
    {
      label: "Turnos hoy",
      value: String(agenda.deHoy.length),
      hint: agenda.deHoy.length === 0 ? "Agenda libre" : "Sin contar los cancelados",
      icon: CalendarDays,
    },
    {
      label: "Confirmados",
      value: String(agenda.confirmados),
      hint: `de ${agenda.deHoy.length} turnos de hoy`,
      icon: CheckCircle2,
    },
    {
      label: "Pendientes",
      value: String(agenda.pendientes),
      hint: agenda.pendientes === 0 ? "Nada por confirmar" : "Esperan confirmación",
      icon: Clock,
    },
    {
      label: "Facturación",
      value: formatPrice(agenda.facturacion),
      hint: "En lo que va del mes",
      icon: Wallet,
    },
  ]

  return (
    <Page width="wide" className="relative isolate">
      {/* El mismo halo del landing, para que el panel no arranque en gris plano.
          Debajo de `sm` no entra sin teñir el título: ahí la columna es angosta
          y el halo le queda encima. */}
      <Glow className="-top-28 right-0 hidden size-80 bg-violet-200/35 sm:block" />

      <PageHeader
        title="Panel"
        description={
          session
            ? `Lo que está pasando hoy en ${session.tenant.businessName}.`
            : "Lo que está pasando hoy en tu negocio."
        }
        badge={<span className={cn(pillClasses, "text-neutral-500")}>Turnos de ejemplo</span>}
        action={
          <CtaLink href="/agenda" size="sm">
            Ir a la agenda
            <ArrowRight size={15} />
          </CtaLink>
        }
      />

      <div className="space-y-4">
        <StatTiles stats={stats} />

        <AbsenceTimeline />

        {/* Tres columnas de igual peso: ninguna es "la principal". */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <UpcomingAppointments appointments={agenda.deHoy} />
          <TeamCard />
          <QuickActions />
        </div>
      </div>
    </Page>
  )
}
