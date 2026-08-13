"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Calendar, LayoutDashboard, Settings, Users, LogOut } from "lucide-react"
import { useLogout, useSession } from "@/features/auth/hooks/useAuth"
import type { EmployeeRole } from "@/types"

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/equipo", label: "Equipo", icon: Users },
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
  const logout = useLogout()
  const { data: session } = useSession()

  const fullName = session ? `${session.user.firstName} ${session.user.lastName}` : null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 border-r border-gray-200 bg-white flex flex-col py-6 px-3 shrink-0">
        <div className="px-3 mb-8 flex items-center gap-2">
          <Image src="/loguito.png" alt="reservApp" width={100} height={100} className="rounded-lg" />
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-violet-50 text-violet-700 font-medium"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon size={16} className={active ? "text-violet-600" : ""} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">
              {fullName ? initials(fullName) : "—"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fullName ?? "Mi cuenta"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {session ? ROLE_LABELS[session.employee.role] : "Cargando..."}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
