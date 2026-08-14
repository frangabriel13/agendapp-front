import { cardSurface } from "../ui/Card"
import { Section } from "../ui/Section"
import { SectionHeading } from "../ui/SectionHeading"

const steps = [
  { number: "01", title: "Cargás tu equipo", description: "Agregás tus profesionales, servicios y equipos disponibles." },
  { number: "02", title: "Abrís la agenda", description: "Tus turnos se organizan solos en el calendario visual." },
  { number: "03", title: "El sistema trabaja", description: "Recordatorios, fichas y pagos en piloto automático." },
]

export function HowItWorks() {
  return (
    <Section id="how" muted>
      <SectionHeading
        badge="Cómo funciona"
        title={
          <>
            Tres pasos y tu agenda
            <br className="hidden sm:inline" /> está funcionando
          </>
        }
        subtitle="Sin migraciones eternas ni capacitaciones de una semana."
        className="mb-14"
      />

      <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map(({ number, title, description }) => (
          <li key={number} className={`${cardSurface} p-6`}>
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-violet-600 text-[13px] font-semibold text-white">
              {number}
            </span>
            <h3 className="mt-5 font-semibold tracking-tight text-neutral-900">{title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">{description}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
