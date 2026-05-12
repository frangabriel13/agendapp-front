import Link from "next/link"
import Image from "next/image"
import { Calendar, CheckCircle, Clock, Users, Zap, Shield } from "lucide-react"

export const metadata = {
  title: "reservApp — Gestión de turnos para estéticas",
  description: "El sistema de agenda más completo para estéticas y centros de belleza.",
}

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

const stats = [
  { value: "500+", label: "estéticas activas" },
  { value: "10.000+", label: "turnos por mes" },
  { value: "98%", label: "clientes que renuevan" },
  { value: "0", label: "doble bookings" },
]

const steps = [
  { number: "01", title: "Cargás tu equipo", description: "Agregás tus profesionales, servicios y equipos disponibles." },
  { number: "02", title: "Abrís la agenda", description: "Tus turnos se organizan solos en el calendario visual." },
  { number: "03", title: "El sistema trabaja", description: "Recordatorios, fichas y pagos en piloto automático." },
]

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

const plans = [
  {
    name: "Básico",
    price: "$25.000",
    originalPrice: "$35.000",
    discount: "28% OFF",
    description: "Para empezar",
    highlight: false,
    features: [
      "1 profesional",
      "1 sucursal",
      "Agenda ilimitada",
      "Ficha clínica digital",
      "Soporte incluido",
    ],
  },
  {
    name: "Pro",
    price: "$45.000",
    originalPrice: "$65.000",
    discount: "30% OFF",
    description: "El más elegido",
    highlight: true,
    features: [
      "Hasta 3 profesionales",
      "1 sucursal",
      "Agenda ilimitada",
      "Control de equipos",
      "Ficha clínica digital",
      "Soporte incluido",
    ],
  },
  {
    name: "Avanzado",
    price: "$80.000",
    originalPrice: "$110.000",
    discount: "27% OFF",
    description: "Para clínicas en crecimiento",
    highlight: false,
    features: [
      "Hasta 6 profesionales",
      "Hasta 2 sucursales",
      "Agenda ilimitada",
      "Control de equipos",
      "Ficha clínica digital",
      "Soporte prioritario",
    ],
  },
]

