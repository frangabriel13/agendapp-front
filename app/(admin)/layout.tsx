"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Building2, Calendar, LayoutDashboard, Settings, Users, LogOut } from "lucide-react"
import { hasStoredToken } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useHasToken, useLogout, useSession } from "@/features/auth/hooks/useAuth"
import type { EmployeeRole } from "@/types"

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

  const fullName = session ? `${session.user.firstName} ${session.user.lastName}` : null

  if (!hasToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-neutral-400">Cargando…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900 antialiased">
      <aside className="flex w-56 shrink-0 flex-col border-r border-black/[0.06] bg-white px-3 py-6">
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
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
