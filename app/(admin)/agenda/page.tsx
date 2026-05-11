"use client"

import { WeekCalendar } from "@/features/appointments/components/WeekCalendar"
import { mockAppointments, mockProfessionals } from "@/features/appointments/data/mockData"

export default function AgendaPage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <p className="text-muted-foreground text-sm">Gestión de turnos</p>
      </div>
      <div className="flex-1 overflow-hidden border-t border-border">
        <WeekCalendar
          professionals={mockProfessionals}
          appointments={mockAppointments}
        />
      </div>
    </div>
  )
}