const faqs = [
  {
    q: "¿Necesito instalar algo?",
    a: "No. reservApp es 100% web. Funciona desde cualquier celular, tablet o computadora, sin descargas ni configuraciones.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. Sin permanencia ni penalidad. Cancelás en cualquier momento desde tu cuenta.",
  },
  {
    q: "¿Funciona para varias sucursales?",
    a: "Sí. El plan Avanzado incluye hasta 2 sucursales desde una sola cuenta, con equipos y agendas independientes por sede.",
  },
  {
    q: "¿Los recordatorios de WhatsApp están incluidos en el plan?",
    a: "Son un add-on disponible en todos los planes. Se activa fácilmente desde la configuración y se cobra por mensaje enviado.",
  },
  {
    q: "¿Puedo probar antes de pagar?",
    a: "Sí, tenés 14 días gratis sin necesidad de tarjeta de crédito. Sin compromiso.",
  },
  {
    q: "¿Qué pasa con mis datos si cancelo?",
    a: "Son tuyos. Podés exportar toda tu información — pacientes, fichas, historial de tratamientos — antes de cancelar.",
  },
]

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Nav */}
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
        <Image src="/loguito.png" alt="reservApp" width={120} height={120} className="rounded-lg" />
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
          <a href="#features" className="hover:text-gray-900 transition-colors">Funciones</a>
          <a href="#how" className="hover:text-gray-900 transition-colors">Cómo funciona</a>
          <a href="#testimonials" className="hover:text-gray-900 transition-colors">Testimonios</a>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">Precios</a>
          <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
        </nav>
        <Link
          href="/login"
          className="text-sm px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:border-violet-500 hover:text-violet-600 transition-colors font-medium"
        >
          Ingresar
        </Link>
      </header>

      {/* Hero */}
      <section className="relative px-6 py-28 text-center max-w-3xl mx-auto overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.07)_0%,_transparent_70%)]" />
        <span className="inline-block text-xs font-medium px-3 py-1 rounded-full border border-violet-200 bg-violet-50 text-violet-600 mb-6">
          Agenda clínica · Recordatorios · Ficha clínica
        </span>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-gray-900">
          La agenda que tu estética{" "}
          <span className="text-violet-600">necesitaba</span>
        </h1>
        <p className="text-gray-500 text-lg mb-10 leading-relaxed">
          Organizá turnos, profesionales y equipos desde un solo sistema. Sin planillas, sin WhatsApps perdidos, sin doble booking.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-violet-600 text-white rounded-md font-semibold hover:bg-violet-500 transition-colors"
          >
            Empezar gratis
          </Link>
          <a
            href="#features"
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            Ver funciones
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-200 bg-gray-50 px-6 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-bold text-violet-600 mb-1">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20 max-w-5xl mx-auto">
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

      {/* How it works */}
      <section id="how" className="px-6 py-20 bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto text-center mb-14">
          <h2 className="text-3xl font-bold mb-3 text-gray-900">Cómo funciona</h2>
          <p className="text-gray-500">Tres pasos y tu agenda está funcionando.</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(({ number, title, description }) => (
            <div key={number} className="text-center">
              <p className="text-6xl font-bold text-violet-200 mb-4">{number}</p>
              <h3 className="font-semibold mb-2 text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3 text-gray-900">Lo que dicen nuestras usuarias</h2>
          <p className="text-gray-500">Estéticas reales, resultados reales.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, place, photo, quote }) => (
            <div
              key={name}
              className="p-6 rounded-xl border border-gray-200 bg-white flex flex-col gap-4 hover:border-violet-300 hover:shadow-sm transition-all"
            >
              <p className="text-3xl text-violet-300 font-serif leading-none">&ldquo;</p>
              <p className="text-sm text-gray-600 leading-relaxed flex-1">{quote}</p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={photo}
                    alt={name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400">{role}</p>
                  <p className="text-xs text-violet-500">{place}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20 max-w-5xl mx-auto text-center">
        <span className="inline-block text-xs font-medium px-3 py-1 rounded-full border border-violet-200 bg-violet-50 text-violet-600 mb-6">
          Precio de lanzamiento
        </span>
        <h2 className="text-3xl font-bold mb-3 text-gray-900">Simple y sin sorpresas</h2>
        <p className="text-gray-500 mb-12">Elegí el plan que se adapta a tu estética. Cancelás cuando quieras.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl overflow-hidden ${
                plan.highlight
                  ? "border border-violet-400 bg-white shadow-[0_0_40px_rgba(124,58,237,0.12)] md:-mt-4"
                  : "border border-gray-200 bg-white shadow-sm"
              }`}
            >
              {plan.highlight && (
                <div className="bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white tracking-wide">
                  ✦ MÁS POPULAR
                </div>
              )}
              <div className="p-8">
                <p className="text-gray-500 text-sm mb-1">{plan.description}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-2 mt-4 mb-1">
                  <span className="text-gray-400 text-lg line-through">{plan.originalPrice}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-500 text-white">
                    {plan.discount}
                  </span>
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-1">{plan.price}</p>
                <p className="text-gray-400 text-xs mb-8">ARS / mes</p>

                <ul className="text-sm text-left space-y-3 mb-8">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle size={15} className="text-violet-500 shrink-0" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`block w-full py-3 rounded-md font-semibold transition-colors ${
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
        </div>

        {/* WhatsApp add-on */}
        <div className="mt-8 inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
          <span className="text-lg">💬</span>
          <span>
            <span className="text-gray-900 font-medium">Recordatorios por WhatsApp</span>
            {" "}— add-on disponible en todos los planes. Se cobra por mensaje enviado.
          </span>
        </div>

        <p className="text-xs text-gray-400 mt-4">No necesitás tarjeta de crédito para empezar</p>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-20 bg-gray-50 border-y border-gray-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3 text-gray-900">Preguntas frecuentes</h2>
            <p className="text-gray-500">Todo lo que necesitás saber antes de empezar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map(({ q, a }) => (
              <div key={q} className="p-6 rounded-xl bg-white border border-gray-200">
                <p className="font-semibold text-gray-900 mb-2">{q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-24 text-center bg-violet-600">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Tu estética organizada desde hoy
        </h2>
        <p className="text-violet-200 mb-10 text-lg max-w-xl mx-auto">
          14 días gratis, sin tarjeta de crédito. Empezás en minutos.
        </p>
        <Link
          href="/login"
          className="inline-block px-10 py-4 bg-white text-violet-600 rounded-md font-bold text-lg hover:bg-violet-50 transition-colors"
        >
          Empezar gratis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-8 text-center text-sm text-gray-400">
        <p>© 2026 reservApp · Hecho para estéticas argentinas</p>
      </footer>

    </div>
  )
}
