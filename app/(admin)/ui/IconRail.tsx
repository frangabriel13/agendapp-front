"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Session } from "@/types"
import { AccountMenu } from "./AccountMenu"
import { BrandMark } from "./BrandMark"
import { NAV_ITEMS, SETTINGS_ITEM, type NavItem } from "./nav"

/**
 * El menú lateral: un panel blanco con los íconos adentro.
 *
 * Sin texto, como en el diseño. Eso obliga a dos cosas que no son opcionales:
 * cada ítem lleva `aria-label` —para el lector de pantalla el ícono no dice
 * nada— y una etiqueta que aparece al pasar el mouse o al llegar con el
 * teclado, porque un ícono suelto solo se entiende cuando ya lo aprendiste.
 *
 * Abajo va la cuenta, y no en la barra de arriba: esa barra solo se monta en
 * Inicio, y cerrar sesión tiene que poder hacerse desde cualquier pantalla.
 */
export function IconRail({
  pathname,
  session,
  onLogout,
}: {
  pathname: string
  session: Session | undefined
  onLogout: () => void
}) {
  return (
    <nav
      aria-label="Secciones"
      className={cn(
        "relative z-30 hidden w-[4.5rem] shrink-0 flex-col items-center py-4 lg:flex",
        // La misma superficie que el header del landing, puesta de canto: es un
        // panel que contiene los ítems, no botones sueltos sobre el fondo.
        "rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-md",
        "shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]",
      )}
    >
      <BrandMark />

      {/* `my-auto`: el grupo queda centrado en el alto libre, no pegado arriba. */}
      <div className="my-auto flex flex-col items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <RailLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <RailLink item={SETTINGS_ITEM} pathname={pathname} />
        <AccountMenu session={session} onLogout={onLogout} />
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

/** `aria-hidden`: el nombre accesible ya lo da el `aria-label` del enlace. */
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

/**
 * Los estados son los mismos que los del header del landing y los de la píldora
 * de sección de la barra de arriba: adentro de un panel blanco, un botón blanco
 * con borde no se distingue de su propio fondo.
 */
const railActive = "bg-violet-50 text-violet-700"

const railIdle = "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
