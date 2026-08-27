import Link from "next/link"
import { Clock } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { ResultCard } from "@/components/ResultCard"
import { Page } from "../../ui/Page"

export const metadata = {
  title: "Pago pendiente",
  robots: { index: false, follow: false },
}

/**
 * El pago quedó a la espera: efectivo en un Rapipago, una transferencia en
 * revisión.
 *
 * **Esta no espera nada, a diferencia de la de éxito.** Ahí la confirmación llega
 * en minutos y tiene sentido quedarse mirando; acá puede tardar días hábiles, y
 * una pantalla girando todo ese rato solo consigue que parezca colgada.
 */
export default function SuscripcionPendientePage() {
  return (
    <Page width="narrow" className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-black/[0.07] bg-white p-8">
        <ResultCard
          icon={Clock}
          tone="amber"
          title="Tu pago quedó pendiente"
          description="Mercado Pago todavía no lo acreditó. Si elegiste pagar en efectivo o por transferencia, se acredita cuando completes el pago."
        >
          <p className="mt-3 text-xs leading-relaxed text-neutral-400">
            Mientras tanto podés seguir trabajando normalmente. Si ya venías con atraso, el alta
            de turnos se reactiva cuando el pago entre.
          </p>
          <Link href="/configuracion" className={cn(cta({ block: true }), "mt-6")}>
            Ver mi suscripción
          </Link>
        </ResultCard>
      </div>
    </Page>
  )
}
