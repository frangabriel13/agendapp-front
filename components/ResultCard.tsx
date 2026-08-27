import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * El tono dice qué pasó antes de leer: violeta informa, ámbar pide una acción,
 * verde cerró bien. Rojo no está a propósito — ninguna de estas pantallas es un
 * error del usuario, y ni un link vencido ni un pago rechazado son culpa de quien
 * lo está leyendo.
 */
const TONOS = {
  violet: { caja: "border-violet-100 bg-linear-to-b from-violet-50 to-white", icono: "text-violet-600" },
  amber: { caja: "border-amber-100 bg-amber-50", icono: "text-amber-600" },
  emerald: { caja: "border-emerald-100 bg-emerald-50", icono: "text-emerald-600" },
} as const

interface Props {
  icon: LucideIcon
  tone?: keyof typeof TONOS
  title: string
  description: React.ReactNode
  /** Gira el ícono. Para el estado de "esperando", que no es un desenlace todavía. */
  spin?: boolean
  /** Las salidas: un botón, un link, o los dos. */
  children?: React.ReactNode
}

/**
 * Desenlace de una pantalla sin panel: qué pasó y por dónde seguir.
 *
 * Lo usan las paradas de los mails —link incompleto, mail enviado, email
 * confirmado, link vencido—, la activación de un empleado y la vuelta del
 * checkout de Mercado Pago. Todas son el mismo bloque con distinto texto.
 *
 * **No vive en `features/auth` aunque haya nacido ahí**: ya lo usaba
 * `features/employees`, y las pantallas de pago las abre el cliente del negocio,
 * que no tiene nada que ver con la sesión de nadie.
 *
 * El `<h1>` lo pone acá porque cada una de estas pantallas *es* este bloque; las
 * que tienen formulario ponen el suyo.
 */
export function ResultCard({
  icon: Icon,
  tone = "violet",
  title,
  description,
  spin,
  children,
}: Props) {
  const tono = TONOS[tone]

  return (
    <div className="text-center">
      <div
        aria-hidden
        className={cn(
          "mx-auto mb-5 flex size-12 items-center justify-center rounded-full border",
          tono.caja,
        )}
      >
        <Icon size={20} className={cn(tono.icono, spin && "animate-spin")} />
      </div>

      <h1 className="text-lg font-semibold tracking-tight text-neutral-900">{title}</h1>
      <div className="mt-2 text-[13px] leading-relaxed text-neutral-500">{description}</div>

      {children}
    </div>
  )
}
