"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCw } from "lucide-react"
import { CtaLink, cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 text-neutral-900 antialiased">
      <div className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white p-8 text-center shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <span
          aria-hidden
          className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500"
        >
          <AlertTriangle size={20} />
        </span>

        <h1 className="text-lg font-semibold tracking-tight text-neutral-900">Algo salió mal</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          No pudimos cargar esta página. Podés reintentar o volver al inicio.
        </p>

        {/* En producción Next reemplaza el mensaje por uno genérico y deja el digest. */}
        {process.env.NODE_ENV === "development" && (
          <p className="mt-6 rounded-xl border border-red-100 bg-red-50 p-3 text-left font-mono text-xs break-words text-red-600">
            {error.message}
          </p>
        )}

        <div className="mt-7 flex justify-center gap-2">
          <button onClick={reset} className={cn(cta({ size: "sm" }))}>
            <RotateCw size={15} />
            Reintentar
          </button>
          <CtaLink href="/" variant="outline" size="sm">
            Ir al inicio
          </CtaLink>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-neutral-400">
            Código de error: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  )
}
