import { Badge } from "../ui/Badge"
import { CtaLink } from "@/components/CtaLink"
import { AgendaPreview } from "./AgendaPreview"

/** El halo del fondo lo pone `TopBackdrop` desde la página: ver el porqué ahí. */
export function Hero() {
  return (
    <section className="px-6 pb-16 pt-10 md:pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <Badge>Agenda · Recordatorios · Ficha clínica</Badge>

        <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
          La agenda que tu estética <span className="text-violet-600">necesitaba</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-neutral-500 md:text-base">
          Organizá turnos, profesionales y equipos desde un solo sistema. Sin planillas, sin WhatsApps perdidos, sin
          doble booking.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <CtaLink href="/login" size="lg">
            Empezar gratis
          </CtaLink>
          <CtaLink href="#features" variant="outline" size="lg">
            Ver funciones
          </CtaLink>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-5xl rounded-[1.4rem] border border-black/[0.06] bg-white/70 p-1.5 shadow-[0_32px_70px_-28px_rgba(91,33,182,0.35)] backdrop-blur">
        <AgendaPreview />
      </div>
    </section>
  )
}
