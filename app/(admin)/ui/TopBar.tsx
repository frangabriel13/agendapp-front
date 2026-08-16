"use client"

import { useMemo } from "react"
import Link from "next/link"
import { CalendarDays, ChevronDown, LogOut, Menu, Plus, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CtaLink } from "@/components/CtaLink"
import { pillClasses, pillLinkClasses } from "@/components/Panel"
import { cn } from "@/lib/utils"
import { useEmployees } from "@/features/employees/hooks/useEmployees"
import { personColor } from "@/features/employees/lib/palette"
import { ALL_ROLE_LABELS, fullName, initials } from "@/features/employees/lib/roles"
import type { Employee, Session } from "@/types"
import { BrandMark } from "./BrandMark"
import { activeItem } from "./nav"

/** Cuántas caras entran antes de pasar a contarlas. */
const AVATARS = 3

interface Props {
  pathname: string
  session: Session | undefined
  onOpenMenu: () => void
  onLogout: () => void
}

/**
 * La barra flotante de arriba.
 *
 * No repite el menú del riel —dos navegaciones para las mismas cinco pantallas
 * confunden más de lo que ayudan—: dice dónde estás, qué día es, quién está en
 * el equipo, y deja a mano la acción que se hace todo el tiempo.
 */
export function TopBar({ pathname, session, onOpenMenu, onLogout }: Props) {
  const active = activeItem(pathname)
  const employees = useEmployees()

  const hoy = useMemo(() => {
    const texto = new Date().toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }, [])

  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-2xl border border-black/[0.06] px-2.5 py-2",
        "bg-white/80 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md",
      )}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
        className="rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 lg:hidden"
      >
        <Menu size={20} />
      </button>
      <BrandMark className="size-9 rounded-xl lg:hidden" />

      {active && (
        <span className="hidden items-center gap-2 rounded-full bg-violet-50 px-3.5 py-2 text-[13px] font-medium text-violet-700 lg:inline-flex">
          <active.icon size={15} aria-hidden />
          {active.label}
        </span>
      )}

      <span className={cn(pillClasses, "hidden py-2 xl:inline-flex")}>
        <CalendarDays size={13} aria-hidden />
        {hoy}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {employees.data && employees.data.length > 0 && (
          <AvatarStack employees={employees.data} className="hidden md:flex" />
        )}

        <CtaLink href="/agenda" size="sm">
          <Plus size={15} aria-hidden />
          <span className="hidden sm:inline">Nuevo turno</span>
        </CtaLink>

        <ProfileMenu session={session} onLogout={onLogout} />
      </div>
    </header>
  )
}

/** Las caras del equipo, como en el diseño: superpuestas y con el resto contado. */
function AvatarStack({ employees, className }: { employees: Employee[]; className?: string }) {
  const visibles = employees.slice(0, AVATARS)
  const resto = employees.length - visibles.length

  return (
    <Link
      href="/equipo"
      aria-label={`Equipo: ${employees.length} personas`}
      className={cn(pillLinkClasses, "gap-0 py-1 pr-2.5 pl-1", className)}
    >
      <span className="flex -space-x-2">
        {visibles.map((employee) => (
          <span
            key={employee.id}
            aria-hidden
            title={fullName(employee)}
            className={cn(
              "flex size-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold",
              personColor(employee.id).avatar,
            )}
          >
            {initials(employee)}
          </span>
        ))}
      </span>
      {resto > 0 && <span className="ml-2 text-[12px] text-neutral-500">+{resto}</span>}
    </Link>
  )
}

function ProfileMenu({ session, onLogout }: { session: Session | undefined; onLogout: () => void }) {
  const nombre = session ? `${session.user.firstName} ${session.user.lastName}`.trim() : null
  const iniciales = session
    ? `${session.user.firstName.charAt(0)}${session.user.lastName.charAt(0)}`.toUpperCase()
    : "—"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Mi cuenta"
        className={cn(
          "flex items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-neutral-100",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600",
        )}
      >
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-violet-100 text-[11px] font-semibold text-violet-700"
        >
          {iniciales}
        </span>
        <ChevronDown size={14} className="text-neutral-400" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-[13px] font-medium text-neutral-900">
            {nombre ?? "Mi cuenta"}
          </span>
          <span className="truncate text-[11px] font-normal text-neutral-400">
            {session ? ALL_ROLE_LABELS[session.employee.role] : "Cargando…"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/configuracion">
            <Settings size={14} /> Configuración
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onLogout}>
          <LogOut size={14} /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
