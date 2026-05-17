import { Heart, Shield, Zap, Users } from "lucide-react"

const values = [
  { icon: Heart, title: "Hecho en Argentina", desc: "Pensado para la realidad local, precios en pesos, soporte en español." },
  { icon: Shield, title: "Tus datos, seguros", desc: "Backups diarios y acceso seguro. Tu información no va a ningún lado." },
  { icon: Zap, title: "Siempre mejorando", desc: "Escuchamos a cada cliente. Las mejoras salen de sus necesidades reales." },
  { icon: Users, title: "Soporte real", desc: "Respondemos por WhatsApp. Sin bots, sin tickets, sin esperas eternas." },
]

export function About() {
  return (
    <section className="px-6 py-20 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block text-xs font-medium px-3 py-1 rounded-full border border-violet-200 bg-violet-50 text-violet-600 mb-4">
            Quiénes somos
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Construido por gente que entiende el rubro
          </h2>
          <p className="text-gray-500 leading-relaxed mb-4">
            reservApp nació de ver de cerca los problemas reales de las estéticas: turnos anotados en cuadernos, WhatsApps que se pierden, doble booking con las máquinas y fichas clínicas en papel.
          </p>
          <p className="text-gray-500 leading-relaxed">
            Somos un equipo pequeño, argentino, enfocado en hacer que la gestión de tu negocio sea lo más simple posible para que vos puedas enfocarte en lo que sabés hacer.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-4 rounded-xl border border-gray-200 bg-white">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-3">
                <Icon size={16} className="text-violet-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
