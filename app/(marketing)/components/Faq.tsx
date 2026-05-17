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

export function Faq() {
  return (
    <section id="faq" className="px-6 py-20 bg-gray-50 border-y border-gray-200 scroll-mt-20">
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
  )
}
