"use client"

import Link from "next/link"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandMark } from "./BrandMark"
import { NAV_ITEMS, SETTINGS_ITEM, type NavItem } from "./nav"

/**
 * El menú lateral: botones circulares flotando sobre el fondo.
 *
 * Sin texto, como en el diseño. Eso obliga a dos cosas que no son opcionales:
 * cada botón lleva `aria-label` —para el lector de pantalla el ícono no dice
 * nada— y una etiqueta que aparece al pasar el mouse o al llegar con el
 * teclado, porque un ícono suelto solo se entiende cuando ya lo aprendiste.
 */
export function IconRail({ pathname, onLogout }: { pathname: string; onLogout: () => void }) {
  return (
    <nav
      aria-label="Secciones"
      className="relative z-30 hidden w-[4.25rem] shrink-0 flex-col items-center py-1 lg:flex"
    >
      <BrandMark />

      {/* `my-auto`: el grupo queda centrado en el alto libre, no pegado arriba. */}
      <div className="my-auto flex flex-col items-center gap-2">
        {NAV_ITEMS.map((item) => (
          <RailLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <RailLink item={SETTINGS_ITEM} pathname={pathname} />
        <RailButton label="Cerrar sesión" onClick={onLogout}>
          <LogOut size={18} aria-hidden />
        </RailButton>
      </div>
    </nav>
  )
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function RailLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const { href, label, icon: Icon } = item
  const active = isActive(pathname, href)

  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(railButton, active ? railActive : railIdle)}
    >
      <Icon size={18} aria-hidden />
      <Tooltip>{label}</Tooltip>
    </Link>
  )
}

function RailButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cn(railButton, railIdle)}>
      {children}
      <Tooltip>{label}</Tooltip>
    </button>
  )
}

/** `aria-hidden`: el nombre accesible ya lo da el `aria-label` del botón. */
function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-full z-40 ml-2 rounded-lg bg-neutral-900 px-2 py-1",
        "text-[11px] font-medium whitespace-nowrap text-white opacity-0 transition-opacity",
        "group-hover:opacity-100 group-focus-visible:opacity-100",
      )}
    >
      {children}
    </span>
  )
}

const railButton = cn(
  "group relative flex size-11 items-center justify-center rounded-full transition-colors",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600",
)

const railActive = "bg-violet-600 text-white shadow-[0_10px_22px_-10px_rgba(124,58,237,0.95)]"

/**
 * El borde no es decorativo: un círculo blanco sobre el fondo claro, con sola
 * sombra, casi no se ve. Es el mismo borde tenue del resto del sistema.
 */
const railIdle = cn(
  "border border-black/[0.06] bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-14px_rgba(0,0,0,0.4)]",
)
