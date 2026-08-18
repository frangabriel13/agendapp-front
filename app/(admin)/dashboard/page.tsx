"use client"

import { useMemo } from "react"
import { CalendarDays, CheckCircle2, Clock, Wallet } from "lucide-react"
import { Page } from "../ui/Page"
import { formatPrice } from "@/lib/format"
import { dateToStr } from "@/lib/time"
import { mockAppointments } from "@/features/appointments/data/mockData"
import { AbsenceTimeline } from "@/features/dashboard/components/AbsenceTimeline"
import { QuickActions } from "@/features/dashboard/components/QuickActions"
import { StatTiles, type Stat } from "@/features/dashboard/components/StatTiles"
import { TeamCard } from "@/features/dashboard/components/TeamCard"
import { UpcomingAppointments } from "@/features/dashboard/components/UpcomingAppointments"

export default function DashboardPage() {
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
    /*
     * Sin título de página: la barra de arriba ya dice que estás en Inicio, y el
     * encabezado grande es el de la tarjeta principal. Repetirlo comía una
     * franja entera de alto para decir dos veces lo mismo.
     */
    <Page width="full">
      <div className="space-y-3">
        <StatTiles stats={stats} />

        <AbsenceTimeline />

        {/* Tres columnas de igual peso: ninguna es "la principal". */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <UpcomingAppointments appointments={agenda.deHoy} />
          <TeamCard />
          <QuickActions />
        </div>
      </div>
    </Page>
  )
}
