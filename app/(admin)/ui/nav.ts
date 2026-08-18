import {
  Building2,
  Calendar,
  ChartColumn,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

/**
 * Las secciones del panel, en el orden en que se usan.
 *
 * Viven acá y no en el layout porque las leen tres cosas que tienen que decir
 * lo mismo: el riel de íconos, el cajón del teléfono y la píldora de la barra
 * de arriba que nombra dónde estás parado.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  // Agenda y Reportes son el día a día; Equipo y Sucursales, la puesta a punto.
  { href: "/reportes", label: "Reportes", icon: ChartColumn },
  { href: "/equipo", label: "Equipo", icon: Users },
  { href: "/sucursales", label: "Sucursales", icon: Building2 },
]

/** Va aparte: en el riel baja al pie, separada del trabajo del día. */
export const SETTINGS_ITEM: NavItem = {
  href: "/configuracion",
  label: "Configuración",
  icon: Settings,
}

/** La sección en la que estás. `undefined` en una ruta que no está en el menú. */
export function activeItem(pathname: string): NavItem | undefined {
  return [...NAV_ITEMS, SETTINGS_ITEM].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )
}
