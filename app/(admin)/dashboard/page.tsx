"use client"

import { useMemo } from "react"
import Link from "next/link"
import { CalendarDays, Clock, CheckCircle2, Wallet, ArrowRight } from "lucide-react"
import { mockAppointments, mockProfessionals } from "@/features/appointments/data/mockData"
import { STATUS_BADGE, STATUS_LABELS } from "@/features/appointments/lib/status"
import { dateToStr } from "@/lib/time"

function formatPrice(price: number): string {
  return price.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
}

export default function DashboardPage() {
  const data = useMemo(() => {
    const today = dateToStr(new Date())
    const month = today.slice(0, 7)

    const todayAppts = mockAppointments
      .filter((a) => a.date === today)
      .sort((x, y) => x.startTime.localeCompare(y.startTime))

    const billable = mockAppointments.filter(
      (a) => a.date.startsWith(month) && (a.status === "confirmed" || a.status === "completed")
    )
    const revenue = billable.reduce((sum, a) => sum + a.service.price, 0)

    const byProfessional = mockProfessionals.map((p) => ({
      professional: p,
      count: todayAppts.filter((a) => a.professionalId === p.id && a.status !== "cancelled").length,
    }))
    const maxCount = Math.max(1, ...byProfessional.map((b) => b.count))

    const serviceCounts = new Map<string, number>()
    for (const a of mockAppointments) {
      serviceCounts.set(a.service.name, (serviceCounts.get(a.service.name) ?? 0) + 1)
    }
    const topServices = [...serviceCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)

    return {
      todayAppts,
      confirmed: todayAppts.filter((a) => a.status === "confirmed").length,
      pending: todayAppts.filter((a) => a.status === "pending").length,
      revenue,
      byProfessional,
      maxCount,
      topServices,
    }
  }, [])

  const kpis = [
    { label: "Turnos hoy", value: String(data.todayAppts.length), icon: CalendarDays },
    { label: "Confirmados hoy", value: String(data.confirmed), icon: CheckCircle2 },
    { label: "Pendientes hoy", value: String(data.pending), icon: Clock },
    { label: "Facturación del mes", value: formatPrice(data.revenue), icon: Wallet },
  ]

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Panel principal</h1>
          <p className="text-gray-500 text-sm">Resumen de tu estética de hoy</p>
        </div>
        <Link
          href="/agenda"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-violet-600 text-white rounded-md font-medium hover:bg-violet-500 transition-colors"
        >
          Ir a la agenda
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center mb-3">
              <Icon size={18} className="text-violet-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Turnos de hoy</h2>
            <Link href="/agenda" className="text-xs text-violet-600 font-medium hover:underline">
              Ver agenda
            </Link>
          </div>
          {data.todayAppts.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">No hay turnos para hoy</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.todayAppts.map((a) => (
                <li key={a.id} className="px-5 py-3 flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900 tabular-nums w-24">
                    {a.startTime} – {a.endTime}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: a.professional.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.patient.name}</p>
                    <p className="text-xs text-gray-500 truncate">{a.service.name} · {a.professional.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${STATUS_BADGE[a.status]}`}>
                    {STATUS_LABELS[a.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Ocupación de hoy</h2>
            <div className="space-y-3">
              {data.byProfessional.map(({ professional, count }) => (
                <div key={professional.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{professional.name}</span>
                    <span className="text-gray-400 tabular-nums">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / data.maxCount) * 100}%`,
                        backgroundColor: professional.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Servicios más pedidos</h2>
            <ul className="space-y-2.5">
              {data.topServices.map(([name, count]) => (
                <li key={name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate">{name}</span>
                  <span className="text-gray-400 tabular-nums shrink-0 ml-2">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
