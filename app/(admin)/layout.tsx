"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Building2, Calendar, LayoutDashboard, Menu, Settings, Users, LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { hasStoredToken } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useHasToken, useLogout, useSession } from "@/features/auth/hooks/useAuth"
import type { EmployeeRole, Session } from "@/types"

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/equipo", label: "Equipo", icon: Users },
  { href: "/sucursales", label: "Sucursales", icon: Building2 },
  { href: "/configuracion", label: "Configuración", icon: Settings },
]

const ROLE_LABELS: Record<EmployeeRole, string> = {
  OWNER: "Dueño/a",
  ADMINISTRATIVE: "Administración",
  PROFESSIONAL: "Profesional",
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")
}

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

  const sidebar = (
    <Sidebar
      pathname={pathname}
      session={session}
      logout={logout}
      onNavigate={() => setMenuOpen(false)}
    />
  )

  return (
    // `h-screen` y no `min-h-screen`: le da altura definida a la columna, que es
    // lo que necesita la agenda para ocupar el alto restante y scrollear adentro.
    <div className="flex h-screen bg-neutral-50 text-neutral-900 antialiased">
      {/* Fijo a partir de lg; abajo de eso el lugar lo necesita el contenido. */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-black/[0.06] bg-white px-3 py-6 lg:flex">
        {sidebar}
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-64 gap-0 p-0">
          {/* Radix exige un título accesible; acá el menú se explica solo. */}
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <div className="flex h-full flex-col px-3 py-6">{sidebar}</div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-black/[0.06] bg-white px-4 py-2.5 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            className="-ml-1 rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <Menu size={20} />
          </button>
          <Image src="/loguito.png" alt="reservApp" width={1024} height={312} priority className="h-6 w-auto" />
        </header>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

interface SidebarProps {
  pathname: string
  session: Session | undefined
  logout: () => void
  /** Cierra el cajón al navegar. En el sidebar fijo no hace nada. */
  onNavigate: () => void
}

function Sidebar({ pathname, session, logout, onNavigate }: SidebarProps) {
  const fullName = session ? `${session.user.firstName} ${session.user.lastName}` : null

  return (
    <>
      <div className="mb-8 px-3">
        {/* El archivo es 1024×312: declararlo cuadrado reserva un hueco que la
            imagen no ocupa y salta el layout al cargar. */}
        <Image src="/loguito.png" alt="reservApp" width={1024} height={312} priority className="h-7 w-auto" />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
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
        })}
      </nav>

      <div className="mt-3 border-t border-black/[0.06] pt-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-semibold text-violet-700"
          >
            {fullName ? initials(fullName) : "—"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-neutral-900">{fullName ?? "Mi cuenta"}</p>
            <p className="truncate text-xs text-neutral-400">
              {session ? ROLE_LABELS[session.employee.role] : "Cargando…"}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </>
  )
}
