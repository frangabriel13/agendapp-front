import { Calendar, CheckCircle, Clock, Users, Zap, Shield } from "lucide-react"
import { cardSurface } from "../ui/Card"
import { Glow } from "../ui/Glow"
import { Section } from "../ui/Section"
import { SectionHeading } from "../ui/SectionHeading"

const features = [
  {
    icon: Calendar,
    title: "Agenda visual",
    description: "Calendario semanal con columnas por profesional. Visualizá todos los turnos de un vistazo.",
  },
  {
    icon: Users,
    title: "Multi-profesional",
    description: "Gestioná el horario de todo tu equipo desde un solo lugar, sin conflictos.",
  },
  {
    icon: Zap,
    title: "Control de equipos",
    description: "¿Tenés una sola máquina HIFU? El sistema bloquea automáticamente los turnos que se superpongan.",
  },
  {
    icon: Clock,
    title: "Recordatorios automáticos",
    description: "Recordatorios por WhatsApp antes del turno. Menos cancelaciones de último momento.",
  },
  {
    icon: CheckCircle,
    title: "Ficha clínica digital",
    description: "Historial completo de cada paciente: tratamientos, fotos, contraindicaciones y consentimientos.",
  },
  {
    icon: Shield,
    title: "Multi-sucursal",
    description: "Manejá varias sedes desde una sola cuenta. Cada local con su equipo y configuración.",
  },
]

export function Features() {
  return (
    <Section id="features">
      <Glow className="left-1/2 top-8 h-[24rem] w-[48rem] -translate-x-1/2 bg-violet-400/15" />

      <SectionHeading
        badge="Funciones"
        title={
          <>
            Todo lo que necesitás,
            <br className="hidden sm:inline" /> en un solo lugar
          </>
        }
        subtitle="Diseñado especialmente para estéticas, centros de belleza y clínicas."
        className="mb-14"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className={`${cardSurface} group p-6 transition-all hover:border-violet-200 hover:shadow-[0_1px_2px_rgba(0,0,0,0.03),0_16px_36px_-20px_rgba(124,58,237,0.35)]`}
          >
            <div className="mb-5 flex size-10 items-center justify-center rounded-xl border border-violet-100 bg-gradient-to-b from-violet-50 to-white transition-colors group-hover:border-violet-200">
              <Icon size={18} className="text-violet-600" />
            </div>
            <h3 className="font-semibold tracking-tight text-neutral-900">{title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">{description}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
