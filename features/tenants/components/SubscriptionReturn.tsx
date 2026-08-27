"use client"

import Link from "next/link"
import { CheckCircle2, Loader2 } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { ResultCard } from "@/components/ResultCard"
import { useSubscription } from "../hooks/useTenant"
import { estadoSuscripcion, hayPagoEsperando } from "../lib/subscription"

/**
 * La vuelta del checkout de la suscripción, **cuando salió bien**.
 *
 * **Acá sí se puede consultar, y por eso se hace.** Es la diferencia con
 * `/pago/*`: eso lo abre el cliente del negocio, que no tiene sesión ni hay
 * endpoint público para preguntar nada. Esto lo abre el dueño, autenticado, así
 * que en vez de un cartel fijo la pantalla espera la confirmación real y la
 * cuenta cuando llega.
 *
 * **Mientras tanto no dice "listo".** Volver por esta URL no prueba que el pago
 * se acreditó: lo confirma Mercado Pago avisándole al backend, y eso tarda. El
 * signo de que terminó es que no quede ningún cobro `PENDING`, no que la cuenta
 * figure al día —quien paga por adelantado ya estaba al día antes de pagar.
 */
export function SubscriptionReturn() {
  const query = useSubscription({ esperandoPago: true })

  const esperando = query.data === undefined || hayPagoEsperando(query.data)

  if (esperando) {
    return (
      <ResultCard
        icon={Loader2}
        spin
        title="Recibimos tu pago"
        description="Mercado Pago nos lo está confirmando. Suele tardar unos minutos y esta pantalla se actualiza sola."
      >
        <Salidas />
      </ResultCard>
    )
  }

  const estado = estadoSuscripcion(query.data)

  return (
    <ResultCard
      icon={CheckCircle2}
      tone="emerald"
      title="Listo, el pago se acreditó"
      description={`${estado.titulo}. ${estado.detalle}`}
    >
      <Salidas />
    </ResultCard>
  )
}

function Salidas() {
  return (
    <div className="mt-6 flex flex-col gap-2">
      <Link href="/dashboard" className={cta({ block: true })}>
        Ir al panel
      </Link>
      <Link
        href="/configuracion"
        className={cn(cta({ variant: "outline", block: true }))}
      >
        Ver mi suscripción
      </Link>
    </div>
  )
}
