"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"

const links = [
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
    <header className="border-b border-gray-200 sticky top-0 bg-white/90 backdrop-blur z-20">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <Image src="/loguito.png" alt="reservApp" width={120} height={120} className="rounded-lg" priority />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
          {links.map(({ href, label }) => (
            <a key={href} href={href} className="hover:text-gray-900 transition-colors">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:border-violet-500 hover:text-violet-600 transition-colors font-medium"
          >
            Ingresar
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className="md:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-gray-200 bg-white px-6 py-4 flex flex-col gap-1">
          {links.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="py-2.5 text-sm text-gray-600 hover:text-violet-600 transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
