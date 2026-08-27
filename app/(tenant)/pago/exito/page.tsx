import { CheckCircle2 } from "lucide-react"
import { PaymentReturn } from "@/features/payments/components/PaymentReturn"

export const metadata = {
  title: "Pago recibido",
  // La URL trae identificadores del cobro: no tiene sentido indexarla.
  robots: { index: false, follow: false },
}

/**
 * A donde vuelve el cliente cuando Mercado Pago aceptó el pago.
 *
 * **No dice "listo, está pago", y es la decisión de toda la pantalla.** Volver
 * por acá no garantiza que el cobro esté acreditado: quien lo confirma es Mercado
 * Pago avisándole al backend, y eso llega después. Escribir "pago confirmado"
 * sería la mentira más fácil y la más cara —alguien se presenta al turno creyendo
 * que pagó la seña.
 */
export default function PagoExitoPage() {
  return (
    <PaymentReturn
      icon={CheckCircle2}
      tone="emerald"
      title="Recibimos tu pago"
      description="Mercado Pago nos lo está confirmando. Suele tardar unos minutos y el negocio lo ve apenas se acredita."
      footnote="No hace falta que hagas nada más. Ya podés cerrar esta ventana."
    />
  )
}
