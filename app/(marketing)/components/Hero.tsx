import Link from "next/link"

export function Hero() {
  return (
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
  )
}
