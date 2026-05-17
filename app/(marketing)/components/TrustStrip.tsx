const items = [
  { value: "14 días", label: "gratis, sin tarjeta" },
  { value: "0", label: "doble bookings" },
  { value: "100%", label: "web, sin instalar nada" },
  { value: "Sin", label: "permanencia ni penalidad" },
]

export function TrustStrip() {
  return (
    <section className="border-y border-gray-200 bg-gray-50 px-6 py-12">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {items.map(({ value, label }) => (
          <div key={label}>
            <p className="text-3xl font-bold text-violet-600 mb-1">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
