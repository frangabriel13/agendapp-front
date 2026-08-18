"use client"

import Link from "next/link"
import { CircleCheck, Clock3, UserPlus, UserX } from "lucide-react"
import { Panel, PanelHeader, PanelLink, pillClasses } from "@/components/Panel"
import { cn } from "@/lib/utils"
import { canManage, useSession } from "@/features/auth/hooks/useAuth"
import { useEmployees } from "@/features/employees/hooks/useEmployees"
import { personColor } from "@/features/employees/lib/palette"
import { ALL_ROLE_LABELS, fullName, initials } from "@/features/employees/lib/roles"
import type { Employee } from "@/types"

/** Dos filas de a dos. Con más, la tarjeta se estira sobre sus vecinas. */
const VISIBLE = 4

/**
 * Quiénes son y en qué estado están.
 *
 * Ordena por lo que hay que hacer, no alfabéticamente: primero la invitación
 * que nadie aceptó, después quien está desactivado, y al final los que ya están
 * trabajando y no necesitan nada.
 */
export function TeamCard() {
  const { data: session } = useSession()
  const employees = useEmployees()
  const manage = canManage(session?.employee.role)

  const ordenados = [...(employees.data ?? [])].sort(
    (a, b) => urgencia(a) - urgencia(b) || fullName(a).localeCompare(fullName(b), "es"),
  )
  const visibles = ordenados.slice(0, VISIBLE)
  const hayLugar = manage && visibles.length < VISIBLE

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Equipo"
        badge={
          employees.data && (
            <span className={pillClasses}>
              {employees.data.length} {employees.data.length === 1 ? "persona" : "personas"}
            </span>
          )
        }
        action={<PanelLink href="/equipo">Ver equipo</PanelLink>}
      />

      {employees.isPending && (
        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          {Array.from({ length: VISIBLE }).map((_, i) => (
            <div key={i} className="h-[9.5rem] animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
      )}

      {employees.isError && (
        <p className="px-5 pb-10 text-center text-[13px] text-neutral-500">
          No pudimos cargar el equipo.
        </p>
      )}

      {employees.data && (
        <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-3 px-5 pb-5">
          {visibles.map((employee) => (
            <PersonCard key={employee.id} employee={employee} />
          ))}
          {hayLugar && <InviteCard />}
        </div>
      )}
    </Panel>
  )
}

/** Cuanto más chico, más arriba va. */
function urgencia(employee: Employee): number {
  if (employee.status === "PENDING") return 0
  if (!employee.isActive) return 1
  return 2
}

function PersonCard({ employee }: { employee: Employee }) {
  const color = personColor(employee.id)
  const estado = estadoDe(employee)

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-neutral-50/70 p-3.5 text-center">
      <span
        aria-hidden
        className={cn(
          "mx-auto flex size-11 items-center justify-center rounded-full text-[13px] font-semibold",
          color.avatar,
        )}
      >
        {initials(employee)}
      </span>
      <p className="mt-2.5 truncate text-[13px] font-medium text-neutral-900">{fullName(employee)}</p>
      <p className="truncate text-[11px] text-neutral-500">{ALL_ROLE_LABELS[employee.role]}</p>
      <span
        className={cn(
          "mt-2.5 inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
          estado.className,
        )}
      >
        <estado.icon size={11} aria-hidden className="shrink-0" />
        <span className="truncate">{estado.label}</span>
      </span>
    </div>
  )
}

function estadoDe(employee: Employee) {
  if (employee.status === "PENDING") {
    return {
      label: "Sin activar",
      icon: Clock3,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    }
  }
  if (!employee.isActive) {
    return {
      label: "Inactivo",
      icon: UserX,
      className: "border-black/[0.07] bg-neutral-100 text-neutral-500",
    }
  }
  return {
    label: "Activo",
    icon: CircleCheck,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }
}

/** El hueco que sobra invita a llenarlo, en vez de quedar vacío. */
function InviteCard() {
  return (
    <Link
      href="/equipo"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 p-3.5",
        "text-[12px] font-medium text-neutral-500 transition-colors",
        "hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-700",
      )}
    >
      <UserPlus size={18} aria-hidden />
      Invitar
    </Link>
  )
}
