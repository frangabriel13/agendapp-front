"use client"

import { useState } from "react"
import { RotateCw, UserPlus, Users } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { canManage, useSession } from "@/features/auth/hooks/useAuth"
import { ActivationLinkDialog } from "@/features/employees/components/ActivationLinkDialog"
import { EmployeeRow } from "@/features/employees/components/EmployeeRow"
import { InviteEmployeeDialog } from "@/features/employees/components/InviteEmployeeDialog"
import { ScheduleDialog } from "@/features/employees/components/ScheduleDialog"
import { TimeOffDialog } from "@/features/employees/components/TimeOffDialog"
import { apiErrorMessage } from "@/lib/errors"
import { useEmployees } from "@/features/employees/hooks/useEmployees"
import type { Employee, EmployeeInvitation } from "@/types"

export default function EquipoPage() {
  const { data: session } = useSession()
  const employees = useEmployees()
  const [inviting, setInviting] = useState(false)
  const [invitation, setInvitation] = useState<EmployeeInvitation | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<Employee | null>(null)
  const [editingTimeOff, setEditingTimeOff] = useState<Employee | null>(null)

  const manage = canManage(session?.employee.role)

  return (
    <div className="p-5 sm:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Equipo</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Quién trabaja en tu estética y a qué tiene acceso.
          </p>
        </div>

        {manage && (
          <button type="button" onClick={() => setInviting(true)} className={cn(cta({ size: "sm" }))}>
            <UserPlus size={15} />
            Invitar
          </button>
        )}
      </div>

      <div className="max-w-3xl overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
        {employees.isPending && <RowsSkeleton />}

        {employees.isError && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-neutral-900">No pudimos cargar el equipo</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-neutral-500">
              {apiErrorMessage(employees.error, "Revisá tu conexión y probá de nuevo.")}
            </p>
            <button
              type="button"
              onClick={() => employees.refetch()}
              className={cn(cta({ variant: "outline", size: "sm" }), "mt-5")}
            >
              <RotateCw size={15} />
              Reintentar
            </button>
          </div>
        )}

        {employees.data?.length === 0 && (
          <div className="px-5 py-12 text-center">
            <Users size={28} aria-hidden className="mx-auto mb-3 text-neutral-300" />
            <p className="text-sm font-medium text-neutral-900">Todavía no hay nadie más</p>
            <p className="mt-1 text-[13px] text-neutral-500">
              {manage ? "Invitá a alguien para que empiece a usar la agenda." : "Pedile a un administrador que sume gente."}
            </p>
          </div>
        )}

        {employees.data && employees.data.length > 0 && (
          <ul className="divide-y divide-black/[0.06]">
            {employees.data.map((employee) => (
              <EmployeeRow
                key={employee.id}
                employee={employee}
                canManage={manage}
                currentEmployeeId={session?.employee.id}
                onInvitation={setInvitation}
                onEditSchedule={setEditingSchedule}
                onEditTimeOff={setEditingTimeOff}
              />
            ))}
          </ul>
        )}
      </div>

      {manage && (
        <InviteEmployeeDialog open={inviting} onOpenChange={setInviting} onInvited={setInvitation} />
      )}
      <ActivationLinkDialog invitation={invitation} onClose={() => setInvitation(null)} />
      <ScheduleDialog employee={editingSchedule} onClose={() => setEditingSchedule(null)} />
      <TimeOffDialog employee={editingTimeOff} onClose={() => setEditingTimeOff(null)} />
    </div>
  )
}

function RowsSkeleton() {
  return (
    <ul className="divide-y divide-black/[0.06]">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="size-9 shrink-0 animate-pulse rounded-full bg-neutral-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 animate-pulse rounded bg-neutral-100" />
            <div className="h-3 w-56 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="hidden h-6 w-20 animate-pulse rounded-full bg-neutral-100 sm:block" />
        </li>
      ))}
    </ul>
  )
}
