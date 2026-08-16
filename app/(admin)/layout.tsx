"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Glow } from "@/components/Glow"
import { hasStoredToken } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useHasToken, useLogout, useSession } from "@/features/auth/hooks/useAuth"
import { BrandMark } from "./ui/BrandMark"
import { IconRail } from "./ui/IconRail"
import { TopBar } from "./ui/TopBar"
import { NAV_ITEMS, SETTINGS_ITEM, type NavItem } from "./ui/nav"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useLogout()
  const hasToken = useHasToken()
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  /**
   * Los tokens viven en localStorage, así que el servidor no puede saber si hay
   * sesión: `useHasToken` devuelve false al renderizar en el servidor y al
   * hidratar, y recién después toma el valor real. Por eso el efecto lee
   * localStorage directo en vez de usar `hasToken`, que en la primera corrida
   * todavía viene en false y mandaría al login a alguien con sesión válida.
   * `hasToken` sí va en las dependencias: dispara el redirect si la sesión se
   * cae después (expiró, o se cerró en otra pestaña).
   *
   * De paso, el panel deja de viajar en el HTML prerenderizado.
   */
  useEffect(() => {
    if (!hasStoredToken()) router.replace("/login")
  }, [hasToken, router])

  if (!hasToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-neutral-400">Cargando…</p>
      </div>
    )
  }

  return (
    /*
     * El panel flota sobre un fondo tintado, como el landing: el riel, la barra
     * y las tarjetas son superficies blancas separadas por aire, no bloques
     * pegados a los bordes de la ventana.
     *
     * `h-screen` y no `min-h-screen`: le da altura definida a la columna, que es
     * lo que necesita la agenda para ocupar el alto restante y scrollear adentro.
     */
    <div
      data-app-shell
      className={cn(
        "relative isolate flex h-screen gap-2.5 overflow-hidden p-2.5 text-neutral-900 antialiased",
        // El fondo tiene que ser netamente más oscuro que las tarjetas o nada
        // flota: con `neutral-100` la diferencia contra el blanco es del 4% y
        // el riel de íconos desaparece.
        "bg-neutral-200",
      )}
    >
      <Glow className="-top-40 left-1/3 size-[38rem] bg-violet-200/50" />
      <Glow className="-right-20 -bottom-48 size-[30rem] bg-indigo-200/40" />

      <IconRail pathname={pathname} onLogout={logout} />

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-64 gap-0 p-0">
          {/* Radix exige un título accesible; acá el menú se explica solo. */}
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <Drawer pathname={pathname} onNavigate={() => setMenuOpen(false)} onLogout={logout} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <TopBar
          pathname={pathname}
          session={session}
          onOpenMenu={() => setMenuOpen(true)}
          onLogout={logout}
        />

        {/* Transparente a propósito: lo que flota son las tarjetas de adentro.
            `overflow-x-clip` recorta los halos sin volverse contenedor de scroll
            horizontal, que rompería las columnas fijas del calendario. */}
        <main className="min-h-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain">
          {children}
        </main>
      </div>
    </div>
  )
}

/** En el teléfono no hay lugar para un riel: el menú vuelve a tener texto. */
function Drawer({
  pathname,
  onNavigate,
  onLogout,
}: {
  pathname: string
  onNavigate: () => void
  onLogout: () => void
}) {
  return (
    <div className="flex h-full flex-col px-3 py-6">
      <div className="mb-8 px-2">
        <BrandMark />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {[...NAV_ITEMS, SETTINGS_ITEM].map((item) => (
          <DrawerLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </nav>

      <button
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </div>
  )
}

function DrawerLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate: () => void
}) {
  const { href, label, icon: Icon } = item
  const active = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors",
        active
          ? "bg-violet-50 font-medium text-violet-700"
          : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
      )}
    >
      <Icon size={16} className={active ? "text-violet-600" : ""} />
      {label}
    </Link>
  )
}
