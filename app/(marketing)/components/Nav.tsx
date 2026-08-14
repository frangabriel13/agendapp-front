"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { CtaLink } from "../ui/CtaLink"

const LINKS = [
  { href: "#features", label: "Funciones" },
  { href: "#how", label: "Cómo funciona" },
  { href: "#testimonials", label: "Testimonios" },
  { href: "#pricing", label: "Precios" },
  { href: "#faq", label: "FAQ" },
  { href: "#contacto", label: "Contacto" },
]

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 px-4 pt-4">
      <div className="mx-auto max-w-5xl rounded-2xl border border-black/[0.06] bg-white/80 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
          <Link href="/" className="shrink-0" aria-label="reservApp — inicio">
            {/* El archivo es 1024×312: declararlo cuadrado reservaba un hueco que
                la imagen no ocupa y saltaba el layout al cargar. */}
            <Image src="/loguito.png" alt="reservApp" width={1024} height={312} priority className="h-7 w-auto" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3 py-1.5 text-[13px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <CtaLink href="/login" size="sm">
              Ingresar
            </CtaLink>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              className="rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 md:hidden"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="flex flex-col gap-0.5 border-t border-black/[0.06] px-3 py-3 md:hidden">
            {LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
