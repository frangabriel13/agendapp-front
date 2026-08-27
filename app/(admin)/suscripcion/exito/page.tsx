import { Page } from "../../ui/Page"
import { SubscriptionReturn } from "@/features/tenants/components/SubscriptionReturn"

export const metadata = {
  title: "Pago de la suscripción",
  robots: { index: false, follow: false },
}

/**
 * Vive dentro del panel y no en una pantalla suelta: **acá vuelve el dueño, que
 * tiene sesión**. Devolverlo a su panel es devolverlo a donde estaba, y de paso el
 * guard del layout resuelve el caso de que la sesión se haya caído mientras pagaba.
 */
export default function SuscripcionExitoPage() {
  return (
    <Page width="narrow" className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-black/[0.07] bg-white p-8">
        <SubscriptionReturn />
      </div>
    </Page>
  )
}
