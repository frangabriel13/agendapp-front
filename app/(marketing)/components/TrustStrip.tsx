const items = [
  { value: "14 días", label: "gratis, sin tarjeta" },
  { value: "0", label: "doble bookings" },
  { value: "100%", label: "web, sin instalar nada" },
  { value: "Sin", label: "permanencia ni penalidad" },
]

export function TrustStrip() {
  return (
    <section className="px-6 py-14">
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
        Sin letra chica
      </p>
      <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-y-8 md:grid-cols-4">
        {items.map(({ value, label }, i) => (
          <div
            key={label}
            className={`px-4 text-center ${i > 0 ? "md:border-l md:border-black/[0.07]" : ""}`}
          >
            <p className="text-2xl font-semibold tracking-tight text-neutral-900">{value}</p>
            <p className="mt-1 text-[13px] text-neutral-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
