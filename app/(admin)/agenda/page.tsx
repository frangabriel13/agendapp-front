"use client"

import { useState } from "react"
import { WeekCalendar } from "@/features/appointments/components/WeekCalendar"
import { AppointmentModal } from "@/features/appointments/components/AppointmentModal"
import { AppointmentFormModal } from "@/features/appointments/components/AppointmentFormModal"
import { mockAppointments, mockProfessionals, mockServices } from "@/features/appointments/data/mockData"
import { dateToStr } from "@/lib/time"
import type { Appointment, AppointmentStatus } from "@/types"

interface FormState {
  mode: "create" | "edit"
  initial: {
    date: string
    startTime: string
    professionalId?: string
    appointment?: Appointment
  }
}

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)

  const detail = appointments.find((a) => a.id === detailId) ?? null

  function openNew() {
    setForm({ mode: "create", initial: { date: dateToStr(new Date()), startTime: "09:00" } })
  }

  function openSlot(date: string, startTime: string) {
    setForm({ mode: "create", initial: { date, startTime } })
  }

  function openEdit(appointment: Appointment) {
    setDetailId(null)
    setForm({
      mode: "edit",
      initial: { date: appointment.date, startTime: appointment.startTime, appointment },
    })
  }

  function handleSubmit(appointment: Appointment) {
    setAppointments((prev) => {
      const exists = prev.some((a) => a.id === appointment.id)
      return exists ? prev.map((a) => (a.id === appointment.id ? appointment : a)) : [...prev, appointment]
    })
    setForm(null)
  }

  function changeStatus(status: AppointmentStatus) {
    if (!detail) return
    setAppointments((prev) => prev.map((a) => (a.id === detail.id ? { ...a, status } : a)))
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
        <p className="text-gray-500 text-sm">Gestión de turnos</p>
      </div>
      <div className="flex-1 overflow-hidden border-t border-gray-200">
        <WeekCalendar
          professionals={mockProfessionals}
          appointments={appointments}
          selectedId={detailId}
          onAppointmentClick={(a) => setDetailId(a.id)}
          onSlotClick={openSlot}
          onNew={openNew}
        />
      </div>

      {detail && (
        <AppointmentModal
          appointment={detail}
          onClose={() => setDetailId(null)}
          onChangeStatus={changeStatus}
          onEdit={() => openEdit(detail)}
        />
      )}

      {form && (
        <AppointmentFormModal
          mode={form.mode}
          professionals={mockProfessionals}
          services={mockServices}
          initial={form.initial}
          onClose={() => setForm(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
