"use client"

import { useMemo } from "react"
import { Page } from "../ui/Page"
import { businessNow, dateToStr } from "@/lib/time"
import { useMonthAppointments } from "@/features/appointments/hooks/useAppointments"
import { ocupaAgenda } from "@/features/appointments/lib/status"
import { TeamAvailability } from "@/features/dashboard/components/TeamAvailability"
import { RevenueCard } from "@/features/dashboard/components/RevenueCard"
import { TeamCard } from "@/features/dashboard/components/TeamCard"
import { UpcomingAppointments } from "@/features/dashboard/components/UpcomingAppointments"

export default function DashboardPage() {
  const now = useMemo(() => businessNow(), [])

  /**
   * El mes entero con colchón: el calendario de arriba mira la semana y la
   * tarjeta de facturación compara contra el mes anterior, así que una sola
   * consulta alimenta las cuatro tarjetas.
   */
  const query = useMonthAppointments(now)
  const appointments = useMemo(() => query.data ?? [], [query.data])

  const deHoy = useMemo(() => {
    const hoy = dateToStr(now)

    return appointments
      .filter((appointment) => appointment.day === hoy && ocupaAgenda(appointment.status))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [appointments, now])

  return (
    /*
     * Sin título de página: la barra de arriba ya dice que estás en Inicio, y el
     * encabezado grande es el de la tarjeta principal. Repetirlo comía una
     * franja entera de alto para decir dos veces lo mismo.
     */
    <Page width="full" className="flex flex-1 flex-col gap-3">
      <TeamAvailability appointments={appointments} />

      {/*
        Tres columnas de igual peso: ninguna es "la principal".

        `flex-1` les da el alto que sobra, así el tablero llega hasta abajo en vez
        de dejar un vacío. Cuando el contenido pasa el alto visible —un equipo
        grande, o un teléfono— no aprieta nada: ahí no sobra alto y `main` scrollea.
      */}
      <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-3">
        <UpcomingAppointments appointments={deHoy} />
        <TeamCard />
        {/* Todos los turnos, no los de hoy: la tarjeta mira el mes y el anterior. */}
        <RevenueCard appointments={appointments} />
      </div>
    </Page>
  )
}
