"use client"

import { useMemo } from "react"
import Link from "next/link"
import { CalendarDays, Clock, CheckCircle2, Wallet, ArrowRight } from "lucide-react"
import { CtaLink } from "@/components/CtaLink"
import { formatPrice } from "@/lib/format"
import { dateToStr } from "@/lib/time"
import { mockAppointments, mockProfessionals } from "@/features/appointments/data/mockData"
import { STATUS_BADGE, STATUS_LABELS } from "@/features/appointments/lib/status"

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
    <div className="max-w-6xl p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Panel principal</h1>
          <p className="mt-1 text-sm text-neutral-500">Resumen de tu estética de hoy.</p>
        </div>
        <CtaLink href="/agenda" size="sm">
          Ir a la agenda
          <ArrowRight size={15} />
        </CtaLink>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-black/[0.07] bg-white p-5">
            <span
              aria-hidden
              className="mb-4 flex size-9 items-center justify-center rounded-xl border border-violet-100 bg-gradient-to-b from-violet-50 to-white"
            >
              <Icon size={17} className="text-violet-600" />
            </span>
            <p className="text-2xl font-semibold tracking-tight text-neutral-900">{value}</p>
            <p className="mt-1 text-xs text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
            <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">Turnos de hoy</h2>
            <Link href="/agenda" className="text-xs font-medium text-violet-600 transition-colors hover:text-violet-500">
              Ver agenda
            </Link>
          </div>
          {data.todayAppts.length === 0 ? (
            <p className="px-5 py-12 text-center text-[13px] text-neutral-400">No hay turnos para hoy</p>
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {data.todayAppts.map((a) => (
                <li key={a.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-24 text-[13px] font-medium tabular-nums text-neutral-900">
                    {a.startTime} – {a.endTime}
                  </span>
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: a.professional.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-neutral-900">{a.patient.name}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {a.service.name} · {a.professional.name}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_BADGE[a.status]}`}
                  >
                    {STATUS_LABELS[a.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
            <h2 className="mb-4 text-[15px] font-semibold tracking-tight text-neutral-900">Ocupación de hoy</h2>
            <div className="space-y-3">
              {data.byProfessional.map(({ professional, count }) => (
                <div key={professional.id}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="text-neutral-600">{professional.name}</span>
                    <span className="tabular-nums text-neutral-400">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
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

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
            <h2 className="mb-4 text-[15px] font-semibold tracking-tight text-neutral-900">Servicios más pedidos</h2>
            <ul className="space-y-2.5">
              {data.topServices.map(([name, count]) => (
                <li key={name} className="flex items-center justify-between text-[13px]">
                  <span className="truncate text-neutral-600">{name}</span>
                  <span className="ml-2 shrink-0 tabular-nums text-neutral-400">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
