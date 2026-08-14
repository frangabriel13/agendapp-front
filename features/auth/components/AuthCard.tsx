import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface Props {
  back: { href: string; label: string }
  children: React.ReactNode
}

/**
 * Cascarón de las pantallas de sesión: enlace de vuelta, tarjeta y logo.
 *
 * El encabezado lo pone cada pantalla, no este componente: así cada una tiene
 * exactamente un `<h1>` y ninguna hereda un título que no le sirve.
 */
export function AuthCard({ back, children }: Props) {
  return (
    <div className="w-full max-w-sm">
      <Link
        href={back.href}
        className="mx-auto mb-5 flex w-fit items-center gap-1.5 text-[13px] text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft size={14} aria-hidden />
        {back.label}
      </Link>

      <div className="rounded-2xl border border-black/[0.06] bg-white/90 p-8 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_24px_50px_-28px_rgba(80,40,160,0.35)] backdrop-blur">
        <Link href="/" aria-label="reservApp — ir al inicio">
          {/* El archivo es 1024×312: declararlo cuadrado reservaba un hueco que la
              imagen no ocupa y saltaba el layout al cargar. */}
          <Image
            src="/loguito.png"
            alt="reservApp"
            width={1024}
            height={312}
            priority
            className="mx-auto h-9 w-auto"
          />
        </Link>

        <div className="mt-7">{children}</div>
      </div>
    </div>
  )
}
