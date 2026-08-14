import { CtaLink } from "../ui/CtaLink"
import { Glow } from "@/components/Glow"

export function FinalCta() {
  return (
    <section className="px-6 py-20 md:py-24">
      <div className="relative isolate mx-auto max-w-5xl overflow-hidden rounded-3xl bg-neutral-950 px-6 py-16 text-center md:px-16 md:py-20">
        <Glow className="left-1/2 top-[-6rem] h-[22rem] w-[36rem] -translate-x-1/2 bg-violet-600/40" />

        <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
          Tu estética organizada desde hoy
        </h2>
        <p className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-neutral-400">
          14 días gratis, sin tarjeta de crédito. Empezás en minutos.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <CtaLink href="/login" variant="light" size="lg">
            Empezar gratis
          </CtaLink>
          <CtaLink
            href="#contacto"
            size="lg"
            className="border border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            Hablar con el equipo
          </CtaLink>
        </div>
      </div>
    </section>
  )
}
