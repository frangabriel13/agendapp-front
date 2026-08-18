"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Bell, CalendarDays, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CtaLink } from "@/components/CtaLink"
import { pillClasses, pillLinkClasses } from "@/components/Panel"
import { cn } from "@/lib/utils"
import { useEmployees } from "@/features/employees/hooks/useEmployees"
import { personColor } from "@/features/employees/lib/palette"
import { fullName, initials } from "@/features/employees/lib/roles"
import type { Employee, Session } from "@/types"
import { AccountMenu } from "./AccountMenu"

/** Cuántas caras entran antes de pasar a contarlas. */
const AVATARS = 3

/**
 * La barra del tablero. **Solo se monta en Inicio.**
 *
 * Es contexto del tablero: de qué negocio se está mirando el día, qué día es,
 * quién está en el equipo y el atajo para cargar un turno. A la derecha, lo de
 * quien está usando el panel: su cuenta y las novedades.
 *
 * Cuando esta barra está, el riel **no** dibuja la cuenta: es el mismo control y
 * no tiene sentido tenerlo dos veces en pantalla. Navegar sí queda siempre en el
 * riel y, abajo de `lg`, en `MobileBar`.
 *
 * De `lg` para abajo no aparece: ahí ya está `MobileBar`, y dos barras apiladas
 * en un teléfono se comen la pantalla.
 */
export function TopBar({
  session,
  onLogout,
}: {
  session: Session | undefined
  onLogout: () => void
}) {
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
        "hidden shrink-0 items-center gap-3 rounded-2xl border border-black/[0.06] px-4 py-2.5 lg:flex",
        "bg-white/80 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md",
      )}
    >
      <p className="truncate text-[15px] font-semibold tracking-tight text-neutral-900">
        {session?.tenant.businessName ?? "Tu negocio"}
      </p>

      <span className={cn(pillClasses, "hidden xl:inline-flex")}>
        <CalendarDays size={13} aria-hidden />
        {hoy}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {employees.data && employees.data.length > 0 && <AvatarStack employees={employees.data} />}

        <CtaLink href="/agenda" size="sm">
          <Plus size={15} aria-hidden />
          Nuevo turno
        </CtaLink>

        {/* La cuenta y las novedades, separadas de la acción: son de quien está
            usando el panel, no del negocio que se está mirando. */}
        <div className="ml-1 flex items-center gap-1 border-l border-black/[0.06] pl-3">
          <AccountMenu session={session} onLogout={onLogout} side="bottom" />
          <NotificationsMenu />
        </div>
      </div>
    </header>
  )
}

/**
 * La campanita.
 *
 * Todavía no hay sistema de notificaciones: ningún endpoint, nada que contar.
 * Por eso no lleva puntito de "sin leer" —sería mentir sobre algo que no se
 * midió— y abre un panel que dice exactamente eso. Un botón que no hace nada
 * al tocarlo se lee como roto; uno que se explica, no.
 */
function NotificationsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notificaciones"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-500",
          "transition-colors hover:bg-neutral-100 hover:text-neutral-900",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600",
        )}
      >
        <Bell size={17} aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="bottom" align="end" className="w-64">
        <DropdownMenuLabel className="text-[13px] font-medium text-neutral-900">
          Notificaciones
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <p className="px-2 py-3 text-[13px] text-neutral-500">
          Cuando haya novedades te avisamos acá.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Las caras del equipo, como en el diseño: superpuestas y con el resto contado. */
function AvatarStack({ employees }: { employees: Employee[] }) {
  const visibles = employees.slice(0, AVATARS)
  const resto = employees.length - visibles.length

  return (
    <Link
      href="/equipo"
      aria-label={`Equipo: ${employees.length} personas`}
      className={cn(pillLinkClasses, "gap-0 py-1 pr-2.5 pl-1")}
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
