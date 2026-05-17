const steps = [
  { number: "01", title: "Cargás tu equipo", description: "Agregás tus profesionales, servicios y equipos disponibles." },
  { number: "02", title: "Abrís la agenda", description: "Tus turnos se organizan solos en el calendario visual." },
  { number: "03", title: "El sistema trabaja", description: "Recordatorios, fichas y pagos en piloto automático." },
]

export function HowItWorks() {
  return (
    <section id="how" className="px-6 py-20 bg-gray-50 border-y border-gray-200 scroll-mt-20">
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
  )
}
