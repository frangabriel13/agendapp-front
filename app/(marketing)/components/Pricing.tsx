import Link from "next/link"
import { CheckCircle } from "lucide-react"

const plans = [
  {
    name: "Básico",
    price: "$25.000",
    originalPrice: "$35.000",
    discount: "28% OFF",
    description: "Para empezar",
    highlight: false,
    features: ["1 profesional", "1 sucursal", "Agenda ilimitada", "Ficha clínica digital", "Soporte incluido"],
  },
  {
    name: "Pro",
    price: "$45.000",
    originalPrice: "$65.000",
    discount: "30% OFF",
    description: "El más elegido",
    highlight: true,
    features: ["Hasta 3 profesionales", "1 sucursal", "Agenda ilimitada", "Control de equipos", "Ficha clínica digital", "Soporte incluido"],
  },
  {
    name: "Avanzado",
    price: "$80.000",
    originalPrice: "$110.000",
    discount: "27% OFF",
    description: "Para clínicas en crecimiento",
    highlight: false,
    features: ["Hasta 6 profesionales", "Hasta 2 sucursales", "Agenda ilimitada", "Control de equipos", "Ficha clínica digital", "Soporte prioritario"],
  },
]

const businessFeatures = [
  "Profesionales ilimitados",
  "Sucursales ilimitadas",
  "Configuración personalizada",
  "Soporte dedicado",
  "Capacitación incluida",
]

export function Pricing() {
  return (
    <section id="pricing" className="px-6 py-20 max-w-5xl mx-auto text-center scroll-mt-20">
      <span className="inline-block text-xs font-medium px-3 py-1 rounded-full border border-violet-200 bg-violet-50 text-violet-600 mb-6">
        Precio de lanzamiento
      </span>
      <h2 className="text-3xl font-bold mb-3 text-gray-900">Simple y sin sorpresas</h2>
      <p className="text-gray-500 mb-12">Elegí el plan que se adapta a tu estética. Cancelás cuando quieras.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl overflow-hidden flex flex-col ${
              plan.highlight
                ? "border border-violet-400 bg-white shadow-[0_0_40px_rgba(124,58,237,0.12)] lg:-mt-4"
                : "border border-gray-200 bg-white shadow-sm"
            }`}
          >
            {plan.highlight ? (
              <div className="bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white tracking-wide shrink-0">
                ✦ MÁS POPULAR
              </div>
            ) : (
              <div className="py-2.5 shrink-0" />
            )}
            <div className="p-6 flex flex-col flex-1">
              <p className="text-gray-500 text-sm mb-1">{plan.description}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</p>
              <div className="flex items-baseline gap-2 mt-4 mb-1">
                <span className="text-gray-400 text-lg line-through">{plan.originalPrice}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-500 text-white">
                  {plan.discount}
                </span>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-1">{plan.price}</p>
              <p className="text-gray-400 text-xs mb-6">ARS / mes</p>

              <ul className="text-sm text-left space-y-3 mb-6 flex-1">
                {plan.features.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle size={15} className="text-violet-500 shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`block w-full py-3 rounded-md font-semibold transition-colors mt-auto ${
                  plan.highlight
                    ? "bg-violet-600 text-white hover:bg-violet-500"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Empezar gratis
              </Link>
            </div>
          </div>
        ))}

        <div className="relative rounded-2xl overflow-hidden flex flex-col bg-gradient-to-b from-violet-600 to-violet-800 shadow-sm">
          <div className="bg-white/10 px-6 py-2.5 text-sm font-semibold text-white tracking-wide shrink-0">
            ✦ A MEDIDA
          </div>
          <div className="p-6 flex flex-col flex-1">
            <p className="text-violet-200 text-sm mb-1">Para grandes equipos</p>
            <p className="text-2xl font-bold text-white mb-1">Business</p>
            <div className="mt-4 mb-1 flex items-baseline gap-2">
              <span className="text-violet-300 text-lg line-through invisible">—</span>
            </div>
            <p className="text-xl font-semibold text-white mb-1">A consultar</p>
            <p className="text-violet-300 text-xs mb-6">precio según el negocio</p>

            <ul className="text-sm text-left space-y-3 mb-6 flex-1">
              {businessFeatures.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle size={15} className="text-white shrink-0" />
                  <span className="text-violet-100">{item}</span>
                </li>
              ))}
            </ul>

            <a
              href="#contacto"
              className="block w-full py-3 rounded-md font-semibold bg-white text-violet-700 hover:bg-violet-50 transition-colors text-center mt-auto"
            >
              Hablar con el equipo
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
        <span className="text-lg">💬</span>
        <span>
          <span className="text-gray-900 font-medium">Recordatorios por WhatsApp</span>
          {" "}— add-on disponible en todos los planes. Se cobra por mensaje enviado.
        </span>
      </div>

      <p className="text-xs text-gray-400 mt-4">No necesitás tarjeta de crédito para empezar</p>
    </section>
  )
}
