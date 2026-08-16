import { Heart, Shield, Zap, Users } from "lucide-react"
import { cardSurface } from "@/components/surface"
import { Section } from "../ui/Section"
import { SectionHeading } from "../ui/SectionHeading"

const values = [
  { icon: Heart, title: "Hecho en Argentina", desc: "Pensado para la realidad local, precios en pesos, soporte en español." },
  { icon: Shield, title: "Tus datos, seguros", desc: "Backups diarios y acceso seguro. Tu información no va a ningún lado." },
  { icon: Zap, title: "Siempre mejorando", desc: "Escuchamos a cada cliente. Las mejoras salen de sus necesidades reales." },
  { icon: Users, title: "Soporte real", desc: "Respondemos por WhatsApp. Sin bots, sin tickets, sin esperas eternas." },
]

export function About() {
  return (
    <Section>
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            badge="Quiénes somos"
            title="Construido por gente que entiende el rubro"
          />
          <p className="mt-6 text-[15px] leading-relaxed text-neutral-500">
            reservApp nació de ver de cerca los problemas reales de las estéticas: turnos anotados en cuadernos,
            WhatsApps que se pierden, doble booking con las máquinas y fichas clínicas en papel.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-500">
            Somos un equipo pequeño, argentino, enfocado en hacer que la gestión de tu negocio sea lo más simple posible
            para que vos puedas enfocarte en lo que sabés hacer.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-4">
          {values.map(({ icon: Icon, title, desc }) => (
            <li key={title} className={`${cardSurface} p-5`}>
              <div className="mb-4 flex size-9 items-center justify-center rounded-lg border border-violet-100 bg-gradient-to-b from-violet-50 to-white">
                <Icon size={16} className="text-violet-600" />
              </div>
              <p className="text-[13px] font-semibold text-neutral-900">{title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">{desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
