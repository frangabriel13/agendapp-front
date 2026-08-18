"use client"

import Link from "next/link"
import { LogOut, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ALL_ROLE_LABELS } from "@/features/employees/lib/roles"
import type { Session } from "@/types"

interface Props {
  session: Session | undefined
  onLogout: () => void
  /** Dónde abrir el menú, según de qué borde cuelgue el disparador. */
  side?: "right" | "top" | "bottom"
  className?: string
}

/**
 * La cuenta: el avatar y lo que cuelga de él.
 *
 * Aparece en un solo lugar por pantalla, pero no siempre el mismo: en Inicio va
 * en la barra de arriba, en el resto al pie del riel, y en el teléfono en
 * `MobileBar`. La regla es que cerrar sesión tenga que poder hacerse desde
 * cualquier pantalla, sin que el mismo control quede dibujado dos veces.
 */
export function AccountMenu({ session, onLogout, side = "right", className }: Props) {
  const nombre = session ? `${session.user.firstName} ${session.user.lastName}`.trim() : null
  const iniciales = session
    ? `${session.user.firstName.charAt(0)}${session.user.lastName.charAt(0)}`.toUpperCase()
    : "—"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={nombre ? `Mi cuenta — ${nombre}` : "Mi cuenta"}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px]",
          "font-semibold text-violet-700 transition-colors hover:bg-violet-200",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600",
          className,
        )}
      >
        {iniciales}
      </DropdownMenuTrigger>

      <DropdownMenuContent side={side} align="end" className="w-56">
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
