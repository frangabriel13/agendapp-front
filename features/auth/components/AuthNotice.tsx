import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { CtaLink } from "@/components/CtaLink"

interface Props {
  icon: LucideIcon
  title: string
  description: string
  primary: { href: string; label: string }
  secondary: { href: string; label: string }
}

/**
 * Aviso de "esto todavía no está": ícono, título, explicación y dos salidas.
 *
 * Queda solo `/registro`, que sigue sin decidirse. Recuperar contraseña ya no lo
 * usa: dejó de ser un cartel el día que se cableó `POST /auth/forgot-password`.
 * Cuando `/registro` se resuelva, este componente se borra — a diferencia de
 * `ResultCard`, que muestra desenlaces reales y sí se queda.
 */
export function AuthNotice({ icon: Icon, title, description, primary, secondary }: Props) {
  return (
    <div className="text-center">
      <div
        aria-hidden
        className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-violet-100 bg-linear-to-b from-violet-50 to-white"
      >
        <Icon size={20} className="text-violet-600" />
      </div>

      <h1 className="text-lg font-semibold tracking-tight text-neutral-900">{title}</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">{description}</p>

      <CtaLink href={primary.href} block className="mt-6">
        {primary.label}
      </CtaLink>
      <Link
        href={secondary.href}
        className="mt-4 inline-block text-[13px] font-medium text-violet-600 transition-colors hover:text-violet-500"
      >
        {secondary.label}
      </Link>
    </div>
  )
}
