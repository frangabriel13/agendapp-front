import Image from "next/image"
import { CtaLink } from "@/components/CtaLink"
import { Glow } from "@/components/Glow"

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-x-clip bg-white px-6 text-center text-neutral-900 antialiased">
      <Glow className="left-1/2 top-1/2 h-[26rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 bg-violet-500/20" />

      {/* El archivo es 1024×312: declararlo cuadrado reserva un hueco que la
          imagen no ocupa y salta el layout al cargar. */}
      <Image src="/loguito.png" alt="reservApp" width={1024} height={312} className="mb-8 h-8 w-auto" />

      <p aria-hidden className="mb-2 text-7xl font-semibold tracking-tight text-violet-200 select-none">
        404
      </p>
      <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Esta página no existe</h1>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-neutral-500">
        Puede que el link esté roto o que la página haya sido eliminada.
      </p>

      <CtaLink href="/" size="lg" className="mt-8">
        Volver al inicio
      </CtaLink>
    </div>
  )
}
