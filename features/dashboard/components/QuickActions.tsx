"use client"

import Link from "next/link"
import { Building2, CalendarPlus, Settings, TriangleAlert, UserPlus } from "lucide-react"
import { Glow } from "@/components/Glow"
import { Panel, pillLinkClasses } from "@/components/Panel"
import { cn } from "@/lib/utils"
import { useSession } from "@/features/auth/hooks/useAuth"
import { subscriptionNote } from "../lib/subscription"

const ACCIONES = [
  { href: "/agenda", label: "Cargar un turno", icon: CalendarPlus },
  { href: "/equipo", label: "Invitar", icon: UserPlus },
  { href: "/sucursales", label: "Sucursales", icon: Building2 },
  { href: "/configuracion", label: "Configuración", icon: Settings },
]

/**
 * El saludo y los cuatro atajos.
 *
 * Cierra el tablero con lo único que no es información sino acción: quien entra
 * al panel sabiendo lo que viene a hacer no tiene que buscarlo en el menú.
 */
export function QuickActions() {
  const { data: session } = useSession()
  const nota = session ? subscriptionNote(session.tenant) : null

  return (
    <Panel className="relative isolate flex flex-col items-center overflow-hidden p-6 text-center">
      <Glow className="-top-20 left-1/2 size-56 -translate-x-1/2 bg-violet-200/70" />

      {/* `my-auto`: la tarjeta se estira hasta el alto de sus vecinas, y el
          bloque queda centrado en vez de dejar todo el hueco abajo. */}
      <div className="my-auto flex flex-col items-center">
        <Orb />

        <p className="mt-6 text-[17px] font-semibold tracking-tight text-neutral-900">
          {session ? `Hola, ${session.user.firstName}` : "Hola"}
        </p>
        <p className="mt-1 text-[13px] text-neutral-500">¿Qué querés hacer hoy?</p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {ACCIONES.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={pillLinkClasses}>
              <Icon size={13} aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {nota && (
        <p
          className={cn(
            "flex items-center gap-1.5 pt-6 text-[11px]",
            nota.urgent ? "font-medium text-amber-700" : "text-neutral-400",
          )}
        >
          {nota.urgent && <TriangleAlert size={12} aria-hidden />}
          {nota.text}
        </p>
      )}
    </Panel>
  )
}

/**
 * La esfera de vidrio.
 *
 * Es decoración: dos brillos encima de un degradado, sin imagen que descargar.
 * El de arriba es la luz, el de abajo el rebote sobre la superficie.
 */
function Orb() {
  return (
    <span
      aria-hidden
      className={cn(
        "relative block size-24 shrink-0 rounded-full",
        "bg-gradient-to-br from-violet-300 via-violet-500 to-indigo-600",
        "shadow-[inset_0_-10px_24px_rgba(255,255,255,0.35),0_22px_42px_-16px_rgba(109,40,217,0.7)]",
      )}
    >
      <span className="absolute top-[16%] left-[22%] size-7 rounded-full bg-white/70 blur-[6px]" />
      <span className="absolute inset-x-[20%] bottom-[10%] h-3.5 rounded-full bg-white/25 blur-md" />
    </span>
  )
}
