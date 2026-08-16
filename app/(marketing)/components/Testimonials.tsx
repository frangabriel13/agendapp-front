import Image from "next/image"
import { Quote } from "lucide-react"
import { cardSurface } from "@/components/surface"
import { Section } from "../ui/Section"
import { SectionHeading } from "../ui/SectionHeading"

const testimonials = [
  {
    name: "Ayelen Alderete",
    role: "Esteticista & Cosmetóloga · Dueña",
    place: "Estética Alderete · Laferrere & Balvanera",
    photo: "/testimonials/ayelenAlderete.png",
    quote: "Tengo dos locales y antes era un caos coordinar todo. Ahora veo las dos sucursales desde el mismo lugar y los recordatorios automáticos me bajaron las cancelaciones a la mitad.",
  },
  {
    name: "Evelyn Haringa",
    role: "Operadora de HIFU & Liposonix",
    place: "Estética Alderete · Laferrere",
    photo: "/testimonials/evelynHaringa.png",
    quote: "La ficha de cada paciente es un antes y un después. Anoto los tratamientos, las cremas que usa, las contraindicaciones... y le puedo dejar una nota a mis compañeras tipo 'ojo, piel muy sensible' para que estén avisadas antes de atenderla.",
  },
  {
    name: "Gabriela Torre",
    role: "Operadora de equipos de ultrasonido",
    place: "Estética Alderete · Balvanera",
    photo: "/testimonials/GabrielaTorre.png",
    quote: "Entro a la mañana, abro la agenda y ya sé exactamente qué tengo en el día. Sin preguntar, sin mensajes de último momento, sin confusiones.",
  },
]

export function Testimonials() {
  return (
    <Section id="testimonials">
      <SectionHeading
        badge="Testimonios"
        title={
          <>
            Lo que dicen
            <br className="hidden sm:inline" /> nuestras usuarias
          </>
        }
        subtitle="Estéticas reales, resultados reales."
        className="mb-14"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {testimonials.map(({ name, role, place, photo, quote }) => (
          <figure key={name} className={`${cardSurface} flex flex-col gap-4 p-6`}>
            <Quote aria-hidden size={20} className="shrink-0 fill-violet-100 text-violet-200" />
            <blockquote className="flex-1 text-[13px] leading-relaxed text-neutral-600">{quote}</blockquote>
            <figcaption className="flex items-center gap-3 border-t border-black/[0.06] pt-4">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-full">
                <Image src={photo} alt="" fill sizes="40px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-neutral-900">{name}</p>
                <p className="truncate text-[11px] text-neutral-400">{role}</p>
                <p className="truncate text-[11px] text-violet-500">{place}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  )
}
