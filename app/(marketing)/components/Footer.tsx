import Link from "next/link"
import Image from "next/image"

const columns = [
  {
    title: "Producto",
    links: [
      { href: "#features", label: "Funciones" },
      { href: "#how", label: "Cómo funciona" },
      { href: "#pricing", label: "Precios" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "#testimonials", label: "Testimonios" },
      { href: "#faq", label: "Preguntas frecuentes" },
      { href: "#contacto", label: "Contacto" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { href: "/login", label: "Ingresar" },
      { href: "/registro", label: "Crear cuenta" },
      { href: "/olvide-contrasena", label: "Recuperar contraseña" },
    ],
  },
]

const linkClasses = "text-[13px] text-neutral-500 transition-colors hover:text-neutral-900"

export function Footer() {
  return (
    <footer className="border-t border-black/[0.06] px-6 py-14">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Image src="/loguito.png" alt="reservApp" width={1024} height={312} className="h-7 w-auto" />
            <p className="mt-4 max-w-[16rem] text-[13px] leading-relaxed text-neutral-500">
              La agenda para estéticas, centros de belleza y clínicas.
            </p>
          </div>

          {columns.map(({ title, links }) => (
            <nav key={title} aria-label={title}>
              <p className="text-[13px] font-semibold text-neutral-900">{title}</p>
              <ul className="mt-4 space-y-2.5">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    {href.startsWith("#") ? (
                      <a href={href} className={linkClasses}>
                        {label}
                      </a>
                    ) : (
                      <Link href={href} className={linkClasses}>
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-12 border-t border-black/[0.06] pt-6 text-[13px] text-neutral-400">
          © 2026 reservApp · Hecho para estéticas argentinas
        </p>
      </div>
    </footer>
  )
}
