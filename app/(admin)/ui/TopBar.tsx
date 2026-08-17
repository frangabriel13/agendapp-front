"use client"

import { useMemo } from "react"
import Link from "next/link"
import { CalendarDays, Plus } from "lucide-react"
import { CtaLink } from "@/components/CtaLink"
import { pillClasses, pillLinkClasses } from "@/components/Panel"
import { cn } from "@/lib/utils"
import { useEmployees } from "@/features/employees/hooks/useEmployees"
import { personColor } from "@/features/employees/lib/palette"
import { fullName, initials } from "@/features/employees/lib/roles"
import type { Employee, Session } from "@/types"

/** Cuántas caras entran antes de pasar a contarlas. */
const AVATARS = 3

/**
 * La barra del tablero. **Solo se monta en Inicio.**
 *
 * Es contexto del tablero, no chrome de la aplicación: de qué negocio se está
 * mirando el día, qué día es, quién está en el equipo y el atajo para cargar un
 * turno. Lo que sí tiene que estar en todas las pantallas —navegar y la cuenta—
 * vive en el riel y, abajo de `lg`, en `MobileBar`.
 *
 * De `lg` para abajo no aparece: ahí ya está `MobileBar`, y dos barras apiladas
 * en un teléfono se comen la pantalla.
 */
export function TopBar({ session }: { session: Session | undefined }) {
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
      </div>
    </header>
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
