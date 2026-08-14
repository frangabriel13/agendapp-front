import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface Props {
  icon: LucideIcon
  title: string
  description: string
  primary: { href: string; label: string }
  secondary: { href: string; label: string }
}

/**
 * Aviso de "esto todavía no está". Registro y recuperación de contraseña son la
 * misma pantalla con distinto texto: ícono, título, explicación y dos salidas.
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

      <Link
        href={primary.href}
        className="mt-6 flex w-full items-center justify-center rounded-full bg-neutral-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
      >
        {primary.label}
      </Link>
      <Link
        href={secondary.href}
        className="mt-4 inline-block text-[13px] font-medium text-violet-600 transition-colors hover:text-violet-500"
      >
        {secondary.label}
      </Link>
    </div>
  )
}
