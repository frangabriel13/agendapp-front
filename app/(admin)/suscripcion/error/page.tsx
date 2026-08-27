import Link from "next/link"
import { XCircle } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { ResultCard } from "@/components/ResultCard"
import { Page } from "../../ui/Page"

export const metadata = {
  title: "No se pudo completar el pago",
  robots: { index: false, follow: false },
}

/**
 * El pago no se concretó.
 *
 * Ámbar y no rojo: que una tarjeta rechace un cargo no es culpa de quien la usó.
 * Lo que importa decir es que **no se cobró nada** y por dónde volver a intentar.
 */
export default function SuscripcionErrorPage() {
  return (
    <Page width="narrow" className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-black/[0.07] bg-white p-8">
        <ResultCard
          icon={XCircle}
          tone="amber"
          title="No se pudo completar el pago"
          description="No te cobramos nada. Podés generar el link de nuevo desde tu suscripción."
        >
          <Link href="/configuracion" className={cn(cta({ block: true }), "mt-6")}>
            Volver a intentar
          </Link>
        </ResultCard>
      </div>
    </Page>
  )
}
