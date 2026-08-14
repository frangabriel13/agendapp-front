import { cardSurface } from "../ui/Card"
import { Section } from "../ui/Section"
import { SectionHeading } from "../ui/SectionHeading"

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
    <Section id="faq" width="narrow" muted>
      <SectionHeading
        badge="Preguntas frecuentes"
        title="Todo lo que necesitás saber"
        subtitle="Y si queda alguna duda, escribinos y te respondemos."
        className="mb-14"
      />

      <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {faqs.map(({ q, a }) => (
          <div key={q} className={`${cardSurface} p-6`}>
            <dt className="font-semibold tracking-tight text-neutral-900">{q}</dt>
            <dd className="mt-2 text-[13px] leading-relaxed text-neutral-500">{a}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
