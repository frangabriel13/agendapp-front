import Image from "next/image"

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
    <section id="testimonials" className="px-6 py-20 max-w-5xl mx-auto scroll-mt-20">
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
            <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                <Image src={photo} alt={name} fill className="object-cover" />
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
  )
}
