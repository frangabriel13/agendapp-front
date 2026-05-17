import Link from "next/link"

export function FinalCta() {
  return (
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
  )
}
