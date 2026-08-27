import { Clock } from "lucide-react"
import { PaymentReturn } from "@/features/payments/components/PaymentReturn"

export const metadata = {
  title: "Pago pendiente",
  robots: { index: false, follow: false },
}

/**
 * El pago quedó a la espera: efectivo en un Rapipago, una transferencia en
 * revisión, un débito que todavía no salió.
 *
 * **Es un desenlace distinto del éxito, no una variante.** Ahí el cliente ya
 * pagó y falta que nos avisen; acá todavía falta que pague. Meterlos en la misma
 * pantalla haría que uno de los dos textos mienta.
 */
export default function PagoPendientePage() {
  return (
    <PaymentReturn
      icon={Clock}
      tone="amber"
      title="Tu pago quedó pendiente"
      description="Mercado Pago todavía no lo acreditó. Si elegiste pagar en efectivo o por transferencia, se acredita cuando completes el pago."
      footnote="Mercado Pago te avisa cuando esté listo. El turno se confirma en ese momento."
    />
  )
}
