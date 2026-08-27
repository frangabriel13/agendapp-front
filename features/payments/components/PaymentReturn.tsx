import Image from "next/image"
import type { LucideIcon } from "lucide-react"
import { ResultCard } from "@/components/ResultCard"

interface Props {
  icon: LucideIcon
  tone: "emerald" | "amber" | "violet"
  title: string
  description: React.ReactNode
  /** La línea chica de abajo. Lo que conviene saber pero no es el mensaje. */
  footnote?: string
}

/**
 * La vuelta del checkout de Mercado Pago.
 *
 * **Quien lee esto es el cliente del negocio, no quien usa el panel**: no tiene
 * cuenta, no hay a dónde mandarlo y no hay nada que pueda hacer acá. Por eso la
 * tarjeta no lleva ninguna salida — un botón "Ir al panel" sería una puerta a un
 * lugar donde no puede entrar.
 *
 * **Y por eso tampoco consulta nada.** Volver por una de estas tres URLs no
 * prueba en qué quedó el pago: el estado real se lo dice Mercado Pago al backend
 * por su cuenta, y no hay endpoint público para preguntarlo. Todo lo que estas
 * pantallas pueden hacer honestamente es contar qué sigue.
 */
export function PaymentReturn({ icon, tone, title, description, footnote }: Props) {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-8 shadow-[0_2px_4px_rgba(0,0,0,0.04),0_24px_48px_-20px_rgba(80,40,160,0.28)]">
        <Image
          src="/loguito.png"
          alt="reservApp"
          width={1024}
          height={312}
          priority
          className="mx-auto mb-7 h-9 w-auto"
        />

        <ResultCard icon={icon} tone={tone} title={title} description={description}>
          {footnote && <p className="mt-6 text-xs leading-relaxed text-neutral-400">{footnote}</p>}
        </ResultCard>
      </div>
    </div>
  )
}
