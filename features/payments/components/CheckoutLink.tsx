"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { formatCents } from "@/features/catalog/lib/money"

/**
 * El link de pago que espera al cliente.
 *
 * **Que exista el link no significa que se haya cobrado.** El cobro online es en
 * dos tiempos: esto crea el pago *pendiente* y quien lo confirma es Mercado Pago
 * avisándole al backend, de segundos a minutos después. Por eso el bloque es
 * ámbar y no verde, y por eso lo dice con todas las letras: es el malentendido
 * más caro que puede tener esta pantalla —dar por cobrado algo que no entró.
 */
export function CheckoutLink({ url, amountCents }: { url: string; amountCents: number }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      // `navigator.clipboard` no existe fuera de un contexto seguro —servir el
      // panel por http en una IP de la red local, por ejemplo—. El link se ve
      // completo abajo, así que siempre queda la salida de seleccionarlo a mano.
      setCopiado(false)
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-[13px] font-medium text-amber-900">
        Link de pago por {formatCents(amountCents)}
      </p>
      <p className="mt-0.5 text-xs text-amber-800/80">
        Todavía no está pago. Se acredita cuando el cliente paga y nos avisa Mercado Pago.
      </p>

      {/* El link completo a la vista, y no solo el botón de copiar: si el
          portapapeles no está disponible, seleccionarlo a mano es la salida. */}
      <p className="mt-2 truncate font-mono text-[11px] text-amber-900/70" title={url}>
        {url}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copiar}
          className={cn(cta({ variant: "outline", size: "sm" }), "border-amber-300 bg-white/70")}
        >
          {copiado ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          {copiado ? "Copiado" : "Copiar link"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(cta({ variant: "outline", size: "sm" }), "border-amber-300 bg-white/70")}
        >
          <ExternalLink size={14} aria-hidden />
          Abrir
        </a>
      </div>
    </div>
  )
}
