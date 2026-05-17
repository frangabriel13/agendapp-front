import { Calendar, CheckCircle, Clock, Users, Zap, Shield } from "lucide-react"

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
    <section id="features" className="px-6 py-20 max-w-5xl mx-auto scroll-mt-20">
      <div className="text-center mb-14">
        <h2 className="text-3xl font-bold mb-3 text-gray-900">Todo lo que necesitás</h2>
        <p className="text-gray-500">Diseñado especialmente para estéticas, centros de belleza y clínicas.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="p-6 rounded-xl border border-gray-200 bg-white hover:border-violet-300 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
              <Icon size={20} className="text-violet-600" />
            </div>
            <h3 className="font-semibold mb-2 text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
