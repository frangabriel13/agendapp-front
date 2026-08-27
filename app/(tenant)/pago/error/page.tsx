import { XCircle } from "lucide-react"
import { PaymentReturn } from "@/features/payments/components/PaymentReturn"

export const metadata = {
  title: "No se pudo completar el pago",
  robots: { index: false, follow: false },
}

/**
 * El pago no se concretó.
 *
 * **Ámbar y no rojo, y sin la palabra "error".** Que una tarjeta rechace un cargo
 * no es culpa de quien la usó, y el cartel rojo de una pantalla que no explica
 * nada se lee como un reto. Lo único que importa decir es que **no se cobró
 * nada** —el miedo real de quien llega acá es que le hayan descontado igual— y
 * que el mismo link sigue sirviendo.
 */
export default function PagoErrorPage() {
  return (
    <PaymentReturn
      icon={XCircle}
      tone="amber"
      title="No se pudo completar el pago"
      description="No te cobramos nada. Podés volver a intentarlo con el mismo link que te pasaron."
      footnote="Si vuelve a fallar, escribile al negocio y lo resuelven con vos."
    />
  )
}
