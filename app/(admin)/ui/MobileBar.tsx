"use client"

import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Session } from "@/types"
import { AccountMenu } from "./AccountMenu"
import { activeItem } from "./nav"

interface Props {
  pathname: string
  session: Session | undefined
  onOpenMenu: () => void
  onLogout: () => void
}

/**
 * La barra del teléfono. Va en **todas** las pantallas, no solo en Inicio.
 *
 * Debajo de `lg` el riel está oculto: sin esta barra no habría forma de navegar
 * ni de cerrar sesión. Por eso lleva lo mínimo global —el menú, dónde estás y la
 * cuenta— y nada de lo que es propio del tablero.
 */
export function MobileBar({ pathname, session, onOpenMenu, onLogout }: Props) {
  const active = activeItem(pathname)

  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-2xl border border-black/[0.06] px-2 py-2 lg:hidden",
        "bg-white/80 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md",
      )}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
        className="rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      >
        <Menu size={20} />
      </button>

      {active && (
        <span className="flex min-w-0 items-center gap-2 text-[15px] font-medium text-neutral-900">
          <active.icon size={16} className="shrink-0 text-violet-600" aria-hidden />
          <span className="truncate">{active.label}</span>
        </span>
      )}

      <AccountMenu session={session} onLogout={onLogout} side="top" className="ml-auto" />
    </header>
  )
}
